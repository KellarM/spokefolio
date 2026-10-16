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