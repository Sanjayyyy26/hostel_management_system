# FR-05: Session Management

## Overview

FR-05 defines the session management system for the Hostel Management System. This feature handles active user sessions, including creation, validation, renewal, and automatic timeout.

---

## 1. Functional Description

### 1.1 Purpose
Maintain secure user sessions during active use, prevent unauthorized access, and ensure automatic logout after inactivity.

### 1.2 Scope
- Session creation
- Session validation
- Session renewal/extension
- Session timeout
- Session destruction

---

## 2. Session Lifecycle

### 2.1 Complete Session Flow

```
┌─────────────────────────────────┐
│     User Logs In                │
│  (FR-02 validation success)    │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│     Session Created             │
│  • Generate unique ID          │
│  • Store user info             │
│  • Set expiration time         │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│     Session Active              │
│  • Timer counting down         │
│  • Page access validated       │
│  • User interaction tracked    │
└─────────────┬───────────────────┘
              │
     ┌────────┴────────┐
     │                 │
     ▼                 ▼
┌─────────────┐   ┌─────────────┐
│   RENEWAL   │   │   TIMEOUT   │
│             │   │             │
│ Extend      │   │ Auto        │
│ session     │   │ logout      │
│ +30 min     │   │ Clear       │
│             │   │ session     │
└─────────────┘   └─────────────┘
```

---

## 3. Session Structure

### 3.1 Session Object

```javascript
{
  sessionId: "sess_abc123xyz_1692451200000",
  userId: "STU001",
  name: "John Doe",
  role: "student",
  loginTime: 1692451200000,      // When login occurred
  expiresAt: 1692453000000       // When session expires (loginTime + 30 min)
}
```

### 3.2 Session ID Generation

```javascript
function generateSessionId() {
  return 'sess_' + 
    Math.random().toString(36).substr(2, 16) + 
    '_' + 
    Date.now();
}
```

---

## 4. Session Operations

### 4.1 Session Creation

```javascript
function createSession(user) {
  const sessionId = generateSessionId();
  const session = {
    sessionId,
    userId: user.hostel_id || user.key,
    name: user.name,
    role: user.role,
    loginTime: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION  // 30 minutes
  };

  localStorage.setItem('hm_session', JSON.stringify(session));
  return session;
}
```

### 4.2 Session Retrieval

```javascript
function getSession() {
  const session = JSON.parse(localStorage.getItem('hm_session'));
  if (!session) return null;

  // Check if session expired
  if (Date.now() > session.expiresAt) {
    destroySession();
    return null;
  }

  return session;
}
```

### 4.3 Session Renewal

```javascript
function refreshSession() {
  const session = getSession();
  if (session) {
    session.expiresAt = Date.now() + SESSION_DURATION;
    localStorage.setItem('hm_session', JSON.stringify(session));
  }
  return session;
}
```

### 4.4 Session Destruction

```javascript
function destroySession() {
  localStorage.removeItem('hm_session');
}
```

---

## 5. Session Timer

### 5.1 Timer Display

```
┌──────────────────────────────┐
│  ⏱ 29:45                     │
└──────────────────────────────┘
```

### 5.2 Timer Implementation

```javascript
let sessionInterval = null;

function startSessionTimer() {
  updateTimerDisplay();
  sessionInterval = setInterval(updateTimerDisplay, 1000);
}

function updateTimerDisplay() {
  const session = Auth.getSession();
  if (!session) {
    stopSessionTimer();
    return;
  }

  remainingTime = Math.max(0, session.expiresAt - Date.now());
  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);
  
  timerText.textContent = 
    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Show warning when < 5 minutes remain
  if (remainingTime <= 5 * 60 * 1000 && remainingTime > 0) {
    sessionModal.hidden = false;
  }

  // Auto-logout when expired
  if (remainingTime <= 0) {
    stopSessionTimer();
    handleLogout();
  }
}

function stopSessionTimer() {
  if (sessionInterval) {
    clearInterval(sessionInterval);
    sessionInterval = null;
  }
}
```

---

## 6. Session Timeout Modal

### 6.1 Modal Display

When less than 5 minutes remain:

```
┌────────────────────────────────────┐
│     Session Expiring               │
│                                    │
│  Your session will expire in      │
│  04:32                            │
│                                    │
│  Do you want to continue?         │
│                                    │
│  [Extend Session]                 │
│  [Logout]                         │
└────────────────────────────────────┘
```

### 6.2 Modal Actions

| Button | Action |
|--------|--------|
| Extend Session | Renew session for 30 minutes |
| Logout | Immediately destroy session |

### 6.3 Modal Implementation

```javascript
// Extend session
document.querySelector('#extendSession').addEventListener('click', () => {
  Auth.refreshSession();
  sessionModal.hidden = true;
  showToast('Session extended for 30 minutes');
});

// Force logout
document.querySelector('#forceLogout').addEventListener('click', () => {
  handleLogout();
});
```

---

## 7. Session Validation

### 7.1 On Page Load

```javascript
// Check for existing session on app initialization
function init() {
  const session = Auth.getSession();
  if (session) {
    // Restore active session
    showDashboard(session.role);
    showToast(`Welcome back, ${session.name}!`);
  }
}
```

### 7.2 On Navigation

```javascript
// Validate session before page load
function loadPage(role, page) {
  const session = Auth.getSession();
  if (!session) {
    showLogin();
    showToast('Session expired. Please log in again.');
    return;
  }
  // Load page...
}
```

---

## 8. Session Security

### 8.1 Security Features

| Feature | Implementation |
|---------|----------------|
| Unique Session ID | Random generation |
| Expiration Time | 30-minute timeout |
| Storage | LocalStorage |
| Validation | On every access |
| Destruction | Clear on logout |

### 8.2 Security Considerations

| Threat | Mitigation |
|--------|------------|
| Session hijacking | Secure session ID |
| Session fixation | New ID on login |
| Timeout bypass | Client-side enforcement |
| Multiple sessions | Single session per user |

---

## 9. Test Cases

| Test ID | Description | Input | Expected Result |
|---------|-------------|-------|-----------------|
| TC-01 | Session creation | Successful login | Session stored in localStorage |
| TC-02 | Session validation | Active session | Session returned |
| TC-03 | Session expiry | After 30 minutes | Session destroyed |
| TC-04 | Session renewal | Click extend | Expiration extended +30 min |
| TC-05 | Session destruction | Logout | Session cleared |
| TC-06 | Timer display | Active session | Countdown shown |
| TC-07 | Warning modal | < 5 min remaining | Modal displayed |
| TC-08 | Auto-logout | Session expired | Redirect to login |

---

## 10. Configuration

### 10.1 Session Duration

```javascript
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
```

### 10.2 Warning Threshold

```javascript
const WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes
```

### 10.3 Storage Keys

```javascript
const DB_KEYS = {
  SESSION: 'hm_session',
  SESSION_TIMEOUT: 'hm_session_timeout'
};
```

---

## 11. Implementation Reference

### Source Code Location

```javascript
// auth.js - Session functions
function createSession(user) { ... }
function getSession() { ... }
function refreshSession() { ... }
function destroySession() { ... }
function isLoggedIn() { ... }

// script.js - Timer functions
function startSessionTimer() { ... }
function updateTimerDisplay() { ... }
function stopSessionTimer() { ... }
```

### Related Functions
- `createSession(user)` - Create new session
- `getSession()` - Get active session
- `refreshSession()` - Extend session
- `destroySession()` - Clear session
- `isLoggedIn()` - Check login status

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-19 | Initial documentation |
