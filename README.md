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

### 1. Start the Application
Run the PostgreSQL-backed Node.js server:
```bash
npm start
```
Then visit **http://localhost:3000** in your browser.

### 2. Test Credentials (from PostgreSQL Database)

#### Admin Login
| Role | Identifier | Password |
|------|------------|----------|
| **Admin** | `Admin_001` | `Admin@001` |
| **Admin** | `Admin_002` | `Admin@002` |

#### Caretaker Login
| Role | Identifier | Password | Assigned Block |
|------|------------|----------|----------------|
| **Caretaker** | `EMP_001` | `OC@001` | Vamsadhara, Nagavalli |
| **Caretaker** | `EMP_002` | `TC@002` | Sabari, Indhravathi |
| **Caretaker** | `EMP_003` | `TC@003` | Krishna |

#### Student Login
| Role | Roll No / Email | Password | Assigned Room |
|------|-----------------|----------|---------------|
| **Student** | `424001` | `FP@001` | Sabari (Room 101) |
| **Student** | `524001` | `SP@001` | Indhravathi (Room 101) |
| **Student** | `325003` | `TP@003` | Krishna (Room 101) |
| **Student** | `425005` | `FP@005` | Nagavalli (Room 101) |

*(You can also register a brand new student using the **Register** button on the website)*

---

## 📁 Project Architecture

```
hostel_management_system/
├── frontend/                     # Client-Side Application (HTML5 / CSS3 / Vanilla JS SPA)
│   ├── index.html                # Main SPA Layout, Modals & Dynamic Containers
│   ├── style.css                 # Unified Responsive CSS Design System
│   ├── auth.js                   # Client-side Session Management, JWT & Route Guards
│   ├── pages.js                  # Dynamic View Templates (Student, Caretaker, Admin)
│   ├── script.js                 # Event Controllers, Interactivity & DOM Routing
│   └── README.md                 # Frontend Documentation & Architecture
│
├── backend/                      # Server-Side Service (Node.js + Express + PostgreSQL)
│   ├── server.js                 # Express REST API Server & Business Logic Endpoints
│   ├── db.js                     # PostgreSQL Connection Pool Configuration (pg)
│   ├── database.sql              # Relational Database Schema (DDL) & Seed Data
│   ├── scripts/
│   │   └── setup-db.js           # Database Provisioning & Migration Script
│   ├── package.json              # Backend Package Descriptor
│   └── README.md                 # Backend REST API Reference & Schema Docs
│
├── testing/                      # Automated Regression Suite (Selenium 4 + JUnit 5)
│   ├── pom.xml                   # Maven Build Configuration
│   ├── mvnw                      # Portable Maven Wrapper Script
│   ├── src/test/java/com/hostel/ # 38 End-to-End Automated Test Cases (TC-01 to TC-38)
│   ├── TEST_EXECUTION_REPORT.md  # Formal Verification & Results Report
│   └── README.md                 # Test Execution & Running Guide
│
├── docs/                         # Software Engineering Requirements & Specifications
│   ├── API-Reference.md
│   ├── Database-Schema.md
│   ├── FR-01-User-Registration.md
│   ├── FR-02-Credential-Validation.md
│   ├── FR-03-Role-Identification.md
│   ├── FR-04-Role-Based-Access-Control.md
│   ├── FR-05-Session-Management.md
│   ├── FR-06-Logout.md
│   └── README.md
│
├── package.json                  # Root Task Runner & Script Orchestrator
└── README.md                     # Master Project Documentation
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
- **Database**: PostgreSQL (Backed by pg connection pool)
- **API**: Express.js REST API with Token-based sessions

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

### Automated Selenium WebDriver & JUnit 5 Suite
The project contains a comprehensive automated regression suite consisting of **38 test cases (TC-01 to TC-38)** covering end-to-end user workflows, positive/negative validation, and database persistence checks:

- **Framework**: Selenium WebDriver 4.25.0 + JUnit 5 (Jupiter 5.11.0)
- **Database Verification**: PostgreSQL JDBC connection
- **Total Tests**: 38 | **Passed**: 38 | **Failed**: 0 | **Skipped**: 0
- **Test File**: [`testing/src/test/java/com/hostel/HostelManagementTest.java`](testing/src/test/java/com/hostel/HostelManagementTest.java)
- **Full Test Report**: [`testing/TEST_EXECUTION_REPORT.md`](testing/TEST_EXECUTION_REPORT.md)
- **Testing Guide**: [`testing/README.md`](testing/README.md)

#### How to Run the Automated Tests:
Ensure the application is running (`node server.js`), then in a new terminal run:
```bash
cd testing
./mvnw test
```

### Test User Accounts (from PostgreSQL Database)

#### Admin Accounts
| Key | Password | Name |
|-----|----------|------|
| `Admin_001` | `Admin@001` | Admin One |
| `Admin_002` | `Admin@002` | Admin Two |

#### Caretaker Accounts
| ID | Password | Name | Assigned Block |
|----|----------|------|----------------|
| `EMP_001` | `OC@001` | Indhravathi Caretaker | Indhravathi |
| `EMP_002` | `TC@002` | Sabari Caretaker | Sabari |
| `EMP_003` | `TC@003` | Krishna Caretaker | Krishna |

#### Student Accounts
| Roll Number | Password | Name | Assigned Room |
|-------------|----------|------|---------------|
| `424001` | `Student@001` | First Person | Sabari (Room 101) |
| `524001` | `Student@001` | Second Person | Indhravathi (Room 101) |
| `325003` | `Student@001` | Third Person | Krishna (Room 101) |
| `425005` | `Student@001` | Fourth Person | Nagavalli (Room 101) |

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
