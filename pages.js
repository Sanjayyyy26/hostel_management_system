/**
 * Page Templates for Role-Based Dashboards
 * Defines content for each role's accessible pages
 */

const PageTemplates = {
  // ==================== COMMON PAGES ====================
  common: {
    Announcements: `
      <section class="welcome-banner announcements-banner">
        <div>
          <p>ANNOUNCEMENTS</p>
          <h2>Stay Updated</h2>
          <span>Important notices and updates for hostel residents</span>
        </div>
      </section>
      <section class="panel" style="margin-top: 24px;">
        <div class="panel-title">
          <div>
            <p>RECENT</p>
            <h2>Latest Announcements</h2>
          </div>
        </div>
        <div class="announcement">
          <span class="announcement-dot"></span>
          <div>
            <h3>Water Supply Maintenance</h3>
            <p>Water supply will be interrupted from 10 AM to 1 PM tomorrow due to pipe repairs.</p>
            <small>Today · 9:30 AM</small>
          </div>
        </div>
        <div class="announcement">
          <span class="announcement-dot purple"></span>
          <div>
            <h3>Hostel Cultural Night</h3>
            <p>Register your team for the inter-block cultural events by Friday.</p>
            <small>Yesterday · 4:45 PM</small>
          </div>
        </div>
        <div class="announcement">
          <span class="announcement-dot green"></span>
          <div>
            <h3>New Wi-Fi Password</h3>
            <p>Wi-Fi password has been updated. Check with your floor warden for new credentials.</p>
            <small>2 days ago</small>
          </div>
        </div>
      </section>
    `,
    Complaints: `
      <section class="welcome-banner complaints-banner">
        <div>
          <p>COMPLAINTS</p>
          <h2>Report Issues</h2>
          <span>Submit and track your complaints easily</span>
        </div>
      </section>
      <section class="panel" style="margin-top: 24px;">
        <div class="panel-title">
          <div>
            <p>NEW COMPLAINT</p>
            <h2>Submit a Complaint</h2>
          </div>
        </div>
        <form id="complaintForm">
          <label>Category</label>
          <div class="input-wrap">
            <select id="complaintCategory">
              <option value="">Select category</option>
              <option value="noise">Noise Disturbance</option>
              <option value="cleanliness">Cleanliness</option>
              <option value="food">Food Quality</option>
              <option value="other">Other</option>
            </select>
          </div>
          <label>Description</label>
          <div class="input-wrap textarea-wrap">
            <textarea id="complaintDesc" rows="3" placeholder="Describe your complaint..."></textarea>
          </div>
          <button class="primary-button" type="submit">Submit Complaint</button>
        </form>
      </section>
      <section class="panel" style="margin-top: 18px;">
        <div class="panel-title">
          <div>
            <p>YOUR COMPLAINTS</p>
            <h2>Complaint History</h2>
          </div>
        </div>
        <div class="announcement">
          <span class="announcement-dot"></span>
          <div>
            <h3>Leaky Faucet - Room 115</h3>
            <p>Status: <strong style="color: #48a980;">Resolved</strong></p>
            <small>3 days ago</small>
          </div>
        </div>
      </section>
    `,
    Maintenance: `
      <section class="welcome-banner maintenance-banner">
        <div>
          <p>MAINTENANCE</p>
          <h2>Request Maintenance</h2>
          <span>Report and track maintenance requests</span>
        </div>
      </section>
      <section class="panel" style="margin-top: 24px;">
        <div class="panel-title">
          <div>
            <p>NEW REQUEST</p>
            <h2>Submit Maintenance Request</h2>
          </div>
        </div>
        <form id="maintenanceForm">
          <label>Issue Type</label>
          <div class="input-wrap">
            <select id="maintenanceType">
              <option value="">Select type</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="furniture">Furniture</option>
              <option value="other">Other</option>
            </select>
          </div>
          <label>Priority</label>
          <div class="input-wrap">
            <select id="maintenancePriority">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <label>Description</label>
          <div class="input-wrap textarea-wrap">
            <textarea id="maintenanceDesc" rows="3" placeholder="Describe the issue..."></textarea>
          </div>
          <button class="primary-button" type="submit">Submit Request</button>
        </form>
      </section>
    `
  },

  // ==================== STUDENT PAGES ====================
  student: {
    Dashboard: `
      <section class="welcome-banner">
        <div>
          <p>STUDENT PORTAL</p>
          <h2>Everything for your stay,<br/>all in one place.</h2>
          <span>Manage requests, keep up with announcements, and enjoy a smoother hostel experience.</span>
        </div>
        <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=80" alt="University building" />
      </section>
      <section class="stats-grid">
        <article class="stat-card blue">
          <span class="card-icon">▥</span>
          <p>YOUR ROOM</p>
          <h3 id="studentRoom">Block A · 115</h3>
          <small>First floor · 3 sharing</small>
        </article>
        <article class="stat-card">
          <span class="card-icon amber">◫</span>
          <p>NEW ANNOUNCEMENTS</p>
          <h3>03</h3>
          <small>Check latest updates</small>
        </article>
        <article class="stat-card">
          <span class="card-icon green">✓</span>
          <p>OPEN REQUESTS</p>
          <h3>01</h3>
          <small>Maintenance in progress</small>
        </article>
      </section>
      <section class="dashboard-grid">
        <article class="panel announcements">
          <div class="panel-title">
            <div><p>STAY INFORMED</p><h2>Recent announcements</h2></div>
            <button type="button" data-page="Announcements">View all</button>
          </div>
          <div class="announcement">
            <span class="announcement-dot"></span>
            <div><h3>Water supply maintenance</h3><p>Water supply will be interrupted from 10 AM to 1 PM tomorrow.</p><small>Today · 9:30 AM</small></div>
          </div>
          <div class="announcement">
            <span class="announcement-dot purple"></span>
            <div><h3>Hostel cultural night</h3><p>Register your team for the inter-block cultural events.</p><small>Yesterday · 4:45 PM</small></div>
          </div>
        </article>
        <article class="panel quick-actions">
          <div class="panel-title"><div><p>SHORTCUTS</p><h2>Quick actions</h2></div></div>
          <button class="action" data-page="Complaints">
            <span>＋</span><div><strong>Raise a complaint</strong><small>Let us know how we can help</small></div><b>→</b>
          </button>
          <button class="action" data-page="Maintenance">
            <span>⌁</span><div><strong>Request maintenance</strong><small>Report an issue in your room</small></div><b>→</b>
          </button>
          <button class="action" data-page="Non Local Outing">
            <span>⇱</span><div><strong>Apply for outing</strong><small>Non-local outing request</small></div><b>→</b>
          </button>
        </article>
      </section>
    `,
    'Non Local Outing': `
      <section class="welcome-banner">
        <div>
          <p>OUTING REQUEST</p>
          <h2>Non Local Outing</h2>
          <span>Apply for permission to leave campus</span>
        </div>
      </section>
      <section class="panel" style="margin-top: 24px;">
        <div class="panel-title">
          <div><p>NEW REQUEST</p><h2>Submit Outing Application</h2></div>
        </div>
        <form id="outingForm">
          <label>Destination</label>
          <div class="input-wrap"><input id="outingDest" type="text" placeholder="Enter destination" /></div>
          <label>From Date</label>
          <div class="input-wrap"><input id="outingFrom" type="date" /></div>
          <label>To Date</label>
          <div class="input-wrap"><input id="outingTo" type="date" /></div>
          <label>Reason</label>
          <div class="input-wrap textarea-wrap"><textarea id="outingReason" rows="3" placeholder="Reason for outing..."></textarea></div>
          <label>Parent/Guardian Phone</label>
          <div class="input-wrap"><input id="outingPhone" type="tel" placeholder="Parent's contact number" /></div>
          <button class="primary-button" type="submit">Submit Request</button>
        </form>
      </section>
    `,
    'Hostel Blocks': `
      <section class="welcome-banner">
        <div>
          <p>HOSTEL INFORMATION</p>
          <h2>Hostel Blocks</h2>
          <span>Information about all hostel blocks</span>
        </div>
      </section>
      <section class="stats-grid" style="margin-top: 24px;">
        <article class="stat-card blue">
          <span class="card-icon">A</span>
          <p>BLOCK A</p>
          <h3>120 Rooms</h3>
          <small>Boys · 2 Floors</small>
        </article>
        <article class="stat-card">
          <span class="card-icon amber">B</span>
          <p>BLOCK B</p>
          <h3>96 Rooms</h3>
          <small>Boys · 2 Floors</small>
        </article>
        <article class="stat-card">
          <span class="card-icon green">C</span>
          <p>BLOCK C</p>
          <h3>84 Rooms</h3>
          <small>Girls · 2 Floors</small>
        </article>
      </section>
    `,
    'Hostel Room Allocation': `
      <section class="welcome-banner">
        <div>
          <p>ROOM DETAILS</p>
          <h2>Room Allocation</h2>
          <span>Your current room information</span>
        </div>
      </section>
      <section class="panel" style="margin-top: 24px;">
        <div class="panel-title"><div><p>YOUR ALLOCATION</p><h2>Current Room Details</h2></div></div>
        <div class="announcement">
          <span class="announcement-dot"></span>
          <div><h3>Block A - Room 115</h3><p>Floor: 1st | Sharing: 3 | Status: Allocated</p><small>Academic Year 2025-26</small></div>
        </div>
      </section>
    `,
    'Contact Us': `
      <section class="welcome-banner">
        <div>
          <p>GET IN TOUCH</p>
          <h2>Contact Us</h2>
          <span>Reach out to hostel administration</span>
        </div>
      </section>
      <section class="panel" style="margin-top: 24px;">
        <div class="panel-title"><div><p>CONTACT INFO</p><h2>Hostel Office</h2></div></div>
        <div class="announcement">
          <span class="announcement-dot"></span>
          <div><h3>Warden Office</h3><p>Phone: +91-XXX-XXXXXXX<br>Email: warden@hostel.edu<br>Hours: 9 AM - 5 PM</p></div>
        </div>
        <div class="announcement">
          <span class="announcement-dot purple"></span>
          <div><h3>Maintenance Desk</h3><p>Phone: +91-XXX-XXXXXXX<br>Available: 8 AM - 8 PM</p></div>
        </div>
      </section>
    `
  },

  // ==================== CARETAKER PAGES ====================
  caretaker: {
    Dashboard: `
      <section class="welcome-banner">
        <div>
          <p>CARETAKER PORTAL</p>
          <h2>Manage Your Block</h2>
          <span>Overview of your responsibilities and pending tasks</span>
        </div>
      </section>
      <section class="stats-grid">
        <article class="stat-card blue">
          <span class="card-icon">👥</span>
          <p>ASSIGNED STUDENTS</p>
          <h3>45</h3>
          <small>Block A residents</small>
        </article>
        <article class="stat-card">
          <span class="card-icon amber">📋</span>
          <p>PENDING INSPECTIONS</p>
          <h3>08</h3>
          <small>Due this week</small>
        </article>
        <article class="stat-card">
          <span class="card-icon green">✓</span>
          <p>RESOLVED ISSUES</p>
          <h3>12</h3>
          <small>This month</small>
        </article>
      </section>
      <section class="dashboard-grid">
        <article class="panel">
          <div class="panel-title"><div><p>PENDING TASKS</p><h2>Today's Schedule</h2></div></div>
          <div class="announcement">
            <span class="announcement-dot"></span>
            <div><h3>Morning Inspection</h3><p>Check rooms 101-120</p><small>9:00 AM - 10:30 AM</small></div>
          </div>
          <div class="announcement">
            <span class="announcement-dot purple"></span>
            <div><h3>New Complaint Review</h3><p>2 new complaints to address</p><small>11:00 AM</small></div>
          </div>
        </article>
        <article class="panel quick-actions">
          <div class="panel-title"><div><p>ACTIONS</p><h2>Quick Actions</h2></div></div>
          <button class="action" data-page="Room Inspection">
            <span>✓</span><div><strong>Start Inspection</strong><small>Begin room inspection</small></div><b>→</b>
          </button>
          <button class="action" data-page="Complaints">
            <span>▤</span><div><strong>View Complaints</strong><small>Review pending complaints</small></div><b>→</b>
          </button>
        </article>
      </section>
    `,
    'Room Inspection': `
      <section class="welcome-banner">
        <div>
          <p>INSPECTION</p>
          <h2>Room Inspection</h2>
          <span>Conduct and record room inspections</span>
        </div>
      </section>
      <section class="panel" style="margin-top: 24px;">
        <div class="panel-title"><div><p>NEW INSPECTION</p><h2>Record Inspection</h2></div></div>
        <form id="inspectionForm">
          <label>Room Number</label>
          <div class="input-wrap"><input id="inspRoom" type="text" placeholder="e.g., 101" /></div>
          <label>Block</label>
          <div class="input-wrap">
            <select id="inspBlock">
              <option value="A">Block A</option>
              <option value="B">Block B</option>
              <option value="C">Block C</option>
            </select>
          </div>
          <label>Condition</label>
          <div class="input-wrap">
            <select id="inspCondition">
              <option value="good">Good</option>
              <option value="average">Average</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <label>Remarks</label>
          <div class="input-wrap textarea-wrap"><textarea id="inspRemarks" rows="3" placeholder="Any observations..."></textarea></div>
          <button class="primary-button" type="submit">Submit Inspection</button>
        </form>
      </section>
    `,
    'Student List': `
      <section class="welcome-banner">
        <div>
          <p>STUDENT MANAGEMENT</p>
          <h2>Student List</h2>
          <span>View all students in your assigned block</span>
        </div>
      </section>
      <section class="panel" style="margin-top: 24px;">
        <div class="panel-title"><div><p>BLOCK A</p><h2>Student Directory</h2></div></div>
        <div class="announcement">
          <span class="announcement-dot"></span>
          <div><h3>Sreenivas (STU001)</h3><p>Room: 115 | Roll: 52125</p><small>Status: Active</small></div>
        </div>
        <div class="announcement">
          <span class="announcement-dot"></span>
          <div><h3>Rahul Kumar (STU002)</h3><p>Room: 116 | Roll: 52126</p><small>Status: Active</small></div>
        </div>
      </section>
    `
  },

  // ==================== ADMIN PAGES ====================
  admin: {
    Dashboard: `
      <section class="welcome-banner">
        <div>
          <p>ADMIN DASHBOARD</p>
          <h2>System Overview</h2>
          <span>Complete management of the hostel system</span>
        </div>
      </section>
      <section class="stats-grid">
        <article class="stat-card blue">
          <span class="card-icon">👥</span>
          <p>TOTAL USERS</p>
          <h3>156</h3>
          <small>Students + Staff</small>
        </article>
        <article class="stat-card">
          <span class="card-icon amber">🏠</span>
          <p>OCCUPANCY</p>
          <h3>89%</h3>
          <small>300 of 300 rooms</small>
        </article>
        <article class="stat-card">
          <span class="card-icon green">✓</span>
          <p>ACTIVE SESSIONS</p>
          <h3>24</h3>
          <small>Currently online</small>
        </article>
      </section>
      <section class="dashboard-grid">
        <article class="panel">
          <div class="panel-title"><div><p>RECENT ACTIVITY</p><h2>System Log</h2></div></div>
          <div class="announcement">
            <span class="announcement-dot"></span>
            <div><h3>New student registered</h3><p>STU005 joined Block B</p><small>10 minutes ago</small></div>
          </div>
          <div class="announcement">
            <span class="announcement-dot purple"></span>
            <div><h3>Maintenance resolved</h3><p>Room 205 plumbing fixed</p><small>1 hour ago</small></div>
          </div>
        </article>
        <article class="panel quick-actions">
          <div class="panel-title"><div><p>ADMINISTRATION</p><h2>Management</h2></div></div>
          <button class="action" data-page="User Management">
            <span>👥</span><div><strong>Manage Users</strong><small>Add, edit, or remove users</small></div><b>→</b>
          </button>
          <button class="action" data-page="Reports">
            <span>📊</span><div><strong>View Reports</strong><small>System analytics</small></div><b>→</b>
          </button>
          <button class="action" data-page="System Settings">
            <span>⚙</span><div><strong>Settings</strong><small>System configuration</small></div><b>→</b>
          </button>
        </article>
      </section>
    `,
    'Admin Panel': `
      <section class="welcome-banner">
        <div>
          <p>ADMINISTRATION</p>
          <h2>Admin Panel</h2>
          <span>Manage system-wide settings and operations</span>
        </div>
      </section>
      <section class="stats-grid" style="margin-top: 24px;">
        <article class="stat-card blue">
          <span class="card-icon">📊</span>
          <p>SYSTEM HEALTH</p>
          <h3>Operational</h3>
          <small>All services running</small>
        </article>
        <article class="stat-card">
          <span class="card-icon amber">🔧</span>
          <p>MAINTENANCE</p>
          <h3>5 Pending</h3>
          <small>2 urgent</small>
        </article>
        <article class="stat-card">
          <span class="card-icon green">📢</p></h3>
          <p>ANNOUNCEMENTS</p>
          <h3>12 Active</h3>
          <small>3 new this week</small>
        </article>
      </section>
    `,
    'User Management': `
      <section class="welcome-banner">
        <div>
          <p>USER MANAGEMENT</p>
          <h2>Manage Users</h2>
          <span>Add, edit, and manage all system users</span>
        </div>
      </section>
      <section class="panel" style="margin-top: 24px;">
        <div class="panel-title"><div><p>ALL USERS</p><h2>User Directory</h2></div></div>
        <div class="announcement">
          <span class="announcement-dot"></span>
          <div><h3>STU001 - Sreenivas</h3><p>Role: Student | Block: A | Room: 115</p><small>Status: Active</small></div>
        </div>
        <div class="announcement">
          <span class="announcement-dot"></span>
          <div><h3>STU002 - Rahul Kumar</h3><p>Role: Student | Block: A | Room: 116</p><small>Status: Active</small></div>
        </div>
        <div class="announcement">
          <span class="announcement-dot purple"></span>
          <div><h3>CARE001 - Ramesh</h3><p>Role: Caretaker | Block: A</p><small>Status: Active</small></div>
        </div>
      </section>
    `,
    'System Settings': `
      <section class="welcome-banner">
        <div>
          <p>CONFIGURATION</p>
          <h2>System Settings</h2>
          <span>Configure system parameters</span>
        </div>
      </section>
      <section class="panel" style="margin-top: 24px;">
        <div class="panel-title"><div><p>SETTINGS</p><h2>Application Settings</h2></div></div>
        <div class="announcement">
          <span class="announcement-dot"></span>
          <div><h3>Session Timeout</h3><p>Current: 30 minutes</p><small>Security setting</small></div>
        </div>
        <div class="announcement">
          <span class="announcement-dot"></span>
          <div><h3>Password Policy</h3><p>Min 8 chars, uppercase, lowercase, number required</p><small>Security setting</small></div>
        </div>
      </section>
    `,
    Reports: `
      <section class="welcome-banner">
        <div>
          <p>ANALYTICS</p>
          <h2>System Reports</h2>
          <span>View system analytics and reports</span>
        </div>
      </section>
      <section class="stats-grid" style="margin-top: 24px;">
        <article class="stat-card blue">
          <span class="card-icon">📈</span>
          <p>DAILY LOGINS</p>
          <h3>48</h3>
          <small>Average this week</small>
        </article>
        <article class="stat-card">
          <span class="card-icon amber">📝</span>
          <p>COMPLAINTS</p>
          <h3>15</h3>
          <small>This month</small>
        </article>
        <article class="stat-card">
          <span class="card-icon green">🔧</span>
          <p>MAINTENANCE</p>
          <h3>23</h3>
          <small>Completed this month</small>
        </article>
      </section>
    `
  }
};

// Get page content based on role and page name
function getPageContent(role, page) {
  // Check role-specific pages first
  if (PageTemplates[role] && PageTemplates[role][page]) {
    return PageTemplates[role][page];
  }
  // Fall back to common pages
  if (PageTemplates.common[page]) {
    return PageTemplates.common[page];
  }
  // Default dashboard if not found
  return PageTemplates[role]?.Dashboard || '<p>Page not found</p>';
}
