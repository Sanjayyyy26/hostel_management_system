# 🏨 Hostel Management System

A secure web-based hostel management system with role-based authentication for Admin, Student, and Caretaker users.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 📋 Features

### Authentication System
- ✅ **FR-01**: User Registration (Student & Caretaker)
- ✅ **FR-02**: Credential Validation
- ✅ **FR-03**: Role Identification
- ✅ **FR-04**: Role-Based Access Control (RBAC)
- ✅ **FR-05**: Session Management with timeout
- ✅ **FR-06**: Secure Logout

### User Roles

| Role | Features |
|------|----------|
| **Admin** | System management, User management, Reports, Settings |
| **Caretaker** | Room inspection, Student list, Complaints, Maintenance |
| **Student** | Dashboard, Complaints, Maintenance requests, Outing requests |

---

## 🚀 Quick Start

### 1. Open the Application

Simply open `index.html` in a modern web browser.

### 2. Test Credentials

#### Admin Login
| Field | Value |
|-------|-------|
| Key | `admin001` |
| Password | `Admin@123` |

#### Student Login
| Field | Value |
|-------|-------|
| ID | `STU001` |
| Password | `Student@123` |

#### Caretaker Login
| Field | Value |
|-------|-------|
| ID | `CARE001` |
| Password | `Caretaker@123` |

---

## 📁 Project Structure

```
hostel_management_system/
├── index.html          # Main HTML file
├── auth.js            # Authentication module
├── pages.js           # Page templates for each role
├── script.js          # Main application logic
├── style.css          # Stylesheet
├── README.md          # This file
└── docs/              # Documentation
    ├── README.md          # Documentation index
    ├── FR-01-User-Registration.md
    ├── FR-02-Credential-Validation.md
    ├── FR-03-Role-Identification.md
    ├── FR-04-Role-Based-Access-Control.md
    ├── FR-05-Session-Management.md
    ├── FR-06-Logout.md
    ├── Database-Schema.md
    ├── Security.md
    └── API-Reference.md
```

---

## 🔐 Security Features

| Feature | Status |
|---------|--------|
| Password Policy (8+ chars, uppercase, lowercase, number) | ✅ Implemented |
| Role-Based Access Control | ✅ Implemented |
| Session Timeout (30 minutes) | ✅ Implemented |
| Input Validation | ✅ Implemented |
| Session Warning Modal | ✅ Implemented |

---

## 🛠️ Technical Details

### Storage
- **Database**: Browser LocalStorage
- **Session**: Client-side session management

### Session Duration
- **Timeout**: 30 minutes
- **Warning**: 5 minutes before expiry
- **Renewal**: Click "Extend Session" to renew

---

## 📚 Documentation

Complete documentation is available in the `docs/` folder:

- [Documentation Index](docs/README.md)
- [FR-01: User Registration](docs/FR-01-User-Registration.md)
- [FR-02: Credential Validation](docs/FR-02-Credential-Validation.md)
- [FR-03: Role Identification](docs/FR-03-Role-Identification.md)
- [FR-04: Role-Based Access Control](docs/FR-04-Role-Based-Access-Control.md)
- [FR-05: Session Management](docs/FR-05-Session-Management.md)
- [FR-06: Logout](docs/FR-06-Logout.md)
- [Database Schema](docs/Database-Schema.md)
- [Security Features](docs/Security.md)
- [API Reference](docs/API-Reference.md)

---

## 🧪 Testing

### Test User Accounts

#### Admin Accounts
| Key | Password | Name |
|-----|----------|------|
| admin001 | Admin@123 | Super Admin |
| admin002 | Admin@456 | Hostel Admin |

#### Student Accounts
| ID | Password | Name |
|----|----------|------|
| STU001 | Student@123 | Sreenivas |
| STU002 | Student@456 | Rahul Kumar |

#### Caretaker Accounts
| ID | Password | Name |
|----|----------|------|
| CARE001 | Caretaker@123 | Ramesh |
| CARE002 | Caretaker@456 | Suresh |

---

## 🔄 Functional Requirements Implementation

### FR-01: User Registration
- Self-registration for Students and Caretakers
- Input validation
- Password strength enforcement
- Duplicate detection

### FR-02: Credential Validation
- Secure login process
- Role-based database lookup
- Password verification

### FR-03: Role Identification
- Automatic role detection
- Role assignment to session
- Role-based UI customization

### FR-04: Role-Based Access Control
- Page-level permissions
- Navigation filtering
- Access denied handling

### FR-05: Session Management
- 30-minute session timeout
- Session renewal capability
- Warning before expiry
- Auto-logout on timeout

### FR-06: Logout
- Session destruction
- UI state reset
- Timer cleanup
- User feedback

---

## 📝 License

This project is licensed under the MIT License.

---

## 👥 Contributors

- Sanjay Kumar - Initial development

---

## 📞 Support

For support, please open an issue on the GitHub repository.
