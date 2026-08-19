# FR-03: Role Identification

## Overview

FR-03 defines the role identification process in the Hostel Management System. After successful credential validation, the system identifies and assigns the appropriate role to the authenticated user.

---

## 1. Functional Description

### 1.1 Purpose
Determine and assign the correct user role after successful authentication to enable role-based access control.

### 1.2 Scope
- Role detection from user selection
- Role assignment to session
- Role validation
- Role-based redirect

---

## 2. User Roles

### 2.1 Role Hierarchy

```
┌─────────────────────────────────────┐
│              ADMIN                  │
│     • Full system access            │
│     • User management               │
│     • System settings               │
└───────────────┬─────────────────────┘
                │
┌───────────────┴─────────────────────┐
│           CARETAKER                 │
│     • Block management              │
│     • Room inspection               │
│     • Complaint handling            │
└───────────────┬─────────────────────┘
                │
┌───────────────┴─────────────────────┐
│            STUDENT                  │
│     • Personal dashboard            │
│     • Submit requests               │
│     • View announcements            │
└─────────────────────────────────────┘
```

### 2.2 Role Properties

| Role | Description | Access Level |
|------|-------------|--------------|
| Admin | System administrator | Full access |
| Caretaker | Hostel block manager | Block-level access |
| Student | Hostel resident | Personal access only |

---

## 3. Role Identification Process

### 3.1 Identification Flow

```
┌─────────────────────────────────┐
│     User Selects Role           │
│  [Student] [Caretaker] [Admin]  │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│     User Enters Credentials     │
│  • ID: STU001                  │
│  • Password: Student@123       │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│     Credential Validation       │
│  (FR-02 process)               │
└─────────────┬───────────────────┘
              │ Success
              ▼
┌─────────────────────────────────┐
│     Role Assignment             │
│  • role = "student"            │
│  • Stored in session           │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│     Dashboard Selection         │
│  • Based on role               │
│  • Load appropriate pages      │
└─────────────────────────────────┘
```

### 3.2 Role Detection from ID

```javascript
// Automatic role detection (backup method)
function getRoleFromId(id) {
  const studentDb = JSON.parse(localStorage.getItem('hm_student_db') || '[]');
  const caretakerDb = JSON.parse(localStorage.getItem('hm_caretaker_db') || '[]');
  const adminDb = JSON.parse(localStorage.getItem('hm_admin_db') || '[]');

  if (adminDb.some(u => u.key === id)) return 'admin';
  if (studentDb.some(u => u.hostel_id === id)) return 'student';
  if (caretakerDb.some(u => u.hostel_id === id)) return 'caretaker';
  
  return null;
}
```

---

## 4. Role-Based Dashboards

### 4.1 Admin Dashboard

```
┌────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD                                   │
├────────────────────────────────────────────────────┤
│  Statistics:                                       │
│  • Total Users: 156                                │
│  • Occupancy: 89%                                  │
│  • Active Sessions: 24                             │
├────────────────────────────────────────────────────┤
│  Navigation:                                       │
│  • Admin Panel                                     │
│  • User Management                                 │
│  • System Settings                                 │
│  • Announcements                                   │
│  • Reports                                         │
└────────────────────────────────────────────────────┘
```

### 4.2 Caretaker Dashboard

```
┌────────────────────────────────────────────────────┐
│  CARETAKER DASHBOARD                               │
├────────────────────────────────────────────────────┤
│  Statistics:                                       │
│  • Assigned Students: 45                           │
│  • Pending Inspections: 8                          │
│  • Resolved Issues: 12                             │
├────────────────────────────────────────────────────┤
│  Navigation:                                       │
│  • Announcements                                   │
│  • Complaints                                      │
│  • Maintenance                                     │
│  • Room Inspection                                 │
│  • Student List                                    │
└────────────────────────────────────────────────────┘
```

### 4.3 Student Dashboard

```
┌────────────────────────────────────────────────────┐
│  STUDENT DASHBOARD                                 │
├────────────────────────────────────────────────────┤
│  Statistics:                                       │
│  • Your Room: Block A · 115                        │
│  • Announcements: 3                                │
│  • Open Requests: 1                                │
├────────────────────────────────────────────────────┤
│  Navigation:                                       │
│  • Announcements                                   │
│  • Complaints                                      │
│  • Maintenance                                     │
│  • Non Local Outing                                │
│  • Hostel Blocks                                   │
│  • Room Allocation                                 │
│  • Contact Us                                      │
└────────────────────────────────────────────────────┘
```

---

## 5. Session Role Storage

### 5.1 Session Object Structure

```javascript
{
  sessionId: "sess_abc123xyz_1692451200000",
  userId: "STU001",
  name: "John Doe",
  role: "student",          // <-- Role stored here
  loginTime: 1692451200000,
  expiresAt: 1692453000000
}
```

### 5.2 Role Usage in Application

```javascript
// Get role from session
const session = Auth.getSession();
const role = session.role;

// Check page access
if (Auth.checkAccess(role, page)) {
  // Allow access
} else {
  // Deny access
}

// Load role-specific dashboard
showDashboard(role);
```

---

## 6. Role-Based UI Updates

### 6.1 Navigation Updates

```javascript
// Hide all navigation
document.querySelectorAll('.main-nav').forEach(nav => {
  nav.hidden = true;
});

// Show role-specific navigation
document.getElementById(`${role}Nav`).hidden = false;
```

### 6.2 Profile Updates

```javascript
// Update profile sidebar
document.querySelector('#profileName').textContent = session.name;
document.querySelector('#profileId').textContent = session.userId;
document.querySelector('#profileRole').textContent = 
  session.role.charAt(0).toUpperCase() + session.role.slice(1);
```

---

## 7. Test Cases

| Test ID | Description | Input | Expected Result |
|---------|-------------|-------|-----------------|
| TC-01 | Student role identification | STU001 login | role = "student" |
| TC-02 | Caretaker role identification | CARE001 login | role = "caretaker" |
| TC-03 | Admin role identification | admin001 login | role = "admin" |
| TC-04 | Role stored in session | Any login | Session contains role |
| TC-05 | Role used for access control | Student accessing admin page | Access denied |

---

## 8. Implementation Reference

### Source Code Location

```javascript
// Role identification in validation
function validateCredentials(id, password, role) {
  // ...
  return { success: true, user: { ...user, role } };
}

// Role-based access control
const ACCESS_CONTROL = {
  admin: {
    allowedPages: ['Dashboard', 'Admin Panel', 'User Management', ...],
    defaultPage: 'Admin Panel'
  },
  student: {
    allowedPages: ['Dashboard', 'Announcements', 'Complaints', ...],
    defaultPage: 'Dashboard'
  },
  caretaker: {
    allowedPages: ['Dashboard', 'Announcements', 'Complaints', ...],
    defaultPage: 'Dashboard'
  }
};
```

### Related Functions
- `getRoleFromId(id)` - Detect role from ID
- `checkAccess(role, page)` - Verify page access
- `getDefaultPage(role)` - Get default landing page

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-19 | Initial documentation |
