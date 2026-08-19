# API Reference

## Overview

This document provides comprehensive API reference for the Hostel Management System's authentication module (`Auth` object).

---

## 1. Auth Module

The `Auth` module provides all authentication-related functions.

### 1.1 Import

```javascript
// Available globally after auth.js loads
const Auth = window.Auth;
```

---

## 2. Database Operations

### 2.1 initializeDatabase()

Initializes the database with default data if not exists.

```javascript
Auth.initializeDatabase();
```

**Returns:** `void`

**Description:**
- Creates Admin table with default admins
- Creates Student table with default students
- Creates Caretaker table with default caretakers
- Only initializes if tables don't exist

**Example:**
```javascript
// Called automatically on page load
Auth.initializeDatabase();
```

---

## 3. Authentication Functions

### 3.1 validateCredentials(id, password, role)

Validates user credentials against the database.

```javascript
const result = Auth.validateCredentials(id, password, role);
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | String | Yes | User's ID (hostel_id or key) |
| password | String | Yes | User's password |
| role | String | Yes | User's role ('admin', 'student', 'caretaker') |

**Returns:**

```javascript
// Success
{
  success: true,
  user: {
    hostel_id: "STU001",
    name: "John Doe",
    role: "student",
    // ... other fields
  }
}

// Failure
{
  success: false,
  message: "User not found" | "Invalid password" | "Invalid role"
}
```

**Example:**
```javascript
const result = Auth.validateCredentials('STU001', 'Student@123', 'student');
if (result.success) {
  console.log('Login successful:', result.user.name);
} else {
  console.log('Login failed:', result.message);
}
```

---

### 3.2 getRoleFromId(id)

Automatically detects user role from their ID.

```javascript
const role = Auth.getRoleFromId(id);
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | String | Yes | User's ID |

**Returns:** `String | null`

| Return Value | Description |
|--------------|-------------|
| 'admin' | User is an admin |
| 'student' | User is a student |
| 'caretaker' | User is a caretaker |
| null | User not found |

**Example:**
```javascript
const role = Auth.getRoleFromId('STU001');
console.log(role); // 'student'
```

---

## 4. Registration Functions

### 4.1 register(userData, role)

Registers a new user in the system.

```javascript
const result = Auth.register(userData, role);
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userData | Object | Yes | User registration data |
| role | String | Yes | User's role |

**userData Object Structure:**

```javascript
{
  name: "John Doe",           // Required
  email: "john@email.com",   // Required
  phone: "+91-9876543210",   // Required
  password: "Pass@123",      // Required
  hostel_id: "STU003",       // For students/caretakers
  roll: "52127",             // For students only
  block: "A"                 // For caretakers only
}
```

**Returns:**

```javascript
// Success
{
  success: true,
  message: "Registration successful"
}

// Failure
{
  success: false,
  message: "User already exists" | "Password must be at least 8 characters" | ...
}
```

**Example:**
```javascript
const userData = {
  name: 'New Student',
  email: 'new@hostel.edu',
  phone: '+91-9876543210',
  password: 'Student@789',
  hostel_id: 'STU003',
  roll: '52127'
};

const result = Auth.register(userData, 'student');
if (result.success) {
  console.log('Registration successful');
}
```

---

### 4.2 validatePassword(password)

Validates password strength against policy.

```javascript
const result = Auth.validatePassword(password);
```

**Note:** This function is internal but demonstrates password validation logic.

**Password Policy:**

| Rule | Requirement |
|------|-------------|
| Length | Minimum 8 characters |
| Uppercase | At least 1 (A-Z) |
| Lowercase | At least 1 (a-z) |
| Number | At least 1 (0-9) |

**Returns:**

```javascript
// Valid
{ valid: true }

// Invalid
{ valid: false, message: "Password must be at least 8 characters" }
```

---

## 5. Access Control Functions

### 5.1 checkAccess(role, page)

Checks if a user has access to a specific page.

```javascript
const hasAccess = Auth.checkAccess(role, page);
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| role | String | Yes | User's role |
| page | String | Yes | Page name to access |

**Returns:** `Boolean`

| Return Value | Description |
|--------------|-------------|
| true | Access granted |
| false | Access denied |

**Example:**
```javascript
// Student trying to access admin panel
const canAccess = Auth.checkAccess('student', 'Admin Panel');
console.log(canAccess); // false

// Student trying to access dashboard
const canAccessDashboard = Auth.checkAccess('student', 'Dashboard');
console.log(canAccessDashboard); // true
```

---

### 5.2 getDefaultPage(role)

Returns the default landing page for a role.

```javascript
const defaultPage = Auth.getDefaultPage(role);
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| role | String | Yes | User's role |

**Returns:** `String`

| Role | Default Page |
|------|--------------|
| admin | 'Admin Panel' |
| student | 'Dashboard' |
| caretaker | 'Dashboard' |

**Example:**
```javascript
const page = Auth.getDefaultPage('admin');
console.log(page); // 'Admin Panel'
```

---

## 6. Session Management Functions

### 6.1 createSession(user)

Creates a new session for an authenticated user.

```javascript
const session = Auth.createSession(user);
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user | Object | Yes | Authenticated user object |

