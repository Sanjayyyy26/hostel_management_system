/**
 * Authentication and API client for Hostellers.
 * Session stays in the browser; credentials live in PostgreSQL.
 */

const Auth = (() => {
  const DB_KEYS = {
    SESSION: "hm_session"
  };

  const SESSION_DURATION = 30 * 60 * 1000;
  const API_BASE = window.location.protocol === "file:" ? "http://localhost:3000" : "";

  const ACCESS_CONTROL = {
    admin: {
      allowedPages: [
        "Dashboard",
        "Announcements",
        "Complaints",
        "Hostel Blocks",
        "Hostel Room Allocation",
        "Hostel Room Evacuation",
        "Vacating Room",
        "Contact Us",
        "Admin Panel",
        "User Management",
        "Reports",
        "System Settings"
      ],
      defaultPage: "Dashboard"
    },
    student: {
      allowedPages: ["Dashboard", "Announcements", "Complaints", "Maintenance", "Non Local Outing", "Hostel Blocks", "Hostel Room Allocation", "Vacating Room", "Contact Us"],
      defaultPage: "Dashboard"
    },
    caretaker: {
      allowedPages: ["Dashboard", "Announcements", "Complaints", "Maintenance", "Room Inspection", "Hostel Blocks", "Student List", "Non Local Outing"],
      defaultPage: "Dashboard"
    }
  };

  async function api(path, options = {}) {
    const session = getSession();
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };
    if (session?.token) {
      headers.Authorization = `Bearer ${session.token}`;
    }

    const response = await fetch(API_BASE + path, { ...options, headers });
    const data = await response.json().catch(() => ({ success: false, message: "Invalid server response" }));
    if (!response.ok && !data.message) {
      data.message = `Request failed (${response.status})`;
    }
    if (response.status === 401 && path !== "/api/login") {
      destroySession();
      if (typeof showToast === "function") {
        showToast("Session expired. Please log in again.", "error");
      }
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
    return data;
  }

  async function validateCredentials(id, password, role) {
    try {
      const result = await api("/api/login", {
        method: "POST",
        body: JSON.stringify({ id, password, role })
      });
      if (!result.success) {
        return { success: false, message: result.message || "Login failed" };
      }
      return { success: true, user: { ...result.user, token: result.token } };
    } catch (error) {
      return { success: false, message: "Cannot reach the server. Start it with npm start." };
    }
  }

  async function register(userData) {
    try {
      return await api("/api/register", {
        method: "POST",
        body: JSON.stringify(userData)
      });
    } catch (error) {
      return { success: false, message: "Cannot reach the server. Start it with npm start." };
    }
  }

  function checkAccess(role, page) {
    return ACCESS_CONTROL[role]?.allowedPages.includes(page) || false;
  }

  function getDefaultPage(role) {
    return ACCESS_CONTROL[role]?.defaultPage || "Dashboard";
  }

  function createSession(user) {
    const session = {
      sessionId: user.token,
      token: user.token,
      userId: user.userId,
      name: user.name,
      role: user.role,
      email: user.email,
      roll: user.roll,
      room: user.room,
      block: user.block,
      block_id: user.block_id,
      room_id: user.room_id,
      gender: user.gender,
      year: user.year,
      phone: user.phone,
      loginTime: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION
    };
    localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(session));
    return session;
  }

  function updateSessionUser(updates) {
    const session = getSession();
    if (session) {
      Object.assign(session, updates);
      localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(session));
    }
    return session;
  }

  function getSession() {
    const session = JSON.parse(localStorage.getItem(DB_KEYS.SESSION) || "null");
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      destroySession();
      return null;
    }
    return session;
  }

  function refreshSession() {
    const session = getSession();
    if (session) {
      session.expiresAt = Date.now() + SESSION_DURATION;
      localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(session));
    }
    return session;
  }

  function destroySession() {
    localStorage.removeItem(DB_KEYS.SESSION);
  }

  function isLoggedIn() {
    return getSession() !== null;
  }

  function logout() {
    destroySession();
    return { success: true, message: "Logged out successfully" };
  }

  return {
    api,
    validateCredentials,
    checkAccess,
    getDefaultPage,
    register,
    createSession,
    updateSessionUser,
    getSession,
    refreshSession,
    isLoggedIn,
    logout,
    ACCESS_CONTROL
  };
})();
