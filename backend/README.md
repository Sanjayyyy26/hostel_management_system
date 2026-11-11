# ⚙️ Backend REST API & Database Service

The server-side backend for the **Hostel Management System**, powered by **Node.js**, **Express**, and **PostgreSQL**.

---

## 📁 Directory Structure

```
backend/
├── server.js         # Core Express application: routing, middleware, business logic & REST endpoints
├── db.js             # PostgreSQL connection pool configuration using 'pg'
├── database.sql      # Database schema (DDL), relational tables, constraints & seed records
├── scripts/
│   └── setup-db.js   # Automated database initializer and table migrator
├── .env.example      # Environment variables template
└── package.json      # Backend-specific package descriptor
```

---

## 🗄️ Database Architecture

The PostgreSQL database (`hostellers`) manages relational data across 11 core tables:

| Table | Purpose |
| :--- | :--- |
| `student` | Student profiles (Roll number, registration, name, year, email, password hash) |
| `caretaker` | Caretaker profiles (Employee ID, name, email, phone) |
| `admin` | Administrator authentication keys |
| `hostel` | Hostel block records (Block ID, name, gender restriction, floor counts) |
| `room` | Room records (Room ID, block ID, room number, floor number) |
| `student_hostel` | Many-to-one mapping linking allocated students to specific rooms |
| `caretaker_hostel` | Block-level mapping assigning caretakers to designated hostels |
| `complaints` | Student complaint tickets, issue categories, status, and upvotes |
| `outing` | Non-local outing permission requests with caretaker approval status |
| `maintenance` | Daily cleaning and mopping tracking logs with once-per-day rate limit |
| `announcements` | General and block-specific notices broadcast by caretakers/admins |

---

## 🔒 Security & Middleware

1. **Authentication**:
   - `signToken()` & `verifyToken()`: HMAC SHA-256 signed session tokens.
   - `requireAuth(roles)`: Role-Based Access Control middleware enforcing HTTP 401 (Unauthorized) and HTTP 403 (Forbidden).
2. **Password Hashing**:
   - Integrated with bcrypt for secure password hashing.
3. **CORS & Payload Limits**:
   - Configured with `cors()` and 15MB JSON payload limit for receipt attachments.

---

## 📡 Key REST Endpoints

### Authentication
- `POST /api/login`: Authenticates student, caretaker, or admin; returns session token.
- `POST /api/register`: Registers a new student into PostgreSQL.
- `GET /api/me`: Returns current user's profile and allocated room context.

### Student Operations
- `GET /api/complaints` / `POST /api/complaints`: List and submit complaints.
- `POST /api/complaints/:id/vote`: Upvote a complaint.
- `GET /api/maintenance` / `POST /api/maintenance`: Track daily room cleaning.
- `GET /api/outings` / `POST /api/outings`: Submit non-local outing requests.
- `POST /api/rooms/apply-allocation`: Submit room allocation application.

### Caretaker Operations
- `PATCH /api/outings/:id`: Approve or decline outing requests.
- `PATCH /api/complaints/:id/status`: Toggle complaint status ('Pending' / 'Done').
- `POST /api/announcements`: Post block-targeted notices.

### Admin Operations
- `GET /api/admin/allocations` / `POST /api/admin/allocations/status`: Verify room allocations.
- `GET /api/admin/evacuations` / `POST /api/admin/evacuations/status`: Process room vacating.
- `PUT /api/admin/caretakers/:id`: Update caretaker's assigned hostel block.
- `DELETE /api/admin/caretakers/:id`: Remove caretaker and clean assigned block relationships.

---

## 🚀 Running the Backend

From the project root:
```bash
npm start
```
Or directly from the `backend/` directory:
```bash
cd backend
npm start
```
The server will start on `http://localhost:3000`.

