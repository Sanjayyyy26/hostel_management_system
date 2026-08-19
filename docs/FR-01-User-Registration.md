# FR-01: User Registration

## Overview

FR-01 defines the user registration functionality for the Hostel Management System. This feature allows new users (Students and Caretakers) to create accounts and access the system.

---

## 1. Functional Description

### 1.1 Purpose
Enable new users to register for the Hostel Management System by providing required information and creating secure credentials.

### 1.2 Scope
- Student registration
- Caretaker registration
- Input validation
- Duplicate detection
- Password policy enforcement

---

## 2. User Roles

| Role | Can Register | Registration Type |
|------|--------------|-------------------|
| Student | ✅ Yes | Self-registration |
| Caretaker | ✅ Yes | Self-registration |
| Admin | ❌ No | System-managed only |

---

## 3. Registration Process

### 3.1 User Flow

```
┌─────────────────────┐
│   Login Page        │
└──────────┬──────────┘
           │ Click "Create Account"
           ▼
┌─────────────────────┐
│   Registration      │
│   Form              │
└──────────┬──────────┘
           │ Fill in details
           ▼
┌─────────────────────┐
│   Form Validation   │
└──────────┬──────────┘
           │ If valid
           ▼
┌─────────────────────┐
│   Password Check    │
│   (Strength Policy) │
└──────────┬──────────┘
           │ If strong enough
           ▼
┌─────────────────────┐
│   Duplicate Check   │
└──────────┬──────────┘
           │ If unique
           ▼
┌─────────────────────┐
│   Save to Database  │
└──────────┬──────────┘
           │ Success
           ▼
┌─────────────────────┐
│   Redirect to Login │
└─────────────────────┘
```

### 3.2 Required Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Account Type | Select | ✅ | Must be Student or Caretaker |
| Full Name | Text | ✅ | 2-100 characters |
| ID | Text | ✅ | Unique, format: STU### or CARE### |
| Email | Email | ✅ | Valid email format |
| Phone | Tel | ✅ | Valid phone number |
| Password | Password | ✅ | See Password Policy |
| Confirm Password | Password | ✅ | Must match Password |

---

## 4. Password Policy

### 4.1 Requirements

| Rule | Requirement |
|------|-------------|
| Minimum Length | 8 characters |
| Uppercase Letters | At least 1 (A-Z) |
| Lowercase Letters | At least 1 (a-z) |
| Numbers | At least 1 (0-9) |
| Special Characters | Optional |

### 4.2 Validation Examples

```
✅ Valid passwords:
- Student@123
- Caretaker@456
- MyP@ssw0rd

❌ Invalid passwords:
- password (missing uppercase, number)
- PASSWORD (missing lowercase, number)
- Pass123 (too short)
- 12345678 (missing letters)
```

---

## 5. Database Schema

### 5.1 Student Record

```javascript
{
  hostel_id: "STU001",        // Primary Key
  password: "hashed_password", // Encrypted
  name: "John Doe",
  email: "john@hostel.edu",
  phone: "+91-9876543210",
  roll: "52125",
  room: null,                  // Assigned later
  block: null,                 // Assigned later
  createdAt: 1692451200000     // Timestamp
}
```

### 5.2 Caretaker Record

```javascript
{
  hostel_id: "CARE001",        // Primary Key
  password: "hashed_password", // Encrypted
  name: "Ramesh Kumar",
  email: "ramesh@hostel.edu",
  phone: "+91-9876543211",
  block: "A",                  // Assigned block
  createdAt: 1692451200000     // Timestamp
}
```

---

## 6. Validation Rules

### 6.1 Client-Side Validation

```javascript
// Check all fields are filled
if (!role || !name || !id || !email || !phone || !password || !confirmPassword) {
  showError('Please fill in all fields');
}

// Check password match
if (password !== confirmPassword) {
  showError('Passwords do not match');
}

// Check password strength
if (!/[A-Z]/.test(password)) {
  showError('Password must contain uppercase letter');
}
```

### 6.2 Server-Side Validation

```javascript
// Check for duplicate ID
const existingUser = db.find(u => u.hostel_id === id);
if (existingUser) {
  return { success: false, message: 'User already exists' };
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return { success: false, message: 'Invalid email format' };
}
```

---

## 7. Error Handling

| Error | Message | Action |
|-------|---------|--------|
| Empty fields | "Please fill in all fields" | Highlight empty fields |
| Password mismatch | "Passwords do not match" | Clear confirm password |
| Weak password | "Password must meet requirements" | Show password rules |
| Duplicate ID | "User already exists" | Clear ID field |
| Invalid email | "Invalid email format" | Highlight email field |

---

## 8. Success Response

### 8.1 UI Feedback

```
┌────────────────────────────────┐
│ ✅ Account created successfully! │
│ You can now login.             │
└────────────────────────────────┘
```

### 8.2 Redirect

After successful registration:
1. Show success message for 2 seconds
2. Switch to login form
3. Pre-fill the ID field (optional)

---

## 9. Security Considerations

| Aspect | Implementation |
|--------|----------------|
| Password Storage | Hashed before storage |
| Input Sanitization | XSS prevention |
| Rate Limiting | Prevent brute force |
| Audit Logging | Track registration attempts |

---

## 10. Test Cases

| Test ID | Description | Input | Expected Result |
|---------|-------------|-------|-----------------|
| TC-01 | Successful registration | Valid student data | Account created |
| TC-02 | Duplicate ID | Existing STU001 | Error: User exists |
| TC-03 | Weak password | "pass" | Error: Password too weak |
| TC-04 | Password mismatch | Different passwords | Error: Passwords don't match |
| TC-05 | Empty fields | Missing name | Error: Fill all fields |
| TC-06 | Invalid email | "invalid" | Error: Invalid email |

---

## 11. Implementation Reference

### Source Code Location
- **Function**: `Auth.register(userData, role)`
- **File**: `auth.js`
- **Lines**: 108-134

### Related Functions
- `validatePassword(password)` - Password strength check
- `getDbKey(role)` - Database key mapping

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-19 | Initial documentation |
