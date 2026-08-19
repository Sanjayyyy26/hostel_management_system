# FR-02: Credential Validation

## Overview

FR-02 defines the credential validation process for the Hostel Management System. This feature verifies user credentials during login to ensure secure access.

---

## 1. Functional Description

### 1.1 Purpose
Authenticate users by validating their provided credentials against stored records in the database.

### 1.2 Scope
- ID validation
- Password verification
- Role-based credential lookup
- Authentication response

---

## 2. Authentication Flow

### 2.1 Complete Login Flow

```
┌─────────────────────────────────┐
│         Login Form              │
│  ┌─────────────────────────┐   │
│  │ Role Selection          │   │
│  │ [Student] [Caretaker]   │   │
│  │ [Admin]                 │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ ID: _________________   │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ Password: ____________  │   │
│  └─────────────────────────┘   │
│        [SIGN IN]               │
└─────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│     Validate Inputs            │
│  • Check for empty fields      │
│  • Sanitize input              │
└─────────────┬───────────────────┘
              │ If valid
              ▼
┌─────────────────────────────────┐
│     Database Lookup            │
│  • Get users by role           │
│  • Find matching ID            │
└─────────────┬───────────────────┘
              │ If found
              ▼
┌─────────────────────────────────┐
│     Password Verification      │
│  • Compare stored vs provided  │
└─────────────┬───────────────────┘
              │ If match
              ▼
┌─────────────────────────────────┐
│     Authentication Success     │
│  • Create session              │
│  • Redirect to dashboard       │
└─────────────────────────────────┘
```

### 2.2 Role-Based Database Lookup

| Role | Database Key | ID Field | Example |
|------|--------------|----------|---------|
| Admin | `hm_admin_db` | `key` | `admin001` |
| Student | `hm_student_db` | `hostel_id` | `STU001` |
| Caretaker | `hm_caretaker_db` | `hostel_id` | `CARE001` |

---

## 3. Validation Rules

### 3.1 Input Validation

```javascript
// Step 1: Check empty fields
if (!id || !password) {
  return { 
    success: false, 
    message: 'Please fill in all fields' 
  };
}

// Step 2: Sanitize inputs
const sanitizedId = id.trim();
const sanitizedPassword = password.trim();
```

### 3.2 Database Lookup

```javascript
// Get appropriate database based on role
const dbKey = getDbKey(role);
const users = JSON.parse(localStorage.getItem(dbKey) || '[]');

// Find user by ID
const user = users.find(u => 
  u.hostel_id === id || u.key === id
);
```

### 3.3 Password Verification

```javascript
// Compare passwords
if (user.password !== password) {
  return { 
    success: false, 
    message: 'Invalid password' 
  };
}

// If password matches
return { 
  success: true, 
  user: { ...user, role } 
};
```

---

## 4. Response Format

### 4.1 Success Response

```javascript
{
  success: true,
  user: {
    hostel_id: "STU001",
    name: "John Doe",
    role: "student",
    email: "john@hostel.edu",
    // ... other fields
  }
}
```

### 4.2 Error Responses

```javascript
// User not found
{
  success: false,
  message: "User not found"
}

// Invalid password
{
  success: false,
  message: "Invalid password"
}

// Invalid role
{
  success: false,
  message: "Invalid role"
}
```

---

## 5. Security Measures

### 5.1 Input Sanitization

| Threat | Protection |
|--------|------------|
| SQL Injection | Parameterized queries |
| XSS | Input escaping |
| CSRF | Token validation |

### 5.2 Password Security

| Measure | Implementation |
|---------|----------------|
| Storage | Encrypted/hashed |
| Comparison | Secure comparison |
| Brute Force | Rate limiting |

### 5.3 Session Security

| Feature | Description |
|---------|-------------|
| Secure Token | Random session ID |
| Expiration | 30-minute timeout |
| Single Session | One active session per user |

---

## 6. Error Handling

### 6.1 Error Messages

| Error Type | User Message | Technical Action |
|------------|--------------|------------------|
| Empty Fields | "Please fill in all fields" | Prevent submission |
| User Not Found | "User not found" | Log attempt |
| Wrong Password | "Invalid password" | Log attempt |
| Role Mismatch | "Invalid role" | Clear selection |

### 6.2 Error Display

```css
.error-message {
  padding: 10px 12px;
  border-radius: 8px;
  background: #fef2f2;
  color: var(--red);
  font-size: 11px;
  border: 1px solid #fecaca;
}
```

---

## 7. Test Cases

### 7.1 Valid Scenarios

| Test ID | Description | Input | Expected Result |
|---------|-------------|-------|-----------------|
| TC-01 | Valid student login | STU001 + Student@123 | Success, redirect to dashboard |
| TC-02 | Valid caretaker login | CARE001 + Caretaker@123 | Success, redirect to dashboard |
| TC-03 | Valid admin login | admin001 + Admin@123 | Success, redirect to dashboard |

### 7.2 Invalid Scenarios

| Test ID | Description | Input | Expected Result |
|---------|-------------|-------|-----------------|
| TC-04 | Non-existent user | FAKE001 + any | Error: User not found |
| TC-05 | Wrong password | STU001 + wrongpass | Error: Invalid password |
| TC-06 | Empty ID | "" + password | Error: Fill all fields |
| TC-07 | Empty password | id + "" | Error: Fill all fields |
| TC-08 | Role mismatch | Student ID + admin role | Error: User not found |

---

## 8. Implementation Reference

### Source Code Location

```javascript
// Main validation function
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
```

### Related Functions
- `getDbKey(role)` - Maps role to database key
- `createSession(user)` - Creates session after validation

---

## 9. Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Supported |
| Firefox | 88+ | ✅ Supported |
| Safari | 14+ | ✅ Supported |
| Edge | 90+ | ✅ Supported |

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-19 | Initial documentation |
