# Database Schema

## Overview

This document describes the database schema used in the Hostel Management System's authentication module.

---

## 1. Database Tables

### 1.1 Admin Table

The Admin table stores administrator account information.

```
┌─────────────────────────────────────────────────────────────┐
│                        ADMIN TABLE                         │
├─────────────────────────────────────────────────────────────┤
│  Storage Key: hm_admin_db                                  │
├─────────────────────────────────────────────────────────────┤
│  Field          │ Type      │ Description                  │
├─────────────────┼───────────┼──────────────────────────────┤
│  key            │ String    │ Primary Key (Admin Key)      │
│  password       │ String    │ Admin password               │
│  name           │ String    │ Admin's full name            │
│  email          │ String    │ Admin email address          │
│  createdAt      │ Number    │ Account creation timestamp   │
└─────────────────────────────────────────────────────────────┘
```

#### Sample Record

```javascript
{
  key: "admin001",
  password: "Admin@123",
  name: "Super Admin",
  email: "admin@hostel.edu",
  createdAt: 1692451200000
}
```

---

### 1.2 Student Table

The Student table stores student account information.

```
┌─────────────────────────────────────────────────────────────┐
│                       STUDENT TABLE                        │
├─────────────────────────────────────────────────────────────┤
│  Storage Key: hm_student_db                                │
├─────────────────────────────────────────────────────────────┤
│  Field          │ Type      │ Description                  │
├─────────────────┼───────────┼──────────────────────────────┤
│  hostel_id      │ String    │ Primary Key (Student ID)     │
│  password       │ String    │ Student password             │
│  name           │ String    │ Student's full name          │
│  email          │ String    │ Student email address        │
│  phone          │ String    │ Contact number               │
│  roll           │ String    │ University roll number       │
│  room           │ String    │ Allocated room number        │
│  block          │ String    │ Hostel block                 │
│  createdAt      │ Number    │ Account creation timestamp   │
└─────────────────────────────────────────────────────────────┘
```

#### Sample Record

```javascript
{
  hostel_id: "STU001",
  password: "Student@123",
  name: "Sreenivas",
  email: "sreenivas@hostel.edu",
  phone: "+91-9876543210",
  roll: "52125",
  room: "115",
  block: "A",
  createdAt: 1692451200000
}
```

---

### 1.3 Caretaker Table

The Caretaker table stores caretaker account information.

```
┌─────────────────────────────────────────────────────────────┐
│                     CARETAKER TABLE                        │
├─────────────────────────────────────────────────────────────┤
│  Storage Key: hm_caretaker_db                              │
├─────────────────────────────────────────────────────────────┤
│  Field          │ Type      │ Description                  │
├─────────────────┼───────────┼──────────────────────────────┤
│  hostel_id      │ String    │ Primary Key (Caretaker ID)   │
│  password       │ String    │ Caretaker password           │
│  name           │ String    │ Caretaker's full name        │
│  email          │ String    │ Caretaker email address      │
│  phone          │ String    │ Contact number               │
│  block          │ String    │ Assigned hostel block        │
│  createdAt      │ Number    │ Account creation timestamp   │
└─────────────────────────────────────────────────────────────┘
```

#### Sample Record

```javascript
{
  hostel_id: "CARE001",
  password: "Caretaker@123",
  name: "Ramesh",
  email: "ramesh@hostel.edu",
  phone: "+91-9876543211",
  block: "A",
  createdAt: 1692451200000
}
```

---

### 1.4 Session Table

The Session table stores active user sessions.

```
┌─────────────────────────────────────────────────────────────┐
│                       SESSION TABLE                        │
├─────────────────────────────────────────────────────────────┤
│  Storage Key: hm_session                                   │
├─────────────────────────────────────────────────────────────┤
│  Field          │ Type      │ Description                  │
├─────────────────┼───────────┼──────────────────────────────┤
│  sessionId      │ String    │ Unique session identifier    │
│  userId         │ String    │ User's ID (hostel_id/key)    │
│  name           │ String    │ User's name                  │
│  role           │ String    │ User's role                  │
│  loginTime      │ Number    │ Login timestamp              │
│  expiresAt      │ Number    │ Expiration timestamp         │
└─────────────────────────────────────────────────────────────┘
```

#### Sample Record

```javascript
{
  sessionId: "sess_abc123xyz_1692451200000",
  userId: "STU001",
  name: "Sreenivas",
  role: "student",
  loginTime: 1692451200000,
  expiresAt: 1692453000000
}
```

---

## 2. Storage Keys

