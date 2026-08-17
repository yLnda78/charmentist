// CHARMENTIST — account authentication
// ---------------------------------------------------------------------
// Talks to the real backend (see /backend) — accounts, password hashing,
// and sessions live server-side now instead of in localStorage. Only the
// JWT token and a cached copy of the user's own public profile
// (email/name — never the password) are kept in localStorage, so pages
// can still read CharmAuth.currentUser() synchronously without an extra
// network round trip on every page load.
//
// CHARM_API_BASE can be set on window before this script loads (e.g. in a
// small inline <script> in <head>) to point at a deployed backend instead
// of localhost during development.
// ---------------------------------------------------------------------

const CharmAuth = (function(){
  const API_BASE = window.CHARM_API_BASE || 'http://localhost:4000/api';
  const TOKEN_KEY = 'charm_token';
  const USER_CACHE_KEY = 'charm_user';

  function getToken(){ try{ return localStorage.getItem(TOKEN_KEY); }catch(e){ return null; } }
  function setSession(token, user){
    try{
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    }catch(e){}
  }
  function clearSession(){
    try{ localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_CACHE_KEY); }catch(e){}
  }
  function normalizeEmail(email){ return (email || '').trim().toLowerCase(); }

  async function apiFetch(path, options){
    options = options || {};
    const token = getToken();
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    if(token) headers.Authorization = 'Bearer ' + token;
    let res, data;
    try{
      res = await fetch(API_BASE + path, Object.assign({}, options, { headers }));
      data = await res.json().catch(()=>({}));
    }catch(networkErr){
      throw { networkError: true, error: 'Could not reach the server. Check your connection and try again.' };
    }
    if(!res.ok) throw Object.assign({ status: res.status }, data);
    return data;
  }

  // Does this email already have an account? Used by the sign-in page to
  // decide whether to show "enter your password" or "create a password".
  async function emailExists(email){
    try{
      const data = await apiFetch('/auth/exists?email=' + encodeURIComponent(normalizeEmail(email)));
      return !!data.exists;
    }catch(e){ return false; }
  }

  // Creates a new account. Fails if the email is already registered.
  async function register(email, password, name){
    try{
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: normalizeEmail(email), password, name })
      });
      setSession(data.token, data.user);
      return { ok: true };
    }catch(e){
      return { ok: false, error: e.networkError ? e.error : (e.error || 'Could not create account.') };
    }
  }

  // Logs in only if the email exists AND the password matches it.
  async function login(email, password){
    try{
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: normalizeEmail(email), password })
      });
      setSession(data.token, data.user);
      return { ok: true };
    }catch(e){
      if(e.networkError) return { ok: false, error: e.error };
      // Backend intentionally returns one generic message for both "no
      // account" and "wrong password" so this can't be used to find out
      // which emails are registered — surfaced to the UI as wrong-password,
      // matching this file's previous behavior/wording.
      return { ok: false, error: 'wrong-password' };
    }
  }

  // Current logged-in user's public profile (email, name), or null.
  // Reads the cache written at login/register time — no network call, so
  // every page can call this synchronously the same way as before.
  function currentUser(){
    if(!getToken()) return null;
    try{ return JSON.parse(localStorage.getItem(USER_CACHE_KEY) || 'null'); }
    catch(e){ return null; }
  }

  function isLoggedIn(){ return !!currentUser(); }

  function logout(){ clearSession(); }

  // Updates the display name on the current logged-in user's account.
  async function updateName(name){
    try{
      await apiFetch('/auth/me', { method: 'PATCH', body: JSON.stringify({ name: (name || '').trim() }) });
      const user = currentUser();
      if(user){ user.name = (name || '').trim(); setSession(getToken(), user); }
      return { ok: true };
    }catch(e){
      return { ok: false, error: e.networkError ? e.error : (e.error || 'Could not update name.') };
    }
  }

  // Changes the current logged-in user's password. Requires the correct
  // current password, verified server-side.
  async function changePassword(oldPassword, newPassword){
    try{
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword })
      });
      return { ok: true };
    }catch(e){
      return { ok: false, error: e.networkError ? e.error : (e.error || 'Could not change password.') };
    }
  }

  return { emailExists, register, login, logout, currentUser, isLoggedIn, updateName, changePassword, getToken, apiFetch };
})();
