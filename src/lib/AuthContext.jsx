import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { clearSessionToken, getSessionToken } from '@/lib/sessionToken';

// The context object is pinned to the window so a hot update of this file -
// which can leave the mounted provider on an older copy while consumers such
// as the account menu get the new one - still hands everyone the same object.
// Without the pin, useAuth reads an empty context and throws.
const AUTH_CONTEXT_KEY = '__spokefolioAuthContext';
const AuthContext =
  globalThis[AUTH_CONTEXT_KEY] || (globalThis[AUTH_CONTEXT_KEY] = createContext());

// A remembered session must not outlive its owner's attention by too long.
// Eight hours idle (either in one sitting or across visits - the clock is
// persisted) and the key is withdrawn: on the next visit the person signs
// in again. A session-only sign-in never needed this; a remembered one did.
const IDLE_LIMIT_MS = 8 * 60 * 60 * 1000;
const IDLE_CHECK_MS = 5 * 60 * 1000;
const IDLE_KEY = 'sf_last_activity';

let lastActivityWrite = 0;
const touchActivity = () => {
  const now = Date.now();
  if (now - lastActivityWrite < 60000) return;
  lastActivityWrite = now;
  try {
    window.localStorage.setItem(IDLE_KEY, String(now));
  } catch {
    // Private modes refuse storage; the interval check below still works in-memory.
  }
};

const readActivity = () => {
  try {
    return Number(window.localStorage.getItem(IDLE_KEY) || '0');
  } catch {
    return Date.now();
  }
};

const clearRememberedKeys = () => {
  try {
    window.localStorage.removeItem('base44_access_token');
    window.localStorage.removeItem('token');
    window.localStorage.removeItem(IDLE_KEY);
  } catch {
    // Nothing to sweep in environments without storage.
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      // A session-only login (remember me off) is handed to the SDK in memory, never saved here.
      const sessionToken = getSessionToken();
      if (sessionToken && !appParams.token) {
        base44.auth.setToken(sessionToken, false);
      }
      
      try {
        const publicSettings = await base44.app.getPublicSettings();
        setAppPublicSettings(publicSettings);
        
        // If we got the app public settings successfully, check if user is authenticated
        if (appParams.token || sessionToken) {
          await checkUserAuth();
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
          setAuthChecked(true);
        }
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);
        
        // Handle app-level errors
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({
              type: 'auth_required',
              message: 'Authentication required'
            });
          } else if (reason === 'user_not_registered') {
            setAuthError({
              type: 'user_not_registered',
              message: 'User not registered for this app'
            });
          } else {
            setAuthError({
              type: reason,
              message: appError.message
            });
          }
        } else {
          setAuthError({
            type: 'unknown',
            message: appError.message || 'Failed to load app'
          });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      
      // If user auth fails, it might be an expired token
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    clearSessionToken();
    // A remembered key dies with the session, not with the browser: signing
    // out must work on a shared computer, not just on the owner's own.
    clearRememberedKeys();
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      // Use the SDK's logout method which handles token cleanup and redirect
      base44.auth.logout(window.location.href);
    } else {
      // Just remove the token without redirect
      base44.auth.logout();
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    // A remembered session that sat idle past the limit is closed on arrival,
    // before any studio data is fetched.
    if (readActivity() && Date.now() - readActivity() > IDLE_LIMIT_MS) {
      logout(false);
      window.location.assign('/login');
      return;
    }

    touchActivity();
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((name) => window.addEventListener(name, touchActivity, { passive: true }));

    const timer = setInterval(() => {
      if (Date.now() - readActivity() > IDLE_LIMIT_MS) {
        logout(false);
        window.location.assign('/login');
      }
    }, IDLE_CHECK_MS);

    return () => {
      events.forEach((name) => window.removeEventListener(name, touchActivity));
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const navigateToLogin = () => {
    // Use the SDK's redirectToLogin method
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};