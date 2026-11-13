# Hostel Management System - Documentation

## Project Specification

- [Software Requirements Specification](./SRS.md) — scope, actors, functional and quality requirements, interfaces, data requirements, and acceptance criteria.
- [UML Diagrams](./UML.md) — use case, domain class, sign-in sequence, complaint activity, and deployment views.

## 📚 Functional Requirements Documentation

This folder contains comprehensive documentation for the Hostel Management System's authentication and authorization module.

### Functional Requirements (FR-01 to FR-06)

| Document | Title | Description |
|----------|-------|-------------|
| [FR-01](./FR-01-User-Registration.md) | User Registration | New user account creation process |
| [FR-02](./FR-02-Credential-Validation.md) | Credential Validation | Login credential verification |
| [FR-03](./FR-03-Role-Identification.md) | Role Identification | User role detection after authentication |
| [FR-04](./FR-04-Role-Based-Access-Control.md) | Role-Based Access Control | Page and feature access permissions |
| [FR-05](./FR-05-Session-Management.md) | Session Management | Active session handling and timeout |
| [FR-06](./FR-06-Logout.md) | Logout | Secure session termination |

### Additional Documentation

| Document | Title | Description |
|----------|-------|-------------|
| [Database Schema](./Database-Schema.md) | Database Schema | Table structures and relationships |
| [Security](./Security.md) | Security Features | Security implementation details |
| [API Reference](./API-Reference.md) | API Reference | Auth module API documentation |

---

## System Overview

The Hostel Management System implements a secure authentication system with:

- **Three User Roles**: Admin, Student, Caretaker
- **Role-Based Access Control (RBAC)**: Different dashboards and features per role
- **Session Management**: Automatic timeout and session renewal
- **Password Security**: Strong password policies enforced

## Database Tables

### Admin Table
```
┌─────────────────────────────────────┐
│ Admin Table                         │
├─────────────────────────────────────┤
│ key (Primary Key)                   │
│ password                            │
│ name                                │
│ email                               │
│ createdAt                           │
└─────────────────────────────────────┘
```

### Hostel_Login Table (Students & Caretakers)
```
┌─────────────────────────────────────┐
│ Hostel_Login Table                  │
├─────────────────────────────────────┤
│ hostel_id (Primary Key)            │
│ password                            │
│ role (student/caretaker)           │
│ name                                │
│ email                               │
│ phone                               │
│ createdAt                           │
└─────────────────────────────────────┘
```

## Quick Start

### Test Credentials

#### Admin
- Key: `admin001`
- Password: `Admin@123`

#### Student
- ID: `STU001`
- Password: `Student@123`

#### Caretaker
- ID: `CARE001`
- Password: `Caretaker@123`

### Running the Application

1. Open `index.html` in a modern web browser
2. Select your role (Student/Caretaker/Admin)
3. Enter your credentials
4. Click "Sign In"

---

## License

Hostel Management System Documentation © 2026
