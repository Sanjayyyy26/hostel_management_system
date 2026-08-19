# FR-04: Role-Based Access Control

## Overview

FR-04 defines the role-based access control (RBAC) system for the Hostel Management System. This feature ensures users can only access pages and features appropriate for their role.

---

## 1. Functional Description

### 1.1 Purpose
Restrict access to system features based on user roles to ensure security and appropriate functionality distribution.

### 1.2 Scope
- Page-level access control
- Feature-level permissions
- Navigation filtering
- Access denied handling

---

## 2. Access Control Matrix

### 2.1 Complete Permission Table

| Feature/Page | Admin | Caretaker | Student |
|--------------|-------|-----------|---------|
| Dashboard | ✅ | ✅ | ✅ |
| Announcements | ✅ | ✅ | ✅ |
| Complaints | ✅ | ✅ | ✅ |
| Maintenance | ✅ | ✅ | ✅ |
| Admin Panel | ✅ | ❌ | ❌ |
| User Management | ✅ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ |
| Reports | ✅ | ❌ | ❌ |
| Room Inspection | ❌ | ✅ | ❌ |
| Student List | ❌ | ✅ | ❌ |
| Non Local Outing | ❌ | ❌ | ✅ |
| Hostel Blocks | ✅ | ❌ | ✅ |
| Room Allocation | ❌ | ❌ | ✅ |
| Contact Us | ❌ | ❌ | ✅ |

### 2.2 Permission Summary

| Role | Total Pages | Default Page |
|------|-------------|--------------|
| Admin | 8 | Admin Panel |
| Caretaker | 6 | Dashboard |
| Student | 8 | Dashboard |

---

## 3. Access Control Implementation

### 3.1 Configuration Object

```javascript
const ACCESS_CONTROL = {
  admin: {
    allowedPages: [
      'Dashboard',
      'Admin Panel',
      'User Management',
      'System Settings',
      'Announcements',
      'Reports',
      'Hostel Blocks'
    ],
    defaultPage: 'Admin Panel'
  },
  student: {
    allowedPages: [
      'Dashboard',
      'Announcements',
      'Complaints',
      'Maintenance',
      'Non Local Outing',
      'Hostel Blocks',
      'Hostel Room Allocation',
      'Contact Us'
    ],
    defaultPage: 'Dashboard'
  },
  caretaker: {
    allowedPages: [
      'Dashboard',
      'Announcements',
      'Complaints',
      'Maintenance',
      'Room Inspection',
      'Hostel Blocks',
      'Student List'
    ],
    defaultPage: 'Dashboard'
  }
};
```

### 3.2 Access Check Function

```javascript
function checkAccess(role, page) {
  const permissions = ACCESS_CONTROL[role];
  if (!permissions) return false;
  return permissions.allowedPages.includes(page);
}
```

---

## 4. Access Control Flow

### 4.1 Page Navigation Flow

```
┌─────────────────────────────────┐
│     User Clicks Page Link       │
│  e.g., "Room Inspection"       │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│     Get Current Session        │
│  • Retrieve role from session  │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│     Check Access Permission     │
│  checkAccess(role, page)       │
└─────────────┬───────────────────┘
              │
     ┌────────┴────────┐
     │                 │
     ▼                 ▼
┌─────────────┐   ┌─────────────┐
│   ALLOWED   │   │   DENIED    │
│             │   │             │
│ Load page   │   │ Show toast  │
│ content     │   │ "Access     │
│             │   │  denied"    │
└─────────────┘   └─────────────┘
```

### 4.2 Implementation Code

```javascript
function loadPage(role, page) {
  // Check access permission
  if (!Auth.checkAccess(role, page)) {
    showToast('Access denied to this page', 'error');
    return;
  }

  // Load page content
  const pageContent = document.querySelector('#pageContent');
  pageContent.innerHTML = getPageContent(role, page);
}
```

---

## 5. Navigation Filtering

### 5.1 Role-Specific Navigation

Each role has its own navigation menu that shows only allowed pages:

