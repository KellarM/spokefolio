// A login made with "remember me" off lives here instead of local storage: it keeps the visit
// alive across page loads, then disappears when the browser closes.
const KEY = 'base44_session_token';

export const getSessionToken = () =>
  typeof window === 'undefined' ? null : window.sessionStorage.getItem(KEY);

export const setSessionToken = (token) => {
  if (typeof window !== 'undefined' && token) window.sessionStorage.setItem(KEY, token);
};

export const clearSessionToken = () => {
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(KEY);
};

// A sign-in made moments ago hands exactly one page load through the door.
// The mark survives the redirect that follows a sign-in (and the round trip to
// a provider) but is read and deleted at startup, so a later reload or restart
// begins signed out and the person signs in again.
const HANDOFF_KEY = 'sf_signin_handoff';

export const markSignInHandoff = () => {
  if (typeof window !== 'undefined') window.sessionStorage.setItem(HANDOFF_KEY, '1');
};

export const consumeSignInHandoff = () => {
  if (typeof window === 'undefined') return false;
  const seen = window.sessionStorage.getItem(HANDOFF_KEY) === '1';
  window.sessionStorage.removeItem(HANDOFF_KEY);
  return seen;
};