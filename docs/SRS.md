# Hostellers - Hostel Management System
## Software Requirements Specification (SRS)

**Document version:** 2.1  
**Prepared:** 12 November 2026  
**Project team:** M.Sanjay pal (424150), Raj Gireesh (424169), P.Jyothiswar (424165)

## 1. Introduction

### 1.1 Purpose

This SRS describes the implemented Hostellers web application, its user-visible functions, interfaces, data, access rules, quality requirements, and verification approach. It is intended for project stakeholders, developers, testers, and maintainers. Requirements are grounded in the repository; behavior that is optional, transient, or deployment-dependent is identified as such.

### 1.2 Scope of the System

Hostellers supports hostel administration and resident workflows for Students, Caretakers, and Administrators. The primary system is a browser single-page application served by a Node.js/Express application and backed by PostgreSQL. It supports authentication, hostel block information and administration, announcements, complaints, maintenance logs, outing requests, room allocation and evacuation workflows, caretaker assignments, contacts, notifications, and administrator reports.

The repository also contains a separate Django API project. It is not the primary runtime described by this SRS. Third-party payment processing, biometric access hardware, and native mobile applications are outside the project scope.

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|---|---|
| Admin | User with system-wide administrative permissions. |
| Caretaker | Staff user assigned to one or more hostel blocks. |
| Student | Resident user who can access student workflows and own records. |
| Block | A hostel building represented by a hostel record. |
| RBAC | Role-based access control enforced by API middleware and role-specific UI. |
| Bearer token | Signed token sent with authenticated API requests. The implementation uses a custom HMAC-signed format, not a standards-based JWT. |
| SPA | Single-page application rendered in the browser. |
| SRS | Software Requirements Specification. |

### 1.4 References

- `backend/server.js` - primary Express routes and business logic.
- `backend/database.sql` - PostgreSQL schema and seed data.
- `backend/db.js` - PostgreSQL connection pool.
- `frontend/` - browser application, authentication, navigation, and role pages.
- `django_api/` - separate Django API project.
- `testing/` - Selenium/JUnit test source and execution documentation.
- `docs/API-Reference.md`, `docs/Database-Schema.md`, and `docs/Security.md` - supplementary project documentation; reconcile older descriptions against current code.

### 1.5 Overview

Section 2 describes the product and user classes. Section 3 provides system architecture and UML/ER diagrams. Section 4 lists functional requirements. Sections 5 and 6 define interfaces and nonfunctional requirements. Section 7 describes verification and requirements traceability.

## 2. Overall Description

### 2.1 Product Perspective

The primary runtime has three tiers: a browser SPA built with HTML, CSS, and JavaScript; a Node.js/Express REST API; and PostgreSQL accessed through the `pg` connection pool. Express serves the frontend and API from the same application. The server applies authentication and role checks, validates requests, and reads or writes relational data. Some server flows also use process-local fallback state; fallback data is not durable across restarts.

The Django project is separate. It uses Django function views and its own API routes, and its behavior is not assumed to have feature parity with the Express API.

### 2.2 Product Functions

The system provides the following implemented function groups:

- Sign in, student registration, role identification, session handling, and logout.
- Student dashboards and access to hostel block details, announcements, complaints, maintenance records, outings, room allocation/evacuation, notifications, and contacts.
- Caretaker views scoped to assigned blocks, with inspection, complaint, outing, maintenance, and announcement workflows.
- Administrator workflows for hostel blocks, caretaker accounts and assignments, allocation and evacuation requests/windows, contacts, reports, complaints, and announcements.
- PostgreSQL persistence for supported relational records, plus limited in-memory fallback behavior.

### 2.3 User Classes and Characteristics

| User class | Responsibilities and access |
|---|---|
| Student | Register and sign in; view hostel information and notices; submit and track complaints, maintenance logs, outings, allocation and evacuation requests; view personal notifications and contact information. |
| Caretaker | View assigned hostel blocks and residents; inspect rooms and maintenance records; review complaints and outings; update complaint/outings where permitted; publish or remove announcements within the authorized workflow. Caretakers cannot create, edit, or remove hostel blocks. |
| Administrator | Manage hostel blocks, caretaker accounts and block assignments, operational windows, allocation and evacuation decisions, system-wide information, contacts, reports, complaints, and announcements. |

### 2.4 Operating Environment

- Current mainstream desktop or mobile browser with JavaScript enabled.
- Node.js 18 or later and npm for the primary application.
- PostgreSQL reachable through the configured database connection for durable storage.
- Local development normally uses the Express server on port 3000.
- The optional automated browser suite uses Java 17+, Maven Wrapper, Selenium WebDriver, JUnit 5, Chrome, and PostgreSQL JDBC.

### 2.5 Design and Implementation Constraints

- The frontend is a vanilla JavaScript SPA; no frontend build framework is required by the primary runtime.
- The Express API uses JSON routes under `/api/` and bearer-token authentication for protected requests.
- PostgreSQL schema and key relationships are defined in `backend/database.sql`.
- Block-management routes are restricted to administrators at the API layer.
- The custom signed token format is not JWT. The browser session expires after its configured client-side period, while the API token has a separate validity period.
- Database-dependent functionality requires PostgreSQL. In-memory fallback records are process-local and temporary.

