# Hostellers
## Hostel Management System
### UML Architectural & Design Specifications

**Project Team Members:**
- **M.Sanjay pal** — `424150`
- **Raj Gireesh** — `424169`
- **P.Jyothiswar** — `424165`

---

## Overview

This document presents the visual Unified Modeling Language (UML) specifications for the **Hostellers** Hostel Management System. The diagrams model the actual verified architecture, domain data structures, security flows, operational lifecycles, and component deployment topologies implemented in the repository codebase (`frontend/`, `backend/server.js`, and `backend/database.sql`).

---

## 1. Use Case View

### Description & Scope
The Use Case View depicts the functional boundaries of the Hostel Management System, illustrating how the three primary actors (**Student**, **Caretaker**, and **Administrator**) interact with system capabilities. 

*Key Access Control Boundary*: Caretakers can view assigned hostel blocks and residents, but are strictly prohibited from adding, modifying, or removing hostel blocks. Hostel block administration is reserved exclusively for Administrators. Both Caretakers and Administrators possess rights to post/delete announcements and manage/delete complaints.

```mermaid
flowchart LR
  subgraph Actors[System Actors]
    Student([Student])
    Caretaker([Caretaker])
    Admin([Administrator])
  end

  subgraph HMS[Hostel Management System Boundary]
    Auth([Sign In / Session Logout])
    ViewBlocks([View Hostel Blocks])
    ViewNotices([View Announcements])
    PostNotice([Post / Delete Announcements])
    SubmitComplaint([Submit Complaint])
    VoteComplaint([Upvote Complaint])
    ResolveComplaint([Update / Delete Complaint])
    LogClean([Log Daily Cleaning / Maintenance])
    ReviewClean([View / Record Block Maintenance])
    RequestOuting([Submit Non-Local Outing])
    ReviewOuting([Approve / Reject Outing Request])
    ApplyAlloc([Apply for Room Allocation])
    VerifyAlloc([Approve Room Allocation])
    RequestEvac([Request Room Evacuation])
    VerifyEvac([Process Room Evacuation])
    InspectRooms([Inspect Rooms & Residents])
    ManageBlocks([Create / Edit / Remove Hostel Blocks])
    ManageStaff([Manage Caretakers & Block Links])
    ManageWindows([Configure Allocation Windows])
    GenReports([View Analytics & Reports])
  end

  %% Student Connections
  Student --> Auth
  Student --> ViewBlocks
  Student --> ViewNotices
  Student --> SubmitComplaint
  Student --> VoteComplaint
  Student --> LogClean
  Student --> RequestOuting
  Student --> ApplyAlloc
  Student --> RequestEvac

  %% Caretaker Connections
  Caretaker --> Auth
  Caretaker --> ViewBlocks
  Caretaker --> ViewNotices
  Caretaker --> PostNotice
  Caretaker --> ResolveComplaint
  Caretaker --> ReviewClean
  Caretaker --> ReviewOuting
  Caretaker --> InspectRooms

  %% Administrator Connections
  Admin --> Auth
  Admin --> ViewBlocks
  Admin --> ManageBlocks
  Admin --> ManageStaff
  Admin --> PostNotice
  Admin --> ResolveComplaint
  Admin --> ReviewOuting
  Admin --> VerifyAlloc
  Admin --> VerifyEvac
  Admin --> ManageWindows
  Admin --> GenReports
```

---

## 2. Domain Class Diagram

### Description & Scope
The Domain Class Diagram models the persistent relational data structure defined in `backend/database.sql`. It illustrates the 18 core entities, primary/foreign key attributes, and multiplicity relationships maintained by the PostgreSQL engine. Transient in-memory structures (such as active allocation windows and notifications) reside in `memoryStore` in the Express runtime.