| Table | Storage Key | Type |
|-------|-------------|------|
| Admin | `hm_admin_db` | Array |
| Student | `hm_student_db` | Array |
| Caretaker | `hm_caretaker_db` | Array |
| Session | `hm_session` | Object |

---

## 3. Database Initialization

### 3.1 Default Data

The system initializes with default data on first load:

```javascript
// Admin accounts
[
  { key: 'admin001', password: 'Admin@123', name: 'Super Admin', email: 'admin@hostel.edu' },
  { key: 'admin002', password: 'Admin@456', name: 'Hostel Admin', email: 'hostel.admin@edu' }
]

// Student accounts
[
  { hostel_id: 'STU001', password: 'Student@123', name: 'Sreenivas', roll: '52125', room: '115', block: 'A' },
  { hostel_id: 'STU002', password: 'Student@456', name: 'Rahul Kumar', roll: '52126', room: '116', block: 'A' }
]

// Caretaker accounts
[
  { hostel_id: 'CARE001', password: 'Caretaker@123', name: 'Ramesh', block: 'A' },
  { hostel_id: 'CARE002', password: 'Caretaker@456', name: 'Suresh', block: 'B' }
]
```

### 3.2 Initialization Code

```javascript
function initializeDatabase() {
  // Initialize Admin table
  if (!localStorage.getItem('hm_admin_db')) {
    const admins = [...];
    localStorage.setItem('hm_admin_db', JSON.stringify(admins));
  }

  // Initialize Student table
  if (!localStorage.getItem('hm_student_db')) {
    const students = [...];
    localStorage.setItem('hm_student_db', JSON.stringify(students));
  }

  // Initialize Caretaker table
  if (!localStorage.getItem('hm_caretaker_db')) {
    const caretakers = [...];
    localStorage.setItem('hm_caretaker_db', JSON.stringify(caretakers));
  }
}
```

---

## 4. ID Format Standards

| Role | ID Format | Example | Length |
|------|-----------|---------|--------|
| Admin | `admin###` | `admin001` | 8 chars |
| Student | `STU###` | `STU001` | 6 chars |
| Caretaker | `CARE###` | `CARE001` | 7 chars |

---

## 5. Relationships

### 5.1 Entity Relationships

```
┌─────────────────┐     ┌─────────────────┐
│     ADMIN       │     │    SESSION       │
├─────────────────┤     ├─────────────────┤
│ key (PK)        │────<│ userId (FK)     │
│ password        │     │ role            │
│ name            │     │ sessionId       │
│ email           │     │ expiresAt       │
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│    STUDENT      │     │    SESSION       │
├─────────────────┤     ├─────────────────┤
│ hostel_id (PK)  │────<│ userId (FK)     │
│ password        │     │ role            │
│ name            │     │ sessionId       │
│ room            │     │ expiresAt       │
│ block           │     └─────────────────┘
└─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│   CARETAKER     │     │    SESSION       │
├─────────────────┤     ├─────────────────┤
│ hostel_id (PK)  │────<│ userId (FK)     │
│ password        │     │ role            │
│ name            │     │ sessionId       │
│ block           │     │ expiresAt       │
└─────────────────┘     └─────────────────┘
```

---

## 6. Password Policy

### 6.1 Requirements

| Rule | Requirement |
|------|-------------|
| Minimum Length | 8 characters |
| Uppercase Letters | At least 1 |
| Lowercase Letters | At least 1 |
| Numbers | At least 1 |
| Special Characters | Optional |

### 6.2 Validation Function

```javascript
function validatePassword(password) {
  if (password.length < 8) return { valid: false, message: 'Too short' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Need uppercase' };
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Need lowercase' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Need number' };
  return { valid: true };
}
```

---

## 7. Data Operations

### 7.1 CRUD Operations

| Operation | Function | Description |
|-----------|----------|-------------|
| Create | `Auth.register()` | Add new user |
| Read | `Auth.validateCredentials()` | Fetch user by ID |
| Update | Direct localStorage | Modify user data |
| Delete | Direct localStorage | Remove user |

### 7.2 Query Functions

```javascript
// Find user by ID
const user = users.find(u => u.hostel_id === id || u.key === id);

// Check duplicate
const exists = users.some(u => u.hostel_id === userData.hostel_id);

// Get all users
const users = JSON.parse(localStorage.getItem(dbKey) || '[]');
```

---

## 8. Migration Notes

### 8.1 Production Considerations

For production deployment, consider:

| Aspect | Recommendation |
|--------|----------------|
| Storage | Use real database (MySQL, PostgreSQL) |
| Password | Hash with bcrypt/argon2 |
| Encryption | Use HTTPS |
| Backup | Implement regular backups |
| Validation | Server-side validation |

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-19 | Initial documentation |
