# FR-06: Logout

## Overview

FR-06 defines the logout functionality for the Hostel Management System. This feature securely terminates user sessions and clears all authentication data.

---

## 1. Functional Description

### 1.1 Purpose
Provide a secure and complete logout process that terminates the user's session and prevents unauthorized access.

### 1.2 Scope
- Session destruction
- UI state reset
- Navigation to login
- User feedback

---

## 2. Logout Process

### 2.1 Complete Logout Flow

```
┌─────────────────────────────────┐
│     User Clicks Logout          │
│  Button in sidebar              │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│     Clear Session               │
│  • Remove session from storage  │
│  • Stop session timer          │
│  • Close any modals            │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│     Reset UI State              │
│  • Hide dashboard              │
│  • Show login page             │
│  • Clear form fields           │
│  • Hide error messages         │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│     Show Feedback               │
│  • Toast: "Logged out          │
│    successfully"               │
└─────────────────────────────────┘
```

---

## 3. Logout Triggers

### 3.1 Manual Logout

| Trigger | Action |
|---------|--------|
| Click "Log out" button | Immediate logout |
| Click "Logout" in modal | Immediate logout |

### 3.2 Automatic Logout

| Trigger | Action |
|---------|--------|
| Session timeout (30 min) | Auto-logout |
| Inactivity | Auto-logout |

---

## 4. Logout Implementation

### 4.1 Main Logout Function

```javascript
function handleLogout() {
  // FR-06: Clear session
  Auth.logout();
  
  // Stop session timer
  stopSessionTimer();
  
  // Close any open modals
  sessionModal.hidden = true;
  
  // Show login page
  showLogin();
  
  // Show feedback
  showToast('You have been logged out successfully.');
}
```

### 4.2 Auth Module Logout

```javascript
// In auth.js
function logout() {
  destroySession();
  return { success: true, message: 'Logged out successfully' };
}

function destroySession() {
  localStorage.removeItem('hm_session');
}
```

---

## 5. UI State Reset

### 5.1 Login Page Display

```javascript
function showLogin() {
  // Hide dashboard
  dashboardView.hidden = true;
  dashboardView.style.display = 'none';
  
  // Show login page
  authView.hidden = false;
  authView.style.display = 'grid';
  
  // Clear form fields
  loginForm.reset();
  registerForm.reset();
  
  // Hide error/success messages
  hideErrors();
}
```

### 5.2 Form Reset

```javascript
// Clear all input fields
loginForm.reset();
registerForm.reset();

// Hide any displayed messages
function hideErrors() {
  loginError.hidden = true;
  registerError.hidden = true;
  registerSuccess.hidden = true;
}
```

---

## 6. Session Cleanup

### 6.1 Data Cleared on Logout

| Data | Storage Key | Action |
|------|-------------|--------|
| Session | `hm_session` | Removed |
| Timer | `sessionInterval` | Cleared |
| Modal | `sessionModal` | Hidden |

### 6.2 Storage Cleanup

```javascript
function destroySession() {
  localStorage.removeItem('hm_session');
}
```

---

## 7. User Feedback

### 7.1 Toast Notification

```
┌────────────────────────────────┐
│ ✅ You have been logged out     │
│    successfully.               │
└────────────────────────────────┘
```

### 7.2 Toast Implementation

```javascript
showToast('You have been logged out successfully.');
```

---

## 8. Logout Button Location

### 8.1 Sidebar Navigation

```html
<nav class="bottom-nav" aria-label="Account navigation">
  <button class="nav-link logout" id="logout">
    <span>⇥</span>Log out
  </button>
</nav>
```

### 8.2 Button Styling

```css
.logout {
  margin-top: 7px;
  color: var(--red);
}

.logout span {
  color: var(--red);
}
```

---

## 9. Test Cases

| Test ID | Description | Input | Expected Result |
|---------|-------------|-------|-----------------|
| TC-01 | Manual logout | Click logout button | Session cleared, login shown |
| TC-02 | Auto-logout | Session timeout | Session cleared, login shown |
| TC-03 | Session cleared | Check localStorage | Session key removed |
| TC-04 | Timer stopped | After logout | Timer interval cleared |
| TC-05 | UI reset | After logout | Forms cleared, errors hidden |
| TC-06 | Feedback shown | After logout | Toast displayed |

---

## 10. Security Considerations

### 10.1 Security Measures

| Measure | Implementation |
|---------|----------------|
| Complete cleanup | All session data removed |
| No residual data | Forms cleared |
| Immediate effect | Instant redirect |
| Timer cleanup | Interval cleared |

### 10.2 Post-Logout Protection

| Check | Implementation |
|-------|----------------|
| Session check | `getSession()` returns null |
| Route guard | Redirect to login if no session |
| API calls | Fail if not authenticated |

---

## 11. Implementation Reference

### Source Code Location

```javascript
// script.js - Main logout handler
function handleLogout() {
  Auth.logout();
  stopSessionTimer();
  sessionModal.hidden = true;
  showLogin();
  showToast('You have been logged out successfully.');
}

// script.js - Login page display
function showLogin() {
  stopSessionTimer();
  sessionModal.hidden = true;
  dashboardView.hidden = true;
  authView.hidden = false;
  dashboardView.style.display = 'none';
  authView.style.display = 'grid';
  loginForm.reset();
  registerForm.reset();
  hideErrors();
}

// auth.js - Session destruction
function logout() {
  destroySession();
  return { success: true, message: 'Logged out successfully' };
}
```

### Related Functions
- `handleLogout()` - Main logout handler
- `showLogin()` - Display login page
- `stopSessionTimer()` - Stop countdown
- `Auth.logout()` - Clear session data
- `Auth.destroySession()` - Remove from storage

---

## 12. Logout Scenarios

### 12.1 User Initiated

```
User clicks "Log out" 
  → Session cleared
  → Timer stopped
  → Login page shown
  → Success toast displayed
```

### 12.2 Session Timeout

```
Session expires (30 min)
  → Auto-logout triggered
  → Session cleared
  → Login page shown
  → "Session expired" toast displayed
```

### 12.3 Modal Logout

```
User clicks "Logout" in warning modal
  → Modal closed
  → Session cleared
  → Login page shown
  → Success toast displayed
```

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-19 | Initial documentation |
