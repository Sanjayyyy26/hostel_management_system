/**
 * Authentication Module for Hostel Management System
 * Implements FR-01 to FR-06: User registration, credential validation, 
 * role identification, access control, session management, logout
 */

const Auth = (() => {
  // ==================== DATABASE SCHEMA ====================
  // Tables as per requirements:
  // Admin Table: { key: string, password: string, name: string }
  // Hostel_Login Table: { hostel_id: string, password: string, role: string, name: string }
  
  const DB_KEYS = {
    ADMIN: 'hm_admin_db',
    STUDENT: 'hm_student_db',
    CARETAKER: 'hm_caretaker_db',
    SESSION: 'hm_session',
    SESSION_TIMEOUT: 'hm_session_timeout'
  };

  const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

  // ==================== INITIALIZATION ====================
  function initializeDatabase() {
    // Initialize Admin table if not exists
    if (!localStorage.getItem(DB_KEYS.ADMIN)) {
      const admins = [
        { key: 'admin001', password: 'Admin@123', name: 'Super Admin', email: 'admin@hostel.edu' },
        { key: 'admin002', password: 'Admin@456', name: 'Hostel Admin', email: 'hostel.admin@edu' }
      ];
      localStorage.setItem(DB_KEYS.ADMIN, JSON.stringify(admins));
    }

    // Initialize Student table if not exists
    if (!localStorage.getItem(DB_KEYS.STUDENT)) {
      const students = [
        { hostel_id: 'STU001', password: 'Student@123', name: 'Sreenivas', roll: '52125', room: '115', block: 'A' },
        { hostel_id: 'STU002', password: 'Student@456', name: 'Rahul Kumar', roll: '52126', room: '116', block: 'A' }
      ];
      localStorage.setItem(DB_KEYS.STUDENT, JSON.stringify(students));
    }

    // Initialize Caretaker table if not exists
    if (!localStorage.getItem(DB_KEYS.CARETAKER)) {
      const caretakers = [
        { hostel_id: 'CARE001', password: 'Caretaker@123', name: 'Ramesh', block: 'A' },
        { hostel_id: 'CARE002', password: 'Caretaker@456', name: 'Suresh', block: 'B' }
      ];
      localStorage.setItem(DB_KEYS.CARETAKER, JSON.stringify(caretakers));
    }
  }

  // ==================== FR-02: CREDENTIAL VALIDATION ====================
  function validateCredentials(id, password, role) {
    const dbKey = getDbKey(role);
    if (!dbKey) return { success: false, message: 'Invalid role' };

    const users = JSON.parse(localStorage.getItem(dbKey) || '[]');
    const user = users.find(u => u.hostel_id === id || u.key === id);

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Invalid password' };
    }

    return { success: true, user: { ...user, role } };
  }

  function getDbKey(role) {
    const keyMap = {
      'admin': DB_KEYS.ADMIN,
      'student': DB_KEYS.STUDENT,
      'caretaker': DB_KEYS.CARETAKER
    };
    return keyMap[role] || null;
  }

  // ==================== FR-03: ROLE IDENTIFICATION ====================
  function getRoleFromId(id) {
    // Check all databases for the ID
    const studentDb = JSON.parse(localStorage.getItem(DB_KEYS.STUDENT) || '[]');
    const caretakerDb = JSON.parse(localStorage.getItem(DB_KEYS.CARETAKER) || '[]');
    const adminDb = JSON.parse(localStorage.getItem(DB_KEYS.ADMIN) || '[]');

    if (adminDb.some(u => u.key === id)) return 'admin';
    if (studentDb.some(u => u.hostel_id === id)) return 'student';
    if (caretakerDb.some(u => u.hostel_id === id)) return 'caretaker';
    
    return null;
  }

  // ==================== FR-04: ROLE-BASED ACCESS CONTROL ====================
  const ACCESS_CONTROL = {
    admin: {
      allowedPages: ['Dashboard', 'Admin Panel', 'User Management', 'System Settings', 'Announcements', 'Reports', 'Hostel Blocks'],
      defaultPage: 'Admin Panel'
    },
    student: {
      allowedPages: ['Dashboard', 'Announcements', 'Complaints', 'Maintenance', 'Non Local Outing', 'Hostel Blocks', 'Hostel Room Allocation', 'Contact Us'],
      defaultPage: 'Dashboard'
    },
    caretaker: {
      allowedPages: ['Dashboard', 'Announcements', 'Complaints', 'Maintenance', 'Room Inspection', 'Hostel Blocks', 'Student List'],
      defaultPage: 'Dashboard'
    }
  };

  function checkAccess(role, page) {
    const permissions = ACCESS_CONTROL[role];
    if (!permissions) return false;
    return permissions.allowedPages.includes(page);
  }

  function getDefaultPage(role) {
    return ACCESS_CONTROL[role]?.defaultPage || 'Dashboard';
  }

  // ==================== FR-05: SESSION MANAGEMENT ====================
  function createSession(user) {
    const sessionId = generateSessionId();
    const session = {
      sessionId,
      userId: user.hostel_id || user.key,
      name: user.name,
      role: user.role,
      loginTime: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION
    };

    localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(session));
    return session;
  }

  function generateSessionId() {
    return 'sess_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now();
  }

  function getSession() {
    const session = JSON.parse(localStorage.getItem(DB_KEYS.SESSION));
    if (!session) return null;

    // Check if session expired
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

  // ==================== FR-01: USER REGISTRATION ====================
  function register(userData, role) {
    const dbKey = getDbKey(role);
    if (!dbKey) return { success: false, message: 'Invalid role' };

    const users = JSON.parse(localStorage.getItem(dbKey) || '[]');
    
    // Check if user already exists
    const exists = users.some(u => 
      (u.hostel_id && u.hostel_id === userData.hostel_id) ||
      (u.key && u.key === userData.key)
    );

    if (exists) {
      return { success: false, message: 'User already exists with this ID' };
    }

    // Validate password strength
    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.valid) {
      return { success: false, message: passwordValidation.message };
    }

    // Add user to database
    const newUser = {
      ...userData,
      createdAt: Date.now()
    };
    users.push(newUser);
    localStorage.setItem(dbKey, JSON.stringify(users));

    return { success: true, message: 'Registration successful' };
  }

  function validatePassword(password) {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true };
  }

  // ==================== FR-06: LOGOUT ====================
  function logout() {
    destroySession();
    return { success: true, message: 'Logged out successfully' };
  }

  // ==================== PUBLIC API ====================
  return {
    initializeDatabase,
    validateCredentials,
    getRoleFromId,
    checkAccess,
    getDefaultPage,
    register,
    createSession,
    getSession,
    refreshSession,
    isLoggedIn,
    logout,
    ACCESS_CONTROL
  };
})();

// Initialize on load
Auth.initializeDatabase();