### 2.6 Assumptions and Dependencies

- A valid PostgreSQL connection is available for durable operations.
- Required configuration is supplied through environment variables in deployment; local fallback settings in source are not suitable production secrets.
- The application is accessed through a browser and can reach the Express API.
- Production HTTPS depends on the hosting environment or its TLS-terminating proxy.
- Test execution depends on a running application, database, Java, Maven, and supported browser driver configuration.

## 3. System Architecture and UML Diagrams

The accompanying PDF contains the diagrams in this section. The diagrams describe the primary Express/PostgreSQL application and show the Django API as separate and optional.

### 3.1 Full-Stack System Architecture

The architecture diagram shows browser UI, Express routes and authorization, PostgreSQL persistence, process-local fallback state, and the supporting test environment.

### 3.2 Use Case Diagrams for Hostel Management

Separate use-case views describe Student, Caretaker, and Administrator workflows. Role boundaries reflect API permissions: block create/update/delete is administrator-only; caretakers can view assigned block information and perform permitted operational tasks.

### 3.3 Domain Class Diagrams

The domain diagrams cover the persistent account, hostel, room, assignment, complaint, maintenance, outing, and announcement records. Junction entities represent the corresponding many-to-many or block-scoped links. Transient application state is identified separately from PostgreSQL entities.

### 3.4 Sequence Diagrams for Critical Workflows

Sequence diagrams describe role-based sign-in and a student complaint submission followed by staff review. They show the browser, authentication module, Express API, and PostgreSQL interactions.

### 3.5 State Transition Diagrams

State views describe complaint resolution, outing review, and room application decisions. They use statuses supported by the project workflows and identify where an application maintains a status in process-local state.

### 3.6 Entity-Relationship Diagram

The ERD is split into account/hostel relationships and operational records to keep table names and cardinalities readable. It follows the PostgreSQL table relationships in `backend/database.sql`.

### 3.7 Component and Deployment Architecture

The deployment view shows the browser client, primary Express server, PostgreSQL database, and automated test suite. The Django API is shown separately and is not a required component of the primary runtime.

## 4. System Features and Functional Requirements

Requirements use unique IDs and describe expected system behavior. Role restrictions must be enforced by the server API as well as reflected in the UI.

### 4.1 Module 1: Core Application and Data Access

- **FR-CORE-01:** The system shall serve the browser application and its API through the primary Express application.
- **FR-CORE-02:** The system shall expose a health endpoint that reports application/database status.
- **FR-CORE-03:** The system shall use PostgreSQL for supported durable records and identify when an operation uses process-local fallback state.

### 4.2 Module 2: Identity, Authentication, and User Management

- **FR-AUTH-01:** The system shall allow sign-in using an identifier, password, and selected role.
- **FR-AUTH-02:** The system shall validate credentials against the account table for the selected role and reject invalid credentials.
- **FR-AUTH-03:** The system shall hash passwords for newly registered students using bcrypt before storage.
- **FR-AUTH-04:** The system shall permit student self-registration with required identity, contact, year, gender, email, and password fields, and reject invalid or duplicate values.
- **FR-AUTH-05:** The system shall issue a signed bearer token after successful authentication and return the account role and permitted context.
- **FR-AUTH-06:** The system shall reject unauthenticated requests to protected API routes and reject roles not permitted for a route.
- **FR-AUTH-07:** The system shall clear the browser session on logout and apply the configured client-side session expiry and renewal behavior.

### 4.3 Module 3: Student Services

- **FR-STU-01:** The system shall display student dashboard and account/hostel context available to the signed-in student.
- **FR-STU-02:** The system shall let students view hostel block information and announcements.
- **FR-STU-03:** The system shall let students submit complaints and view complaint status and voting information.
- **FR-STU-04:** The system shall let students submit daily maintenance records and view maintenance history.
- **FR-STU-05:** The system shall let students submit non-local outing requests and view their outcomes.
- **FR-STU-06:** The system shall let students apply for room allocation and evacuation when the applicable workflow permits it, and view request status.
- **FR-STU-07:** The system shall provide available notification and contact information to students.

### 4.4 Module 4: Caretaker Operations

- **FR-CAR-01:** The system shall associate caretakers with assigned hostel blocks and scope applicable caretaker views to those assignments.
- **FR-CAR-02:** The system shall let caretakers view hostel block information without add, edit, or remove controls.
- **FR-CAR-03:** The system shall let caretakers inspect permitted residents, rooms, and maintenance records for assigned blocks.
- **FR-CAR-04:** The system shall let caretakers update complaint status and review permitted outing requests.
- **FR-CAR-05:** The system shall let caretakers record maintenance and publish or remove announcements where authorized.

### 4.5 Module 5: Administration and Hostel Management