```mermaid
classDiagram
  class Admin {
    +VARCHAR(255) key PK
    +VARCHAR(255) password
  }

  class Caretaker {
    +VARCHAR(255) employee_id PK
    +VARCHAR(255) name
    +BIGINT phone_number
    +VARCHAR(255) email UK
    +VARCHAR(255) password
  }

  class Student {
    +INTEGER roll_number PK
    +INTEGER registered_number UK
    +VARCHAR(255) name
    +INTEGER year
    +BIGINT phone_number
    +VARCHAR(255) email UK
    +VARCHAR(255) password
    +VARCHAR(50) gender
  }

  class HostelBlock {
    +VARCHAR(255) block_id PK
    +VARCHAR(255) name
    +INTEGER floors
    +INTEGER seater
    +INTEGER capacity
    +VARCHAR(50) for_gender
  }

  class HostelYear {
    +VARCHAR(255) block_id PK, FK
    +INTEGER student_year PK
  }

  class HostelFloorRooms {
    +VARCHAR(255) block_id PK, FK
    +INTEGER floor_number PK
    +INTEGER number_of_rooms
  }

  class Room {
    +VARCHAR(255) room_id PK
    +VARCHAR(255) block_id FK
    +INTEGER room_number
    +INTEGER floor_number
  }

  class CaretakerHostel {
    +VARCHAR(255) employee_id PK, FK
    +VARCHAR(255) block_id PK, FK
  }

  class StudentHostel {
    +INTEGER roll_number PK, FK
    +VARCHAR(255) room_id PK, FK
  }

  class Complaint {
    +VARCHAR(255) complaint_id PK
    +INTEGER roll_number FK
    +VARCHAR(255) room_id FK
    +DATE date
    +TIME time
    +TEXT complaint
    +BOOLEAN status
    +INTEGER votes
  }

  class HostelComplaint {
    +VARCHAR(255) block_id PK, FK
    +VARCHAR(255) complaint_id PK, FK
  }

  class ComplaintVote {
    +VARCHAR(255) complaint_id PK, FK
    +VARCHAR(255) user_id PK
  }

  class Maintenance {
    +VARCHAR(255) maintenance_id PK
    +INTEGER roll_number FK
    +VARCHAR(255) room_id FK
    +DATE date
    +TIME time
    +BOOLEAN mopping_status
    +BOOLEAN cleaning_status
    +TEXT remarks
  }

  class HostelMaintenance {
    +VARCHAR(255) block_id PK, FK
    +VARCHAR(255) maintenance_id PK, FK
  }

  class Outing {
    +VARCHAR(255) outing_id PK
    +INTEGER roll_number FK
    +DATE from_date
    +DATE to_date
    +TEXT purpose
    +BIGINT parent_ph_no
    +DATE date
    +TIME time
    +BOOLEAN status
  }

  class HostelOuting {
    +VARCHAR(255) block_id PK, FK
    +VARCHAR(255) outing_id PK, FK
  }

  class Announcements {
    +VARCHAR(255) announcement_id PK
    +DATE date
    +TIME time
    +TEXT announcement
  }

  class HostelAnnouncements {
    +VARCHAR(255) block_id PK, FK
    +VARCHAR(255) announcement_id PK, FK
  }

  %% Multiplicity Relationships
  HostelBlock "1" --> "0..*" Room : contains
  HostelBlock "1" --> "0..*" HostelYear : restricts by year
  HostelBlock "1" --> "0..*" HostelFloorRooms : specifies floors
  HostelBlock "1" --> "0..*" CaretakerHostel : assigned to
  Caretaker "1" --> "0..*" CaretakerHostel : oversees

  Room "1" --> "0..*" StudentHostel : houses
  Student "1" --> "0..*" StudentHostel : resides in

  Student "1" --> "0..*" Complaint : submits
  Room "1" --> "0..*" Complaint : location of
  Complaint "1" --> "0..*" ComplaintVote : receives
  HostelBlock "1" --> "0..*" HostelComplaint : groups
  Complaint "1" --> "0..*" HostelComplaint : linked to

  Student "1" --> "0..*" Maintenance : logs
  Room "1" --> "0..*" Maintenance : subject of
  HostelBlock "1" --> "0..*" HostelMaintenance : groups
  Maintenance "1" --> "0..*" HostelMaintenance : linked to

  Student "1" --> "0..*" Outing : requests
  HostelBlock "1" --> "0..*" HostelOuting : groups
  Outing "1" --> "0..*" HostelOuting : linked to

  Announcements "1" --> "0..*" HostelAnnouncements : published across
  HostelBlock "1" --> "0..*" HostelAnnouncements : receives
```

