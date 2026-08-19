# Security Features

## Overview

This document describes the security implementation in the Hostel Management System's authentication module.

---

## 1. Security Architecture

### 1.1 Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Layer 1: Input Validation                     │   │
│  │  • XSS prevention                              │   │
│  │  • Input sanitization                          │   │
│  │  • Required field checks                       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Layer 2: Authentication                       │   │
│  │  • Credential validation                       │   │
│  │  • Password policy enforcement                 │   │
│  │  • Duplicate detection                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Layer 3: Authorization                        │   │
│  │  • Role-based access control                   │   │
│  │  • Page-level permissions                      │   │
│  │  • Feature restrictions                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Layer 4: Session Management                   │   │
│  │  • Secure session IDs                          │   │
│  │  • Automatic timeout                           │   │
│  │  • Session validation                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Authentication Security

### 2.1 Password Policy

| Requirement | Implementation |
|-------------|----------------|
| Minimum Length | 8 characters |
| Complexity | Uppercase, lowercase, number |
| Validation | Client + Server side |

```javascript
function validatePassword(password) {
  const checks = [
    { test: password.length >= 8, message: 'At least 8 characters' },
    { test: /[A-Z]/.test(password), message: 'One uppercase letter' },
    { test: /[a-z]/.test(password), message: 'One lowercase letter' },
    { test: /[0-9]/.test(password), message: 'One number' }
  ];
  
  for (const check of checks) {
    if (!check.test) return { valid: false, message: check.message };
  }
  return { valid: true };
}
```

### 2.2 Credential Validation

| Step | Security Measure |
|------|------------------|
| 1 | Input sanitization |
| 2 | Database lookup |
| 3 | Password comparison |
| 4 | Error message genericity |

---

## 3. Authorization Security

### 3.1 Role-Based Access Control (RBAC)

| Role | Access Level | Restrictions |
|------|--------------|--------------|
| Admin | Full | None |
| Caretaker | Block-level | No admin features |
| Student | Personal | No admin/caretaker features |

### 3.2 Page Access Control

```javascript
function checkAccess(role, page) {
  const permissions = ACCESS_CONTROL[role];
  if (!permissions) return false;
  return permissions.allowedPages.includes(page);
}
```

### 3.3 Access Denied Response

```javascript
if (!Auth.checkAccess(role, page)) {
  showToast('Access denied to this page', 'error');
  return;
}
```

---

## 4. Session Security

### 4.1 Session Properties

| Property | Value | Purpose |
|----------|-------|---------|
| Duration | 30 minutes | Limit exposure time |
| Warning | 5 minutes | Allow extension |
| ID Format | Random string | Prevent guessing |
| Storage | LocalStorage | Client-side only |

### 4.2 Session Validation

```javascript
function getSession() {
  const session = JSON.parse(localStorage.getItem('hm_session'));
  if (!session) return null;

  // Check expiration
  if (Date.now() > session.expiresAt) {
    destroySession();
    return null;
  }

  return session;
}
```

### 4.3 Automatic Timeout

```javascript
function updateTimerDisplay() {
  remainingTime = Math.max(0, session.expiresAt - Date.now());
  
  // Auto-logout when expired
  if (remainingTime <= 0) {
    handleLogout();
    showToast('Session expired. Please log in again.');
  }
}
```

---

## 5. Input Validation

### 5.1 Client-Side Validation

| Check | Implementation |
|-------|----------------|
| Empty fields | Required attribute |
| Email format | Regex validation |
| Password match | Comparison check |
| Password strength | Policy enforcement |

### 5.2 Sanitization

```javascript
// Trim whitespace
const sanitizedId = id.trim();
const sanitizedPassword = password.trim();

// Prevent XSS (in production, use a library)
function sanitize(input) {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
```

---

## 6. Error Handling Security

### 6.1 Generic Error Messages

| Actual Error | Displayed Message |
|--------------|-------------------|
| User not found | "User not found" |
| Wrong password | "Invalid password" |
| Empty fields | "Please fill in all fields" |

### 6.2 Why Generic Messages?

| Attack | Protection |
|--------|------------|
| Username enumeration | Don't reveal if user exists |
| Brute force | Rate limiting (recommended) |
| Information leakage | Generic responses |

---

## 7. Data Protection

### 7.1 Storage Security

| Data | Storage | Protection |
|------|---------|------------|
| Passwords | LocalStorage | Hash (recommended) |
| Session | LocalStorage | Secure ID |
| User Data | LocalStorage | Role-based access |

### 7.2 Production Recommendations

| Aspect | Recommendation |
|--------|----------------|
| Password Storage | bcrypt/argon2 hashing |
| Transmission | HTTPS only |
| Cookies | Secure, HttpOnly flags |
| CSRF | Token validation |

---

## 8. Threat Protection

### 8.1 Common Threats

| Threat | Protection |
|--------|------------|
| XSS | Input sanitization |
| CSRF | Token validation |
| Brute Force | Rate limiting |
| Session Hijacking | Secure IDs |
| Clickjacking | X-Frame-Options |

### 8.2 Implementation Status

| Threat | Status | Notes |
|--------|--------|-------|
| XSS | ✅ Partial | Input sanitization |
| CSRF | ⚠️ Not implemented | Add tokens |
| Brute Force | ⚠️ Not implemented | Add rate limiting |
| Session Security | ✅ Implemented | Timeout + validation |

---

## 9. Security Checklist

### 9.1 Current Implementation

- [x] Input validation
- [x] Password policy
- [x] Role-based access
- [x] Session timeout
- [x] Generic error messages
- [x] Session validation
- [ ] Password hashing
- [ ] HTTPS enforcement
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Audit logging

### 9.2 Production Requirements

| Requirement | Priority | Status |
|-------------|----------|--------|
| HTTPS | High | ❌ Pending |
| Password Hashing | High | ❌ Pending |
| CSRF Tokens | Medium | ❌ Pending |
| Rate Limiting | Medium | ❌ Pending |
| Audit Logging | Low | ❌ Pending |

---

## 10. Security Best Practices

### 10.1 Recommendations

| Area | Recommendation |
|------|----------------|
| Passwords | Hash with bcrypt |
| Sessions | Use secure cookies |
| API | Implement rate limiting |
| Logs | Track login attempts |
| Updates | Regular security audits |

### 10.2 Production Checklist

```
□ Enable HTTPS
□ Hash passwords with bcrypt
□ Implement CSRF protection
□ Add rate limiting
□ Enable audit logging
□ Set secure cookie flags
□ Implement Content Security Policy
□ Regular security updates
```

---

## 11. Implementation Reference

### Source Code Locations

```javascript
// Input Validation
function validatePassword(password) { ... }

// Credential Validation
function validateCredentials(id, password, role) { ... }

// Access Control
function checkAccess(role, page) { ... }

// Session Management
function createSession(user) { ... }
function getSession() { ... }
function destroySession() { ... }
```

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-19 | Initial documentation |