- **FR-ADM-01:** The system shall let administrators create, view, update, and remove hostel blocks subject to data integrity rules.
- **FR-ADM-02:** The system shall let administrators manage caretaker accounts and block assignments.
- **FR-ADM-03:** The system shall let administrators configure allocation and evacuation windows and review related requests.
- **FR-ADM-04:** The system shall let administrators manage contacts, review reports, and perform permitted system-wide complaint and announcement operations.

### 4.6 Module 6: Notifications and Shared Behaviors

- **FR-SHARED-01:** The system shall validate required request fields and return success or error feedback to the browser.
- **FR-SHARED-02:** The browser shall periodically request notification updates while an authenticated session is active.
- **FR-SHARED-03:** The system shall preserve key relationships and uniqueness constraints through the PostgreSQL schema.

## 5. External Interface Requirements

### 5.1 User Interfaces

The browser interface shall provide role-specific navigation and pages, forms, tables/cards, status indicators, and validation or operation feedback. The project stylesheet provides responsive layouts for supported viewport sizes.

### 5.2 Hardware Interfaces

No specialized hardware interface is required. Users need a supported browser device and network connectivity to the application.

### 5.3 Software and API Interfaces

| Interface | Description |
|---|---|
| Browser to Express | JSON REST requests under `/api/`; protected requests include a bearer token. |
| Express to PostgreSQL | SQL via the Node `pg` connection pool and configured database URL. |
| Express to local state | Selected flows use process-local fallback or transient state; such state is not durable. |
| Optional Django API | Separate Python/Django project with its own routes and database access; not required by the primary runtime. |
| Test harness | Selenium/JUnit browser automation and PostgreSQL JDBC assertions where configured. |

### 5.4 Communications Interfaces

The browser and API exchange HTTP JSON requests in local development. Production transport security depends on the host/proxy configuration. Database connections use PostgreSQL protocol over the configured network connection.

## 6. Non-Functional Requirements

### 6.1 Performance and Scalability

- **NFR-PER-01:** Common page and API interactions should provide timely feedback under normal project deployment load. No measured service-level latency target is claimed by this specification.
- **NFR-PER-02:** Notification checks shall use the polling interval configured in the frontend.

### 6.2 Security and Data Integrity

- **NFR-SEC-01:** Newly registered passwords shall be stored as bcrypt hashes, not plaintext.
- **NFR-SEC-02:** Protected API routes shall validate bearer tokens and enforce server-side role restrictions.
- **NFR-SEC-03:** Database operations shall use parameterized queries where supported by the implementation.
- **NFR-SEC-04:** Deployment shall override development fallback secrets and database settings with managed environment configuration.
- **NFR-SEC-05:** The custom HMAC token format and its expiry shall be documented as distinct from browser-side session expiry.

### 6.3 Reliability, Availability, and Fault Tolerance

- **NFR-REL-01:** The system shall report database connectivity through its health endpoint.
- **NFR-REL-02:** Some features may use process-local fallback state during database errors; these records can be lost when the process restarts.
- **NFR-REL-03:** Durable application data depends on PostgreSQL availability and successful database configuration.

### 6.4 Maintainability, Portability, and Usability

- **NFR-MNT-01:** Frontend role pages, shared rendering helpers, API routes, and database setup shall remain organized in their project modules.
- **NFR-USE-01:** Forms shall show readable validation and operation feedback.
- **NFR-COMP-01:** The browser application shall use standard HTML, CSS, and JavaScript features supported by current mainstream browsers.

## 7. Verification and Requirements Traceability Matrix

Verification may combine source review, API checks, browser workflows, and database assertions. The repository contains a Java/Selenium/JUnit suite and an execution report; this SRS does not claim a fresh test run.

| Requirement group | Verification focus | Primary evidence |
|---|---|---|
| FR-CORE | Health endpoint, static app delivery, database behavior | `backend/server.js`, `backend/db.js` |
| FR-AUTH | Registration, login, logout, expiry, invalid credentials, role rejection | `backend/server.js`, `frontend/auth.js`, `testing/` |
| FR-STU | Hostel viewing, complaints, votes, maintenance, outings, room requests | `frontend/student-pages.js`, `frontend/script.js`, `backend/server.js` |
| FR-CAR | Assigned-block scope, view-only block access, complaints/outings/maintenance/notices | `frontend/caretaker-pages.js`, `backend/server.js` |
| FR-ADM | Block/user management, windows, request review, reports, contacts | `frontend/admin-pages.js`, `backend/server.js` |
| FR-SHARED | Validation, notifications, persistence and relationships | `frontend/script.js`, `backend/database.sql`, `testing/` |

### 7.1 Verification Methods

- Source inspection verifies route authorization, validation, and data access behavior.
- API checks verify status codes, response bodies, and allowed/denied role cases.
- Browser tests verify navigation, form submission, role-specific pages, and user feedback.
- Database assertions verify persistence and relationship behavior when a configured PostgreSQL instance is available.

### 7.2 Traceability Notes

- The primary API route definitions are in `backend/server.js`; the schema source is `backend/database.sql`.
- Current documentation files include older descriptions and reported test counts. Test results and documentation claims should be reconciled against the current source before being presented as verified outcomes.
- The optional Django project is documented separately and is not used as evidence of primary Express feature behavior.