---

## 3. Sign-In Sequence Diagram

### Description & Scope
The Sequence Diagram depicts the end-to-end credential authentication, token generation, and role dispatch workflow. It accurately models:
1. Client-side input validation and submission.
2. The Express backend executing targeted database lookup based strictly on the selected role (`student`, `caretaker`, or `admin`).
3. Password verification using `bcrypt.compare` (or constant-time match for seed fallbacks).
4. Generation of a custom HMAC-SHA256 signed bearer token (`${base64urlPayload}.${signature}`).
5. Client-side session creation with a 30-minute inactivity timer in `localStorage`.

```mermaid
sequenceDiagram
  autonumber
  actor User as User (Student/Staff/Admin)
  participant UI as Browser Client (SPA)
  participant Auth as Client Auth Module (auth.js)
  participant API as Express API Server (server.js)
  participant DB as PostgreSQL Database

  User->>UI: Select Role & Enter ID + Password
  UI->>Auth: validateCredentials(id, password, role)
  Auth->>API: POST /api/login { id, password, role }
  
  Note over API,DB: Backend isolates lookup strictly by requested role
  alt Requested Role: Student
    API->>DB: SELECT * FROM student WHERE roll_number = $1 OR email = $1
  else Requested Role: Caretaker
    API->>DB: SELECT * FROM caretaker WHERE employee_id = $1 OR email = $1
  else Requested Role: Admin
    API->>DB: SELECT * FROM admin WHERE key = $1
  end

  DB-->>API: User Record with Password Hash
  
  API->>API: bcrypt.compare(password, storedPassword)
  alt Password Invalid
    API-->>Auth: 401 Unauthorized { success: false, message: "Invalid password." }
    Auth-->>UI: Display error in #loginError
    UI-->>User: Show "Invalid password."
  else Password Valid
    API->>API: signToken({ userId, role, name, exp: Date.now() + 30d })
    Note over API: Custom HMAC-SHA256: payload.signature (Not standard JWT)
    API-->>Auth: 200 OK { success: true, token, user }
    
    Auth->>Auth: Store in localStorage (Key: hm_session, 30-min timer)
    Auth-->>UI: Authentication Success
    UI-->>User: Render Role Dashboard & Greeting Toast
  end
```

---

## 4. Complaint Submission & Lifecycle Activity Diagram

### Description & Scope
This Activity Diagram maps the lifecycle of a student maintenance complaint from submission, input validation, and database insertion through to caretaker/admin review, status toggling, and final deletion.

```mermaid
flowchart TD
  Start([Student Opens Complaints Page]) --> ViewExisting[View Existing Complaints in Block]
  ViewExisting --> ClickComposer[Click Register New Complaint]
  ClickComposer --> EnterForm[Enter Title, Description & Location]
  EnterForm --> Validate{Inputs Valid?<br>Title & Body Present?}

  Validate -- No --> ShowToast[Show Validation Error Message]
  ShowToast --> EnterForm

  Validate -- Yes --> SubmitAPI[POST /api/complaints with Bearer Token]
  SubmitAPI --> DBInsert[(INSERT INTO complaints & hostel_complaints)]
  
  DBInsert --> ShowSuccess[Display Complaint Card in UI]
  ShowSuccess --> PeerVote{Student Peer Reviews?}

  PeerVote -- Yes --> UpvoteAction[POST /api/complaints/:id/vote]
  UpvoteAction --> ToggleVote[(Toggle Vote in complaint_votes)]
  ToggleVote --> UpdateCount[Update Real-time Vote Count]
  UpdateCount --> StaffReview[Caretaker or Admin Inspects Complaint]
  PeerVote -- No --> StaffReview

  StaffReview --> CaretakerDecision{Staff Action}

  CaretakerDecision -- Toggle Status --> StatusAPI[PATCH /api/complaints/:id/status]
  StatusAPI --> UpdateDB[(UPDATE complaints SET status = true/false)]
  UpdateDB --> NotifyStudent[Emit Status Change Notification]
  NotifyStudent --> EndResolved([Complaint Marked Resolved])

  CaretakerDecision -- Delete Complaint --> DeleteAPI[DELETE /api/complaints/:id]
  DeleteAPI --> DeleteDB[(DELETE FROM complaints & hostel_complaints)]
  DeleteDB --> RemovedUI([Complaint Card Removed from UI])
```