**user Object Structure:**

```javascript
{
  hostel_id: "STU001",    // or key for admins
  name: "John Doe",
  role: "student",
  // ... other user fields
}
```

**Returns:**

```javascript
{
  sessionId: "sess_abc123xyz_1692451200000",
  userId: "STU001",
  name: "John Doe",
  role: "student",
  loginTime: 1692451200000,
  expiresAt: 1692453000000
}
```

**Example:**
```javascript
const user = { hostel_id: 'STU001', name: 'John', role: 'student' };
const session = Auth.createSession(user);
console.log(session.sessionId); // 'sess_abc123...'
```

---

### 6.2 getSession()

Retrieves the current active session.

```javascript
const session = Auth.getSession();
```

**Returns:** `Object | null`

```javascript
// Active session
{
  sessionId: "sess_abc123xyz_1692451200000",
  userId: "STU001",
  name: "John Doe",
  role: "student",
  loginTime: 1692451200000,
  expiresAt: 1692453000000
}

// No session or expired
null
```

**Example:**
```javascript
const session = Auth.getSession();
if (session) {
  console.log(`Welcome, ${session.name}!`);
  console.log(`Role: ${session.role}`);
} else {
  console.log('Please log in');
}
```

---

### 6.3 refreshSession()

Extends the current session by 30 minutes.

```javascript
const session = Auth.refreshSession();
```

**Returns:** `Object | null`

| Return Value | Description |
|--------------|-------------|
| Session object | Successfully refreshed |
| null | No active session |

**Example:**
```javascript
const session = Auth.refreshSession();
if (session) {
  console.log('Session extended to:', new Date(session.expiresAt));
}
```

---

### 6.4 isLoggedIn()

Checks if a user is currently logged in.

```javascript
const loggedIn = Auth.isLoggedIn();
```

**Returns:** `Boolean`

| Return Value | Description |
|--------------|-------------|
| true | User has active session |
| false | No active session |

**Example:**
```javascript
if (Auth.isLoggedIn()) {
  showDashboard();
} else {
  showLogin();
}
```

---

### 6.5 destroySession()

Clears the current session (called internally by logout).

```javascript
Auth.destroySession();
```

**Returns:** `void`

**Description:**
- Removes session from localStorage
- Called by `logout()` function

---

## 7. Logout Function

### 7.1 logout()

Terminates the current session.

```javascript
const result = Auth.logout();
```

**Returns:**

```javascript
{
  success: true,
  message: "Logged out successfully"
}
```

**Example:**
```javascript
// Handle logout button click
document.querySelector('#logout').addEventListener('click', () => {
  Auth.logout();
  showLogin();
  showToast('You have been logged out');
});
```

---

## 8. Constants

### 8.1 ACCESS_CONTROL

Object defining page access permissions for each role.

```javascript
Auth.ACCESS_CONTROL
```

**Structure:**

```javascript
{
  admin: {
    allowedPages: ['Dashboard', 'Admin Panel', 'User Management', ...],
    defaultPage: 'Admin Panel'
  },
  student: {
    allowedPages: ['Dashboard', 'Announcements', 'Complaints', ...],
    defaultPage: 'Dashboard'
  },
  caretaker: {
    allowedPages: ['Dashboard', 'Announcements', 'Room Inspection', ...],
    defaultPage: 'Dashboard'
  }
}
```

**Example:**

```javascript
// Get allowed pages for a role
const adminPages = Auth.ACCESS_CONTROL.admin.allowedPages;
console.log(adminPages); // ['Dashboard', 'Admin Panel', ...]
```

---

## 9. Complete Usage Example

```javascript
// 1. Initialize database
Auth.initializeDatabase();

// 2. User login
function handleLogin(id, password, role) {
  // Validate credentials
  const result = Auth.validateCredentials(id, password, role);
  
  if (!result.success) {
    showError(result.message);
    return;
  }
  
  // Create session
  const session = Auth.createSession(result.user);
  
  // Redirect to dashboard
  showDashboard(session.role);
}

// 3. Check page access
function navigateToPage(page) {
  const session = Auth.getSession();
  
  if (!Auth.checkAccess(session.role, page)) {
    showToast('Access denied');
    return;
  }
  
  loadPage(page);
}

// 4. Session management
function checkSession() {
  const session = Auth.getSession();
  
  if (!session) {
    showLogin();
    return;
  }
  
  // Session valid, continue
  showDashboard(session.role);
}

// 5. Logout
function handleLogout() {
  Auth.logout();
  showLogin();
}
```

---

## 10. Error Codes

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Invalid role" | Unknown role provided | Use 'admin', 'student', or 'caretaker' |
| "User not found" | ID doesn't exist | Check ID or register new user |
| "Invalid password" | Wrong password | Verify password |
| "User already exists" | Duplicate ID during registration | Use different ID |
| "Password too weak" | Doesn't meet policy | Add complexity to password |

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-19 | Initial documentation |
