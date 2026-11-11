# 🎨 Frontend Client Application

A responsive Single Page Application (SPA) for the **Hostel Management System**, built with clean vanilla modern HTML5, CSS3, and JavaScript (ES6+).

---

## 📁 Directory Structure

```
frontend/
├── index.html        # Main SPA HTML structure (Navigation, Modals, Dynamic View Containers)
├── style.css         # Complete responsive design system (Grid, Flexbox, Cards, Theme)
├── auth.js           # Client-side session management, Bearer token handling & RBAC route guards
├── pages.js          # Dynamic template renderers for Student, Caretaker, and Admin views
└── script.js         # Core event listeners, DOM interaction handlers, modal logic & notifications
```

---

## 🛠️ Architecture & Modules

### 1. `index.html` (Application Skeleton)
- Implements accessible semantic HTML5 with custom ARIA roles and labels.
- Dual layout system:
  - **Auth View (`#authView`)**: Tabbed login (Student, Caretaker, Admin) and Student Registration modal.
  - **Dashboard View (`#dashboardView`)**: Sidebar navigation, top header (profile dropdown, notifications icon, dark-mode toggle), and dynamic page content mount (`#pageContent`).

### 2. `auth.js` (Authentication & Security)
- **Token Management**: Persists JWT/Bearer tokens securely in `localStorage` and `sessionStorage`.
- **API Wrapper (`Auth.api`)**: Unified fetch client automatically attaching `Authorization: Bearer <token>` to all protected REST requests.
- **Client-Side RBAC (`Auth.checkAccess`)**: Enforces page access rules across roles before rendering any template.

### 3. `pages.js` (Template Engine)
- Contains modular template functions grouped by role:
  - `PageTemplates.student`: Dashboard, Complaints, Room Maintenance, Outings, Room Allocation, Room Vacating.
  - `PageTemplates.caretaker`: Dashboard, Student Lists, Inspections, Complaint Management, Outing Approvals.
  - `PageTemplates.admin`: Dashboard, User Management, Room Allocations, Evacuations, Announcements.

### 4. `script.js` (Controller & UI Interactivity)
- Global routing via `loadPage(role, pageName)`.
- Interactive modal dialogs (Outing review modal, Caretaker block assignment modal, Complaints composer).
- Toast notifications (`showToast(message, type)`).
- Real-time upvoting and filter listeners.

---

## 🚀 Running the Frontend

The frontend is served directly by the backend Express server at:
```
http://localhost:3000
```
No separate build or bundler (e.g. Webpack/Vite) is required—it runs natively on all modern web browsers.