```html
<!-- Student Navigation -->
<nav class="main-nav student-nav" id="studentNav">
  <button data-page="Dashboard">Dashboard</button>
  <button data-page="Announcements">Announcements</button>
  <button data-page="Complaints">Complaints</button>
  <button data-page="Maintenance">Maintenance</button>
  <button data-page="Non Local Outing">Non Local Outing</button>
  <button data-page="Hostel Blocks">Hostel Blocks</button>
</nav>

<!-- Caretaker Navigation -->
<nav class="main-nav caretaker-nav" id="caretakerNav" hidden>
  <button data-page="Dashboard">Dashboard</button>
  <button data-page="Room Inspection">Room Inspection</button>
  <button data-page="Student List">Student List</button>
  <!-- ... -->
</nav>

<!-- Admin Navigation -->
<nav class="main-nav admin-nav" id="adminNav" hidden>
  <button data-page="Dashboard">Dashboard</button>
  <button data-page="Admin Panel">Admin Panel</button>
  <button data-page="User Management">User Management</button>
  <!-- ... -->
</nav>
```

### 5.2 Navigation Switching

```javascript
function showDashboard(role) {
  // Hide all navigation
  document.querySelectorAll('.main-nav').forEach(nav => {
    nav.hidden = true;
  });

  // Show role-specific navigation
  document.getElementById(`${role}Nav`).hidden = false;
}
```

---

## 6. Access Denied Handling

### 6.1 Toast Notification

```javascript
// When access is denied
showToast('Access denied to this page', 'error');
```

### 6.2 Toast Styles

```css
.toast.error {
  background: var(--red);
  color: white;
}
```

---

## 7. Default Page Behavior

### 7.1 Default Page Function

```javascript
function getDefaultPage(role) {
  return ACCESS_CONTROL[role]?.defaultPage || 'Dashboard';
}
```

### 7.2 Default Pages by Role

| Role | Default Page | Rationale |
|------|--------------|-----------|
| Admin | Admin Panel | Primary admin function |
| Caretaker | Dashboard | Overview of tasks |
| Student | Dashboard | Overview of status |

---

## 8. Test Cases

### 8.1 Access Allowed

| Test ID | Role | Page | Expected Result |
|---------|------|------|-----------------|
| TC-01 | Student | Dashboard | ✅ Access granted |
| TC-02 | Student | Complaints | ✅ Access granted |
| TC-03 | Caretaker | Room Inspection | ✅ Access granted |
| TC-04 | Caretaker | Student List | ✅ Access granted |
| TC-05 | Admin | User Management | ✅ Access granted |
| TC-06 | Admin | System Settings | ✅ Access granted |

### 8.2 Access Denied

| Test ID | Role | Page | Expected Result |
|---------|------|------|-----------------|
| TC-07 | Student | Admin Panel | ❌ Access denied |
| TC-08 | Student | User Management | ❌ Access denied |
| TC-09 | Caretaker | Admin Panel | ❌ Access denied |
| TC-10 | Caretaker | System Settings | ❌ Access denied |
| TC-11 | Admin | Non Local Outing | ❌ Access denied |
| TC-12 | Admin | Contact Us | ❌ Access denied |

---

## 9. Security Considerations

| Threat | Mitigation |
|--------|------------|
| Direct URL access | Server-side validation |
| Manipulated requests | Session validation |
| Role escalation | Strict RBAC enforcement |
| Client-side bypass | Server-side checks recommended |

---

## 10. Implementation Reference

### Source Code Location

```javascript
// auth.js - Access control configuration
const ACCESS_CONTROL = { ... };

// auth.js - Access check function
function checkAccess(role, page) { ... }

// script.js - Load page with access check
function loadPage(role, page) {
  if (!Auth.checkAccess(role, page)) {
    showToast('Access denied to this page', 'error');
    return;
  }
  // ...
}
```

### Related Functions
- `checkAccess(role, page)` - Verify access permission
- `getDefaultPage(role)` - Get default landing page
- `loadPage(role, page)` - Load page with access check

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-19 | Initial documentation |