---

## 5. Deployment / Component Diagram

### Description & Scope
The Deployment Diagram illustrates the physical and logical runtime nodes, communication protocols, network boundaries, and testing infrastructure. It explicitly represents the optional, auxiliary nature of the Python/Django API.

```mermaid
flowchart TB
  subgraph ClientNode["User Client Device (Desktop / Mobile)"]
    Browser["Web Browser (Chrome / Firefox / Safari)<br>HTML5 / CSS3 / Vanilla JavaScript SPA<br>Local State: localStorage (hm_session)"]
  end

  subgraph AppServerNode["Application Server Node (Local / Render Cloud)"]
    subgraph ExpressRuntime["Primary Runtime Environment (Node.js 18+)"]
      ExpressServer["Express.js Web Server (Port 3000 / 443)<br>REST API (/api/*) + Static File Server<br>RBAC Middleware (requireAuth)<br>HMAC-SHA256 Token Engine"]
      MemoryStore["Transient MemoryStore Cache<br>Allocation Windows, Evacuations, Contacts"]
      ExpressServer <--> MemoryStore
    end

    subgraph DjangoRuntime["Auxiliary Runtime (Optional / Standalone)"]
      DjangoApp["Python 3.14 + Django REST API (Port 8000)<br>Secondary implementation in django_api/<br>Standalone models & endpoints"]
      SqliteDB[("db.sqlite3 (Default)")]
      DjangoApp <--> SqliteDB
    end
  end

  subgraph DatabaseNode["Database Server (Localhost / Neon Cloud PostgreSQL)"]
    PostgreSQL[("PostgreSQL 14+ Relational Database<br>Port 5432 (SSL Mode Required in Cloud)<br>18 Relational Tables (database.sql)")]
  end

  subgraph TestHarnessNode["Quality Assurance & Automated Testing Node"]
    SeleniumEngine["Selenium WebDriver 4.25+<br>Headless Chrome Automation Driver"]
    JUnitRunner["JUnit 5 (Jupiter) Engine<br>38 Test Cases (HostelManagementTest.java)"]
    JDBCVerifier["PostgreSQL JDBC Client 42.7.4<br>Direct DB Assertion Engine"]
    
    JUnitRunner --> SeleniumEngine
    JUnitRunner --> JDBCVerifier
  end

  %% Communication Channels
  Browser -- "HTTP/1.1 REST (JSON) + Bearer Token<br>[Port 3000 / Port 443 on Render]" --> ExpressServer
  ExpressServer -- "pg Connection Pool (SQL over TCP 5432)" --> PostgreSQL
  DjangoApp -. "Optional DATABASE_URL Connection" .-> PostgreSQL

  SeleniumEngine -- "Drives Chrome UI Actions" --> Browser
  JDBCVerifier -- "Direct SQL Persistence Verification" --> PostgreSQL
```

---

## 6. Consistency and Traceability Verification

1. **Protocol Uniformity**: All client-server interactions between the browser SPA and backend REST API use HTTP/1.1 in local development and TLS/HTTPS when hosted behind a reverse proxy (e.g., Render edge).
2. **Entity Consistency**: All database entities (`admin`, `student`, `caretaker`, `hostel`, `room`, `complaints`, `maintenance`, `outing`, `announcements`) match table definitions in `backend/database.sql`.
3. **Role & Permission Alignment**:
   - `student`: restricted to submitting complaints, upvoting, logging cleaning, submitting outings, applying for allocation/evacuation during open windows.
   - `caretaker`: restricted to assigned blocks; can post/delete announcements and update/delete complaints; strictly forbidden from block administration.
   - `admin`: global administrative authority across blocks, caretakers, allocations, windows, and institutional records.
4. **Token Security Model**: The system relies on a two-part HMAC-SHA256 signature scheme (`base64url(payload).signature`) rather than standard 3-part JWT.
