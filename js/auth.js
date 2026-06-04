/**
 * Auth Module — window.AppAuth
 *
 * Provides client-side authentication using localStorage.
 * Handles registration, login, logout, and session management.
 *
 * Storage keys:
 *   - 'repoauditor_users'   → JSON array of user objects
 *   - 'repoauditor_session' → JSON object of the logged-in user
 */
(function () {
  'use strict';

  var USERS_KEY = 'repoauditor_users';
  var SESSION_KEY = 'repoauditor_session';

  /* ---- Helpers ---- */

  /**
   * Simple Base64 encode for password obfuscation.
   * NOT secure — purely for frontend simulation.
   */
  function encodePassword(password) {
    try {
      return btoa(unescape(encodeURIComponent(password)));
    } catch (e) {
      return btoa(password);
    }
  }

  /** Returns all registered users from localStorage. */
  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  /** Saves the users array to localStorage. */
  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  /* ---- Public API ---- */

  /**
   * Register a new user.
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @returns {{ success: boolean, message: string }}
   */
  function register(name, email, password) {
    var users = getUsers();
    var normalizedEmail = email.toLowerCase().trim();

    // Check for duplicate email
    var exists = users.some(function (u) {
      return u.email === normalizedEmail;
    });
    if (exists) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    var newUser = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name.trim(),
      email: normalizedEmail,
      password: encodePassword(password),
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    // Auto-login after registration
    setSession(newUser);

    return { success: true, message: 'Account created successfully!' };
  }

  /**
   * Log in with email and password.
   * @param {string} email
   * @param {string} password
   * @returns {{ success: boolean, message: string }}
   */
  function login(email, password) {
    var users = getUsers();
    var normalizedEmail = email.toLowerCase().trim();
    var encodedPw = encodePassword(password);

    var user = users.find(function (u) {
      return u.email === normalizedEmail && u.password === encodedPw;
    });

    if (!user) {
      return { success: false, message: 'Invalid email or password.' };
    }

    setSession(user);
    return { success: true, message: 'Logged in successfully!' };
  }

  /** Log out the current user. */
  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  /** Returns the current logged-in user object, or null. */
  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
    } catch (e) {
      return null;
    }
  }

  /** Returns true if a user is currently logged in. */
  function isLoggedIn() {
    return getCurrentUser() !== null;
  }

  /** Stores the session for a user (excluding password). */
  function setSession(user) {
    var session = {
      id: user.id,
      name: user.name,
      email: user.email
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  /* ---- Expose ---- */
  window.AppAuth = {
    register: register,
    login: login,
    logout: logout,
    getCurrentUser: getCurrentUser,
    isLoggedIn: isLoggedIn
  };
})();
