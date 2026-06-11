/**
 * Auth Module — window.AppAuth
 *
 * Provides client-side authentication backed by the FastAPI JWT system.
 * Tokens are stored in localStorage; passwords are NEVER stored client-side.
 *
 * Storage keys:
 *   - 'repoauditor_token'   → JWT access token string
 *   - 'repoauditor_user'    → JSON object of the logged-in user profile
 */
(function () {
  'use strict';

  var TOKEN_KEY = 'repoauditor_token';
  var USER_KEY = 'repoauditor_user';

  /* ---- Internal helpers ---- */

  /** Returns the FastAPI base URL from global config. */
  function apiBase() {
    return (window.AppConfig && window.AppConfig.API_BASE_URL) || '';
  }

  /** Generic JSON POST to the backend. */
  async function postJSON(path, body) {
    var res = await fetch(apiBase() + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    var data;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }

    if (!res.ok) {
      var message = (data && data.detail) || 'Request failed (' + res.status + ')';
      throw new Error(message);
    }

    return data;
  }

  /* ---- Public API ---- */

  /**
   * Register a new user via the FastAPI backend.
   * On success, stores the JWT and user profile.
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function register(name, email, password) {
    try {
      var data = await postJSON('/api/auth/register', {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: password,
      });

      setSession(data.access_token, data.user);
      return { success: true, message: 'Account created successfully!' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Log in with email and password via the FastAPI backend.
   * On success, stores the JWT and user profile.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function login(email, password) {
    try {
      var data = await postJSON('/api/auth/login', {
        email: email.toLowerCase().trim(),
        password: password,
      });

      setSession(data.access_token, data.user);
      return { success: true, message: 'Logged in successfully!' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Request a password reset email.
   * @param {string} email
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function forgotPassword(email) {
    try {
      var data = await postJSON('/api/auth/forgot-password', {
        email: email.toLowerCase().trim(),
      });
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Reset the password using a token from the email link.
   * @param {string} token
   * @param {string} newPassword
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function resetPassword(token, newPassword) {
    try {
      var data = await postJSON('/api/auth/reset-password', {
        token: token,
        new_password: newPassword,
      });
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  /** Log out the current user. */
  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /** Returns the stored JWT access token, or null. */
  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || null;
  }

  /** Returns the current logged-in user object, or null. */
  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY)) || null;
    } catch (e) {
      return null;
    }
  }

  /** Returns true if a user is currently logged in. */
  function isLoggedIn() {
    return getToken() !== null;
  }

  /** Stores the JWT and user profile in localStorage. */
  function setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /* ---- Expose ---- */
  window.AppAuth = {
    register: register,
    login: login,
    logout: logout,
    forgotPassword: forgotPassword,
    resetPassword: resetPassword,
    getCurrentUser: getCurrentUser,
    getToken: getToken,
    isLoggedIn: isLoggedIn,
  };
})();
