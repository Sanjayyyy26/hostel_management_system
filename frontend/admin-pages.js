/* Admin page renderers */
window.PageTemplates = window.PageTemplates || {};
window.PageTemplates.admin = {
    async 'Admin Panel'() {
      const [reportsRes, healthRes] = await Promise.all([
        Auth.api('/api/reports'),
        Auth.api('/api/health')
      ]);
      const rep = reportsRes.reports || {};

      return `
        <div class="section-heading">
          <h2>System Overview & Control Panel</h2>
          <p>Database Status: <strong style="color: ${healthRes.database === 'connected' ? '#08c21d' : '#e10000'};">PostgreSQL Connected</strong></p>
        </div>
        <section class="card-grid dashboard-cards">
          <article class="notice-card" data-page-card="User Management" role="button" tabindex="0">
            <div class="complaint-card-head">
              <h3>Students</h3>
              <span class="status-pill done">${rep.students || 0} Total</span>
            </div>
            <div class="notice-paper">
              <p>Registered students across all hostels.</p>
              <small>Click to manage users</small>
            </div>
          </article>

          <article class="notice-card" data-page-card="User Management" role="button" tabindex="0">
            <div class="complaint-card-head">
              <h3>Caretakers</h3>
              <span class="status-pill done">${rep.caretakers || 0} Active</span>
            </div>
            <div class="notice-paper">
              <p>Hostel caretakers managing blocks.</p>
              <small>Click to view staff</small>
            </div>
          </article>

          <article class="notice-card" data-page-card="Hostel Blocks" role="button" tabindex="0">
            <div class="complaint-card-head">
              <h3>Hostel Blocks</h3>
              <span class="status-pill done">${rep.hostels || 0} Blocks</span>
            </div>
            <div class="notice-paper">
              <p>Total capacity across ${rep.rooms || 0} rooms.</p>
              <small>Click to view hostels</small>
            </div>
          </article>

          <article class="notice-card" data-page-card="Complaints" role="button" tabindex="0">
            <div class="complaint-card-head">
              <h3>Complaints</h3>
              <span class="status-pill progress">${rep.complaints || 0} Total</span>
            </div>
            <div class="notice-paper">
              <p>All recorded complaints in the system.</p>
              <small>Click to review</small>
            </div>
          </article>

          <article class="notice-card" data-page-card="Reports" role="button" tabindex="0">
            <div class="complaint-card-head">
              <h3>Reports & Stats</h3>
              <span class="status-pill done">Analytics</span>
            </div>
            <div class="notice-paper">
              <p>Generate reports and statistics for management.</p>
              <small>Click to view reports</small>
            </div>
          </article>

          <article class="notice-card" data-page-card="System Settings" role="button" tabindex="0">
            <div class="complaint-card-head">
              <h3>System Settings</h3>
              <span class="status-pill done">Online</span>
            </div>
            <div class="notice-paper">
              <p>Configuration, security, and database diagnostics.</p>
              <small>Click to inspect settings</small>
            </div>
          </article>
        </section>
      `;
    },

    async Dashboard() {
      const [compRes, annRes] = await Promise.all([
        Auth.api('/api/complaints'),
        Auth.api('/api/announcements')
      ]);
      const complaints = compRes.complaints || [];
      const announcements = annRes.announcements || [];

      const comp1 = complaints[0] || {
        complaint: 'No drinking water in Sabari.\nPoor maintaince\nNo cleaning',
        votes: 12
      };

      const ann1 = announcements[0] || {
        announcement: 'Please collect your special dinner tokens at your respected hostel blocks from the caretaker.',
        author: 'Hostel Office'
      };

      return `
        <div class="ct-page-view">
          <div class="ct-heading">
            <h1>Dashboard</h1>
          </div>
          <div class="admin-dashboard-grid">
            <!-- Card 1: Review Complaints -->
            <article class="ct-card" data-page-card="Complaints" role="button" tabindex="0">
              <h3 class="ct-card-title">Review Complaints</h3>
              <div class="ct-inner-box">
                <p class="ct-inner-text">${escapeHtml(comp1.complaint || '').replace(/\n/g, '<br>')}</p>
                <div class="ct-inner-footer">
                  <span class="ct-star-vote">☆ ${comp1.votes ?? 12} votes</span>
                </div>
              </div>
            </article>

            <!-- Card 2: New Announcement -->
            <article class="ct-card" data-page-card="Announcements" role="button" tabindex="0">
              <h3 class="ct-card-title">New Announcement</h3>
              <div class="ct-inner-box">
                <p class="ct-inner-text">${escapeHtml(ann1.announcement || '').replace(/\n/g, '<br>')}</p>
                <div class="ct-inner-footer">
                  <span class="ct-signature">${escapeHtml(ann1.author || 'Hostel Office')}</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      `;
    },

    async 'User Management'() {
      const [res, hostelsRes] = await Promise.all([
        Auth.api('/api/users'),
        Auth.api('/api/hostels')
      ]);
      const students = res.students || [];
      const caretakers = res.caretakers || [];
      const admins = res.admins || [];
      const hostels = hostelsRes.hostels || [];

      return `
        <div class="section-heading">
          <h2>User Management</h2>
          <p>Manage system users, students, caretakers, and administrators</p>
        </div>

        <h3 style="margin-top:24px;">Students (${students.length})</h3>
        <section class="maintenance-table-wrap">
          <table class="maintenance-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Registration</th>
                <th>Name</th>
                <th>Year</th>
                <th>Gender</th>
                <th>Phone</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(s => `
                <tr>
                  <td><strong>${s.roll_number}</strong></td>
                  <td>${s.registered_number}</td>
                  <td>${escapeHtml(s.name)}</td>
                  <td>Year ${s.year}</td>
                  <td>${escapeHtml(s.gender)}</td>
                  <td>${escapeHtml(s.phone_number)}</td>
                  <td>${escapeHtml(s.email)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </section>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:34px; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
          <h3 style="margin:0;">Caretakers (${caretakers.length})</h3>
          <button class="admin-btn-primary" type="button" data-action="openAddCaretakerModal">+ Add Caretaker</button>
        </div>

        <section class="maintenance-table-wrap">
          <table class="maintenance-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Assigned Hostel Block</th>
                <th>Phone</th>
                <th>Email</th>
                <th style="text-align:center;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${caretakers.length ? caretakers.map(c => `
                <tr>
                  <td><strong>${escapeHtml(c.employee_id)}</strong></td>
                  <td>${escapeHtml(c.name)}</td>
                  <td>
                    <span class="badge-verified" style="background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd; font-weight:700;">
                      ${escapeHtml(c.hostel_name || 'Sabari')}
                    </span>
                  </td>
                  <td>${escapeHtml(c.phone_number)}</td>
                  <td>${escapeHtml(c.email)}</td>
                  <td style="text-align:center;">
                    <div style="display:flex; gap:6px; justify-content:center; align-items:center;">
                      <button class="add-button" style="height:30px; padding:0 10px; font-size:12px; background:#0284c7; color:#fff; border:none; border-radius:6px; cursor:pointer;"
                              type="button"
                              data-action="openEditCaretakerModal"
                              data-id="${escapeHtml(c.employee_id)}"
                              data-name="${escapeHtml(c.name)}"
                              data-hostel="${escapeHtml(c.hostel_name || '')}"
                              title="Edit assigned hostel block for ${escapeHtml(c.name)}">
                        ✏️ Edit Block
                      </button>
                      <button class="add-button" style="height:30px; padding:0 10px; font-size:12px; background:#ef4444; color:#fff; border:none; border-radius:6px; cursor:pointer;"
                              type="button"
                              data-action="deleteCaretaker"
                              data-id="${escapeHtml(c.employee_id)}"
                              data-name="${escapeHtml(c.name)}"
                              title="Remove caretaker ${escapeHtml(c.name)}">
                        🗑 Remove
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="6" style="text-align:center; color:#888; padding:20px;">No caretakers found.</td>
                </tr>
              `}
            </tbody>
          </table>
        </section>

        <!-- Add Caretaker Modal -->
        <section class="complaint-modal" id="addCaretakerModal" hidden>
          <div class="complaint-dialog" style="max-width:540px;">
            <button class="complaint-back" type="button" data-action="closeAddCaretakerModal" aria-label="Back">←</button>
            <h2 style="margin:0 0 16px 0; font-size:18px;">Create Caretaker & Assign Hostel Block</h2>
            <form id="addCaretakerForm" class="complaint-form">
              <label for="newCtName">Full Name</label>
              <input id="newCtName" type="text" placeholder="e.g. Ramesh Kumar" required style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:8px; margin-bottom:12px;" />

              <label for="newCtEmpId">Employee ID</label>
              <input id="newCtEmpId" type="text" placeholder="e.g. EMP_301" required style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:8px; margin-bottom:12px;" />

              <label for="newCtHostel">Assign Hostel Block (Hostel Name)</label>
              <select id="newCtHostel" required style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:8px; margin-bottom:12px;">
                <option value="">-- Select Hostel Block to Assign --</option>
                ${hostels.map(h => `
                  <option value="${escapeHtml(h.name)}">${escapeHtml(h.name)} (${escapeHtml(h.for_gender || 'All')} Hostel)</option>
                `).join('')}
              </select>

              <label for="newCtPhone">Mobile Number</label>
              <input id="newCtPhone" type="tel" placeholder="e.g. 9988776655" required style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:8px; margin-bottom:12px;" />

              <label for="newCtEmail">Email Address</label>
              <input id="newCtEmail" type="email" placeholder="e.g. ramesh@nitandhra.ac.in" required style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:8px; margin-bottom:12px;" />

              <label for="newCtPassword">Password</label>
              <input id="newCtPassword" type="password" placeholder="Set login password" required style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:8px; margin-bottom:16px;" />

              <button class="primary-button" type="submit">CREATE & ASSIGN CARETAKER</button>
            </form>
          </div>
        </section>

        <!-- Edit Caretaker Block Modal -->
        <section class="complaint-modal" id="editCaretakerModal" hidden>
          <div class="complaint-dialog" style="max-width:500px;">
            <button class="complaint-back" type="button" data-action="closeEditCaretakerModal" aria-label="Back">←</button>
            <h2 style="margin:0 0 16px 0; font-size:18px;">Edit Assigned Hostel Block</h2>
            <form id="editCaretakerForm" class="complaint-form">
              <input type="hidden" id="editCtEmpId" />
              <div style="margin-bottom:14px; background:#f8fafc; padding:12px; border-radius:8px; border:1px solid #e2e8f0; font-size:14px;">
                <p style="margin:0 0 4px 0;"><strong>Caretaker:</strong> <span id="editCtNameDisplay" style="color:#0284c7; font-weight:700;"></span></p>
                <p style="margin:0; color:#64748b; font-size:13px;">Employee ID: <strong id="editCtEmpIdDisplay" style="color:#334155;"></strong></p>
              </div>

              <label for="editCtHostel">Assign Hostel Block</label>
              <select id="editCtHostel" required style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:8px; margin-bottom:16px;">
                <option value="">-- Select Hostel Block --</option>
                ${hostels.map(h => `
                  <option value="${escapeHtml(h.name)}">${escapeHtml(h.name)} (${escapeHtml(h.for_gender || 'All')} Hostel)</option>
                `).join('')}
              </select>

              <button class="primary-button" type="submit">UPDATE ASSIGNED BLOCK</button>
            </form>
          </div>
        </section>

        <h3 style="margin-top:34px;">System Administrators (${admins.length})</h3>
        <section class="maintenance-table-wrap">
          <table class="maintenance-table">
            <thead>
              <tr>
                <th>Admin Key</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              ${admins.map(a => `
                <tr>
                  <td><strong>${escapeHtml(a.key)}</strong></td>
                  <td>Super Administrator</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </section>
      `;
    },

    async Reports() {
      const [reportsRes, hostelsRes] = await Promise.all([
        Auth.api('/api/reports'),
        Auth.api('/api/hostels')
      ]);
      const rep = reportsRes.reports || {};
      const hostels = hostelsRes.hostels || [];

      return `
        <div class="section-heading">
          <h2>Hostel System Reports & Metrics</h2>
          <p>Current database summary report</p>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:28px;">
          <div style="background:#ffffff; padding:20px; border-radius:12px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:32px; font-weight:900; color:var(--blue);">${rep.students || 0}</div>
            <div style="color:#666; font-size:14px; font-weight:700;">Total Students</div>
          </div>
          <div style="background:#ffffff; padding:20px; border-radius:12px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:32px; font-weight:900; color:var(--blue);">${rep.hostels || 0}</div>
            <div style="color:#666; font-size:14px; font-weight:700;">Hostel Blocks</div>
          </div>
          <div style="background:#ffffff; padding:20px; border-radius:12px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:32px; font-weight:900; color:var(--blue);">${rep.rooms || 0}</div>
            <div style="color:#666; font-size:14px; font-weight:700;">Total Rooms</div>
          </div>
          <div style="background:#ffffff; padding:20px; border-radius:12px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:32px; font-weight:900; color:#e10000;">${rep.complaints || 0}</div>
            <div style="color:#666; font-size:14px; font-weight:700;">Total Complaints</div>
          </div>
          <div style="background:#ffffff; padding:20px; border-radius:12px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:32px; font-weight:900; color:#08c21d;">${rep.outings || 0}</div>
            <div style="color:#666; font-size:14px; font-weight:700;">Outing Requests</div>
          </div>
          <div style="background:#ffffff; padding:20px; border-radius:12px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:32px; font-weight:900; color:var(--ink);">${rep.maintenance || 0}</div>
            <div style="color:#666; font-size:14px; font-weight:700;">Maintenance Logs</div>
          </div>
        </div>

        <h3 style="margin-top:24px;">Hostel Capacity Distribution</h3>
        <section class="maintenance-table-wrap">
          <table class="maintenance-table">
            <thead>
              <tr>
                <th>Block</th>
                <th>Gender</th>
                <th>Floors</th>
                <th>Seater Type</th>
                <th>Total Capacity</th>
              </tr>
            </thead>
            <tbody>
              ${hostels.map(h => `
                <tr>
                  <td><strong>${escapeHtml(h.name)}</strong> (${escapeHtml(h.block_id)})</td>
                  <td>${escapeHtml(h.for_gender)}</td>
                  <td>${h.floors}</td>
                  <td>${h.seater}-Seater</td>
                  <td><strong>${h.capacity} beds</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </section>
      `;
    },

    async 'System Settings'() {
      const healthRes = await Auth.api('/api/health');
      const session = Auth.getSession();

      return `
        <section class="profile-details">
          <div class="section-heading">
            <h2>System & Server Settings</h2>
            <p>PostgreSQL Database & API Status</p>
          </div>
          <dl>
            <div><dt>Database Status</dt><dd><strong style="color: ${healthRes.database === 'connected' ? '#08c21d' : '#e10000'};">${escapeHtml(healthRes.database || 'offline')}</strong></dd></div>
            <div><dt>Database Engine</dt><dd>PostgreSQL 18 (Localhost:5432 / hostellers)</dd></div>
            <div><dt>Server Endpoint</dt><dd>http://localhost:3000</dd></div>
            <div><dt>Active Session Token</dt><dd style="word-break:break-all; font-family:monospace; font-size:12px;">${escapeHtml(session?.token || 'None')}</dd></div>
            <div><dt>Logged In Admin</dt><dd>${escapeHtml(session?.name || 'Administrator')} (${escapeHtml(session?.userId || '-')})</dd></div>
            <div><dt>Session Expiration</dt><dd>${session?.expiresAt ? new Date(session.expiresAt).toLocaleTimeString() : '-'}</dd></div>
          </dl>
        </section>
      `;
    },

    async Announcements() {
      const [annRes, meRes] = await Promise.all([
        Auth.api('/api/announcements'),
        Auth.api('/api/me')
      ]);
      const announcements = annRes.announcements || [];
      const blocks = meRes.user?.blocks || [
        { block_id: 'sabari', name: 'Sabari' },
        { block_id: 'indravathi', name: 'Indravathi' },
        { block_id: 'godavari', name: 'Godavari' },
        { block_id: 'krishna', name: 'Krishna' }
      ];

      const defaultAnnouncements = [
        {
          title: 'Special Dinner',
          text: 'Please collect your special dinner tokens at your respected hostel blocks from the caretaker.',
          footer: 'Chief Warden, Hostel Office'
        },
        {
          title: 'Non Local Outing',
          text: 'No non local outing for students who hasn\'t applied to it.',
          footer: 'Sabari Caretaker'
        },
        {
          title: 'Power Shutdown',
          text: 'Dear Students, This is to inform you that there will be a power shut-down on 14 August 2026 from 9:00 AM to 5:00 PM',
          footer: 'Hostel Office'
        }
      ];

      return `
        <div class="ct-page-view">
          <div class="ct-heading ct-flex-between">
            <h1>Announcements</h1>
            <div class="admin-header-actions">
              <div class="admin-pill-select-wrap">
                <select class="admin-pill-select" id="adminAnnFilter">
                  <option value="">v Hostel Blocks</option>
                  <option value="all">All Blocks</option>
                  <option value="sabari">Sabari</option>
                  <option value="indravathi">Indravathi</option>
                  <option value="nagavalli">Nagavalli</option>
                  <option value="godavari">Godavari</option>
                  <option value="krishna">Krishna</option>
                </select>
              </div>
              <button class="admin-btn-primary" type="button" data-action="openAnnouncementForm">+ Add Announcement</button>
            </div>
          </div>

          <section class="complaint-modal" id="announcementComposer" aria-labelledby="adminAnnFormTitle" hidden>
            <div class="complaint-dialog">
              <button class="complaint-back" type="button" data-action="closeAnnouncementForm" aria-label="Back">←</button>
              <h2 id="adminAnnFormTitle">Post Announcement</h2>
              <form id="announcementForm" class="complaint-form">
                <label for="announcementTitle">Title</label>
                <input id="announcementTitle" type="text" placeholder="e.g. Special Dinner" />
                <label for="announcementText">Notice Message</label>
                <textarea id="announcementText" rows="6" placeholder="Type notice content here..." required></textarea>
                <label>Target Hostel Blocks</label>
                <div style="display:flex; gap:12px; flex-wrap:wrap;">
                  ${blocks.map(b => `
                    <label style="display:flex; align-items:center; gap:6px; font-weight:normal; font-size:14px;">
                      <input type="checkbox" name="annBlock" value="${escapeHtml(b.block_id)}" checked />
                      ${escapeHtml(b.name)}
                    </label>
                  `).join('')}
                </div>
                <button class="primary-button" type="submit">BROADCAST ANNOUNCEMENT</button>
              </form>
            </div>
          </section>

          <div class="ct-cards-grid">
            ${announcements.length ? announcements.map(a => {
              const parts = String(a.announcement || '').split('\n\n');
              const aTitle = a.title || (parts.length > 1 ? parts[0] : 'Announcement');
              const aText = parts.length > 1 ? parts.slice(1).join('\n\n') : (a.announcement || '');
              return `
                <article class="ct-card">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                    <h3 class="ct-card-title" style="margin:0;">${escapeHtml(aTitle)}</h3>
                    <button class="delete-btn" type="button" data-action="deleteAnnouncement" data-id="${escapeHtml(a.announcement_id || a.id)}" title="Delete Announcement" style="background:#fee2e2; border:none; color:#dc2626; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600; display:inline-flex; align-items:center; gap:4px;">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
                      Delete
                    </button>
                  </div>
                  <div class="ct-inner-box">
                    <p class="ct-inner-text">${escapeHtml(aText)}</p>
                    <div class="ct-inner-footer">
                      <span class="ct-signature">${escapeHtml(a.author || (Array.isArray(a.hostels) && a.hostels.length ? a.hostels.join(', ') : 'Hostel Office'))}</span>
                    </div>
                  </div>
                </article>
              `;
            }).join('') : defaultAnnouncements.map(d => `
              <article class="ct-card">
                <h3 class="ct-card-title">${escapeHtml(d.title)}</h3>
                <div class="ct-inner-box">
                  <p class="ct-inner-text">${escapeHtml(d.text)}</p>
                  <div class="ct-inner-footer">
                    <span class="ct-signature">${escapeHtml(d.footer)}</span>
                  </div>
                </div>
              </article>
            `).join('')}
          </div>
        </div>
      `;
    },

    async Complaints() {
      const res = await Auth.api('/api/complaints');
      const complaints = res.complaints || [];

      const defaultComplaints = [
        {
          id: 'CMP_1',
          title: 'No Cleaning',
          dateAgo: '2 days ago',
          status: 'In Progress',
          badgeClass: 'badge-progress',
          text: "It's been 3 days since no cleaning has done to our rooms.",
          hostel: 'Sabari',
          votes: 5
        },
        {
          id: 'CMP_2',
          title: 'Non Local Outing',
          dateAgo: '1 week ago',
          status: 'In Progress',
          badgeClass: 'badge-progress',
          text: "No non local outing for students who hasn't applied to it.",
          hostel: 'Indravathi',
          votes: 0
        },
        {
          id: 'CMP_3',
          title: 'Power Shutdown',
          dateAgo: '2 months ago',
          status: 'Done',
          badgeClass: 'badge-done',
          text: 'Dear Students, This is to inform you that there will be a power shut-down on 14 August 2026 from 9:00 AM to 5:00 PM',
          hostel: 'All',
          votes: 2
        }
      ];

      return `
        <div class="ct-page-view">
          <div class="ct-heading ct-flex-between">
            <h1>Complaints</h1>
            <div class="admin-header-actions">
              <div class="admin-pill-select-wrap">
                <select class="admin-pill-select" id="adminComplaintFilter">
                  <option value="">v Hostel Blocks</option>
                  <option value="all">All Blocks</option>
                  <option value="sabari">Sabari</option>
                  <option value="indravathi">Indravathi</option>
                  <option value="nagavalli">Nagavalli</option>
                  <option value="godavari">Godavari</option>
                  <option value="krishna">Krishna</option>
                </select>
              </div>
            </div>
          </div>

          <div class="ct-cards-grid" id="ctComplaintsGrid">
            ${complaints.length ? complaints.map(c => {
              const isResolved = Boolean(c.status);
              const statusText = isResolved ? 'Done' : 'In Progress';
              const statusClass = isResolved ? 'badge-done' : 'badge-progress';
              const parts = String(c.complaint || '').split('\n\n');
              const title = parts.length > 1 ? parts[0] : (c.complaint?.slice(0, 30) || 'Complaint');
              const text = parts.length > 1 ? parts.slice(1).join('\n\n') : c.complaint;
              return `
                <article class="ct-card ct-complaint-card" data-status="${isResolved ? 'done' : 'in_progress'}">
                  <div class="ct-card-header-flex">
                    <div class="ct-card-title-group">
                      <h3 class="ct-card-title">${escapeHtml(title)}</h3>
                      <span class="ct-card-subdate">${escapeHtml(formatDate(c.date))}${c.time ? ' ' + escapeHtml(formatTime(c.time)) : ''}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <button class="ct-badge ${statusClass}" type="button" data-action="toggleComplaint" data-id="${escapeHtml(c.complaint_id || c.id)}" data-next-status="${!isResolved}" title="Click to mark as ${isResolved ? 'In Progress' : 'Done'}">${statusText}</button>
                      <button class="delete-btn" type="button" data-action="deleteComplaint" data-id="${escapeHtml(c.complaint_id || c.id)}" title="Delete Complaint" style="background:#fee2e2; border:none; color:#dc2626; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600; display:inline-flex; align-items:center; gap:4px;">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
                        Delete
                      </button>
                    </div>
                  </div>
                  <div class="ct-inner-box">
                    <p class="ct-inner-text">${escapeHtml(text || '')}</p>
                    <div class="ct-inner-footer" style="justify-content: space-between;">
                      <span class="ct-signature">${escapeHtml(c.hostel_name || 'Sabari')}</span>
                      <span class="ct-star-vote">☆ ${c.votes || 0} votes</span>
                    </div>
                  </div>
                </article>
              `;
            }).join('') : defaultComplaints.map(d => {
              const isResolved = d.status === 'Done';
              const statusClass = isResolved ? 'badge-done' : 'badge-progress';
              return `
                <article class="ct-card ct-complaint-card" data-status="${isResolved ? 'done' : 'in_progress'}">
                  <div class="ct-card-header-flex">
                    <div class="ct-card-title-group">
                      <h3 class="ct-card-title">${escapeHtml(d.title)}</h3>
                      <span class="ct-card-subdate">${escapeHtml(d.dateAgo)}</span>
                    </div>
                    <button class="ct-badge ${statusClass}" type="button" data-action="toggleComplaint" data-id="${escapeHtml(d.id)}" data-next-status="${!isResolved}" title="Click to mark as ${isResolved ? 'In Progress' : 'Done'}">${d.status}</button>
                  </div>
                  <div class="ct-inner-box">
                    <p class="ct-inner-text">${escapeHtml(d.text)}</p>
                    <div class="ct-inner-footer" style="justify-content: space-between;">
                      <span class="ct-signature">${escapeHtml(d.hostel)}</span>
                      <span class="ct-star-vote">☆ ${d.votes} votes</span>
                    </div>
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        </div>
      `;
    },

    async 'Hostel Room Allocation'() {
      const [allocRes, winRes] = await Promise.all([
        Auth.api('/api/admin/allocations'),
        Auth.api('/api/windows')
      ]);
      const allocations = allocRes.allocations || [];
      const allocWin = winRes.windows?.allocation || {};

      return `
        <div class="ct-page-view">
          <div class="ct-heading ct-flex-between">
            <h1>Hostel Room Allocation</h1>
            <div class="admin-header-actions">
              <div class="admin-pill-select-wrap">
                <select class="admin-pill-select" id="adminAllocFilter">
                  <option value="">v Hostel Blocks</option>
                  <option value="all">All Blocks</option>
                  <option value="sabari">Sabari</option>
                  <option value="indravathi">Indravathi</option>
                  <option value="nagavalli">Nagavalli</option>
                  <option value="godavari">Godavari</option>
                  <option value="krishna">Krishna</option>
                </select>
              </div>
              <button class="admin-btn-primary" type="button" data-action="openStartAllocationModal">+ Start Allocation</button>
            </div>
          </div>

          <!-- Allocation Window Status Banner -->
          <div style="background:${allocWin.active ? '#ecfdf5' : '#fef2f2'}; border:1px solid ${allocWin.active ? '#a7f3d0' : '#fecaca'}; border-radius:10px; padding:12px 18px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
              <span style="font-weight:800; color:${allocWin.active ? '#065f46' : '#991b1b'};">
                ${allocWin.active ? '🟢 Room Allocation Window: ACTIVE' : '🔴 Room Allocation Window: CLOSED'}
              </span>
              <span style="font-size:13px; color:#475569; margin-left:8px;">
                (Active Dates: <strong>${escapeHtml(formatDate(allocWin.startDate))}</strong> to <strong>${escapeHtml(formatDate(allocWin.endDate))}</strong>)
              </span>
            </div>
            <button class="admin-btn-secondary" id="btnChangeAllocDates" type="button" data-action="openStartAllocationModal">📅 Change Window Dates</button>
          </div>

          <!-- Start Allocation Dialog (Window Dates Setup) -->
          <section class="complaint-modal" id="startAllocationModal" hidden>
            <div class="complaint-dialog" style="max-width:500px;">
              <button class="complaint-back" type="button" data-action="closeStartAllocationModal" aria-label="Back">←</button>
              <h2 style="margin:0 0 16px 0; font-size:18px;">Set Room Allocation Window Dates</h2>
              <form id="startAllocationForm" class="complaint-form">
                <label for="allocStartDate">Allocation Start Date</label>
                <input id="allocStartDate" type="date" value="${allocWin.startDate || '2026-01-01'}" required style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:8px; margin-bottom:12px;" />

                <label for="allocEndDate">Allocation End Date</label>
                <input id="allocEndDate" type="date" value="${allocWin.endDate || '2026-12-31'}" required style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:8px; margin-bottom:14px;" />

                <label style="display:flex; align-items:center; gap:8px; margin-bottom:16px; cursor:pointer;">
                  <input type="checkbox" id="allocActive" ${allocWin.active ? 'checked' : ''} style="width:18px; height:18px;" />
                  <span style="font-weight:600; color:#1e293b;">Enable / Keep Window Active</span>
                </label>

                <button class="primary-button" type="submit">SAVE ALLOCATION DATES</button>
              </form>
            </div>
          </section>

          <!-- PDF Receipt Viewer Modal -->
          <section class="complaint-modal" id="receiptViewerModal" hidden>
            <div class="complaint-dialog pdf-receipt-modal-dialog">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px;">
                <h2 style="margin:0; font-size:17px; color:#0f172a;">📄 Verified SBI Collect Fee Receipt (PDF)</h2>
                <div style="display:flex; gap:8px;">
                  <button class="admin-btn-primary" type="button" id="btnDownloadAdminPdf" style="padding:6px 14px; font-size:12.5px;">⬇ Download PDF</button>
                  <button class="admin-btn-primary" type="button" id="btnPrintReceiptPdf" style="padding:6px 14px; font-size:12.5px; background:#475569;">🖨 Print</button>
                  <button class="choice-icon" type="button" data-action="closeReceiptModal" style="border:none; font-size:18px;">✕</button>
                </div>
              </div>

              <!-- Official PDF Challan Container -->
              <div id="adminPdfChallanArea">
                <div class="pdf-challan-paper" id="printableReceiptPaper">
                  <div class="pdf-stamp-verified">PAID & VERIFIED</div>
                  <div class="pdf-challan-header">
                    <h3>National Institute of Technology Andhra Pradesh</h3>
                    <p>Hostel Administration & Chief Warden Office • Tadepalligudem - 534101</p>
                    <p style="font-weight:700; color:#1e293b; margin-top:4px;">OFFICIAL HOSTEL ADMISSION & FEE RECEIPT (PDF)</p>
                  </div>

                  <table class="pdf-challan-table">
                    <tbody>
                      <tr>
                        <td class="strong-label">SBI Collect Reference No.</td>
                        <td><strong id="pdfViewRef" style="color:#1ba0f2;">DUK82910488</strong></td>
                      </tr>
                      <tr>
                        <td class="strong-label">Student Roll Number</td>
                        <td id="pdfViewRoll">424151</td>
                      </tr>
                      <tr>
                        <td class="strong-label">Student Full Name</td>
                        <td id="pdfViewName">Sanjay Pal</td>
                      </tr>
                      <tr>
                        <td class="strong-label">Academic Year / Hostel</td>
                        <td>Year <span id="pdfViewYear">3</span> • <span id="pdfViewHostel">Sabari</span> (Room <span id="pdfViewRoom">112</span>)</td>
                      </tr>
                      <tr>
                        <td class="strong-label">Payment Category</td>
                        <td>Hostel Accommodation & Mess Deposit (Odd Sem 2026)</td>
                      </tr>
                      <tr>
                        <td class="strong-label">Seat Rent (Non-refundable)</td>
                        <td>₹ 6,000.00</td>
                      </tr>
                      <tr>
                        <td class="strong-label">Mess Advance & Utilities</td>
                        <td>₹ 16,500.00</td>
                      </tr>
                      <tr>
                        <td class="strong-label">Hostel Caution Deposit</td>
                        <td>₹ 2,000.00</td>
                      </tr>
                      <tr style="background:#f8fafc; font-weight:700; border-top:2px solid #cbd5e1;">
                        <td class="strong-label" style="font-size:14px; color:#0f172a;">Total Amount Paid</td>
                        <td style="font-size:14px; color:#16a34a;">₹ 24,500.00 (Success)</td>
                      </tr>
                    </tbody>
                  </table>

                  <div id="pdfEmbeddedFrameWrap" style="margin-top:14px;" hidden>
                    <p style="font-size:12px; font-weight:700; color:#475569; margin-bottom:6px;">Uploaded Student PDF Attachment:</p>
                    <iframe id="pdfEmbeddedIframe" style="width:100%; height:260px; border:1px solid #cbd5e1; border-radius:8px;"></iframe>
                  </div>
                </div>
              </div>

              <div class="pdf-actions-row">
                <button class="primary-button" type="button" data-action="closeReceiptModal" style="width:auto; padding:8px 24px;">Close Viewer</button>
              </div>
            </div>
          </section>

          <div class="admin-allocation-table-wrap">
            <table class="admin-allocation-table">
              <thead>
                <tr>
                  <th>Date/Time</th>
                  <th>Roll Number</th>
                  <th>Name</th>
                  <th>Year</th>
                  <th>Hostel</th>
                  <th>Room No.</th>
                  <th>Receipt</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${allocations.map(r => {
                  const bClass = r.status === 'Verified' ? 'badge-verified' : (r.status === 'Declined' ? 'badge-declined' : 'badge-review');
                  return `
                    <tr>
                      <td>${escapeHtml(formatDateTime(r.dateTime))}</td>
                      <td><strong>${escapeHtml(r.roll)}</strong></td>
                      <td>${escapeHtml(r.name)}</td>
                      <td>Year ${escapeHtml(r.year)}</td>
                      <td>${escapeHtml(r.hostel)}</td>
                      <td>${escapeHtml(r.room)} ${r.cot ? `(${escapeHtml(r.cot)})` : ''}</td>
                      <td>
                        <a href="#" class="receipt-link"
                           data-action="viewPdfReceipt"
                           data-receipt-roll="${escapeHtml(r.roll)}"
                           data-receipt-name="${escapeHtml(r.name)}"
                           data-receipt-year="${escapeHtml(r.year)}"
                           data-receipt-hostel="${escapeHtml(r.hostel)}"
                           data-receipt-room="${escapeHtml(r.room)}"
                           data-receipt-ref="${escapeHtml(r.receiptRef || 'REC-DUK829104')}"
                           data-receipt-pdf="${r.receiptPdf ? escapeHtml(r.receiptPdf) : ''}">📄 ${escapeHtml(r.receiptName || 'Receipt.pdf')}</a>
                      </td>
                      <td>
                        <select class="status-select-badge ${bClass}"
                                data-action="updateStatus"
                                data-type="allocation"
                                data-id="${escapeHtml(r.id)}"
                                data-roll="${escapeHtml(r.roll)}"
                                title="Click to update allocation status">
                          <option value="Review" ${r.status === 'Review' ? 'selected' : ''}>Review</option>
                          <option value="Verified" ${r.status === 'Verified' ? 'selected' : ''}>Verified</option>
                          <option value="Declined" ${r.status === 'Declined' ? 'selected' : ''}>Declined</option>
                        </select>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    async 'Hostel Room Evacuation'() {
      const [evacRes, winRes] = await Promise.all([
        Auth.api('/api/admin/evacuations'),
        Auth.api('/api/windows')
      ]);
      const evacuations = evacRes.evacuations || [];
      const evacWin = winRes.windows?.evacuation || {};

      return `
        <div class="ct-page-view">
          <div class="ct-heading ct-flex-between">
            <h1>Hostel Room Evacuation</h1>
            <div class="admin-header-actions">
              <div class="admin-pill-select-wrap">
                <select class="admin-pill-select" id="adminEvacFilter">
                  <option value="">v Hostel Blocks</option>
                  <option value="all">All Blocks</option>
                  <option value="sabari">Sabari</option>
                  <option value="indravathi">Indravathi</option>
                  <option value="nagavalli">Nagavalli</option>
                  <option value="godavari">Godavari</option>
                  <option value="krishna">Krishna</option>
                </select>
              </div>
              <button class="admin-btn-primary" type="button" data-action="openStartVacatingModal">+ Start Vacating</button>
            </div>
          </div>

          <!-- Evacuation Window Status Banner -->
          <div style="background:${evacWin.active ? '#ecfdf5' : '#fef2f2'}; border:1px solid ${evacWin.active ? '#a7f3d0' : '#fecaca'}; border-radius:10px; padding:12px 18px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
              <span style="font-weight:800; color:${evacWin.active ? '#065f46' : '#991b1b'};">
                ${evacWin.active ? '🟢 Room Evacuation Window: ACTIVE' : '🔴 Room Evacuation Window: CLOSED'}
              </span>
              <span style="font-size:13px; color:#475569; margin-left:8px;">
                (Active Dates: <strong>${escapeHtml(formatDate(evacWin.startDate))}</strong> to <strong>${escapeHtml(formatDate(evacWin.endDate))}</strong>)
              </span>
            </div>
            <button class="admin-btn-secondary" id="btnChangeEvacDates" type="button" data-action="openStartVacatingModal">📅 Change Window Dates</button>
          </div>

          <!-- Start Vacating Dialog (Window Dates Setup) -->
          <section class="complaint-modal" id="startVacatingModal" hidden>
            <div class="complaint-dialog" style="max-width:500px;">
              <button class="complaint-back" type="button" data-action="closeStartVacatingModal" aria-label="Back">←</button>
              <h2 style="margin:0 0 16px 0; font-size:18px;">Set Room Evacuation Window Dates</h2>
              <form id="startVacatingForm" class="complaint-form">
                <label for="evacStartDate">Evacuation Start Date</label>
                <input id="evacStartDate" type="date" value="${evacWin.startDate || '2026-01-01'}" required style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:8px; margin-bottom:12px;" />

                <label for="evacEndDate">Evacuation End Date</label>
                <input id="evacEndDate" type="date" value="${evacWin.endDate || '2026-12-31'}" required style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:8px; margin-bottom:14px;" />

                <label style="display:flex; align-items:center; gap:8px; margin-bottom:16px; cursor:pointer;">
                  <input type="checkbox" id="evacActive" ${evacWin.active ? 'checked' : ''} style="width:18px; height:18px;" />
                  <span style="font-weight:600; color:#1e293b;">Enable / Keep Window Active</span>
                </label>

                <button class="primary-button" type="submit">SAVE EVACUATION DATES</button>
              </form>
            </div>
          </section>

          <div class="admin-allocation-table-wrap">
            <table class="admin-allocation-table">
              <thead>
                <tr>
                  <th>Date/Time</th>
                  <th>Roll Number</th>
                  <th>Name</th>
                  <th>Year</th>
                  <th>Hostel</th>
                  <th>Room No.</th>
                  <th>Leave Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${evacuations.map(e => {
                  const bClass = e.status === 'Verified' ? 'badge-verified' : (e.status === 'Declined' ? 'badge-declined' : 'badge-review');
                  return `
                    <tr>
                      <td>${escapeHtml(formatDateTime(e.dateTime))}</td>
                      <td><strong>${escapeHtml(e.roll)}</strong></td>
                      <td>${escapeHtml(e.name)}</td>
                      <td>Year ${escapeHtml(e.year)}</td>
                      <td>${escapeHtml(e.hostel)}</td>
                      <td>${escapeHtml(e.room)}</td>
                      <td>${escapeHtml(formatDate(e.leaveDate))}</td>
                      <td>
                        <select class="status-select-badge ${bClass}"
                                data-action="updateStatus"
                                data-type="evacuation"
                                data-id="${escapeHtml(e.id)}"
                                data-roll="${escapeHtml(e.roll)}"
                                title="Click to update evacuation status">
                          <option value="Review" ${e.status === 'Review' ? 'selected' : ''}>Review</option>
                          <option value="Verified" ${e.status === 'Verified' ? 'selected' : ''}>Verified</option>
                          <option value="Declined" ${e.status === 'Declined' ? 'selected' : ''}>Declined</option>
                        </select>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    async 'Hostel Blocks'(viewOnly = false) {
      const [hostelsRes, meRes] = await Promise.all([
        Auth.api('/api/hostels'),
        viewOnly ? Auth.api('/api/me') : Promise.resolve({})
      ]);
      let hostels = hostelsRes.hostels || [
        { block_id: 'SAB_B_03', name: 'Sabari', for_gender: 'Male', floors: 3, seater: 2, capacity: 150 },
        { block_id: 'IND_B_03', name: 'Indravathi', for_gender: 'Male', floors: 4, seater: 2, capacity: 200 },
        { block_id: 'NAG_B_02', name: 'Nagavalli', for_gender: 'Male', floors: 3, seater: 2, capacity: 150 },
        { block_id: 'KRI_G_01', name: 'Krishna', for_gender: 'Female', floors: 4, seater: 3, capacity: 220 }
      ];
      if (viewOnly) {
        const assigned = meRes.user?.blocks || [];
        const assignedIds = new Set(assigned.map(b => String(b.block_id || '').toLowerCase()).filter(Boolean));
        const assignedNames = new Set(assigned.map(b => String(b.name || '').toLowerCase()).filter(Boolean));
        hostels = hostels.filter(h => assignedIds.has(String(h.block_id || '').toLowerCase()) || assignedNames.has(String(h.name || '').toLowerCase()));
      }

      return `
        <div class="ct-page-view">
          <div class="ct-heading ct-flex-between">
            <h1>Hostel Blocks</h1>
            ${viewOnly ? '' : `<div class="admin-header-actions">
              <button class="admin-btn-primary" type="button" data-action="openAddHostelModal">+ Add Hostel Block</button>
            </div>`}
          </div>

          <!-- Add / Edit Hostel Block Modal -->
          ${viewOnly ? '' : `<section class="complaint-modal" id="hostelBlockModal" hidden>
            <div class="complaint-dialog" style="max-width:540px;">
              <button class="complaint-back" type="button" data-action="closeHostelBlockModal" aria-label="Back">←</button>
              <h2 id="hostelModalTitle" style="margin:0 0 16px 0; font-size:18px;">Add New Hostel Block</h2>
              <form id="hostelBlockForm" class="complaint-form">
                <input type="hidden" id="hostelModalMode" value="add" />
                <input type="hidden" id="hostelOriginalId" value="" />

                <label for="modalHostelName">Hostel Block Name</label>
                <input id="modalHostelName" type="text" placeholder="e.g. Tungabhadra" required style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:8px; margin-bottom:12px;" />

                <label for="modalHostelGender">Hostel For (Gender)</label>
                <select id="modalHostelGender" required style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:8px; margin-bottom:12px;">
                  <option value="Male">Male (Boys Hostel)</option>
                  <option value="Female">Female (Girls Hostel)</option>
                </select>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
                  <div>
                    <label for="modalHostelFloors">Total Floors</label>
                    <input id="modalHostelFloors" type="number" min="1" max="10" value="3" required style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:8px;" />
                  </div>
                  <div>
                    <label for="modalHostelSeater">Room Seater Type</label>
                    <select id="modalHostelSeater" required style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:8px;">
                      <option value="1">1-Seater</option>
                      <option value="2" selected>2-Seater</option>
                      <option value="3">3-Seater</option>
                      <option value="4">4-Seater</option>
                    </select>
                  </div>
                </div>

                <label for="modalHostelCapacity">Total Student Capacity</label>
                <input id="modalHostelCapacity" type="number" min="10" max="1000" value="150" required style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:8px; margin-bottom:14px;" />

                <label style="font-weight:600; margin-bottom:6px; display:block;">Eligibility Year (Allowed Student Academic Years)</label>
                <div style="display:flex; gap:16px; margin-bottom:16px; flex-wrap:wrap; background:#f8fafc; padding:10px 14px; border:1px solid #d1d5db; border-radius:8px;">
                  <label style="display:inline-flex; align-items:center; gap:6px; font-weight:500; cursor:pointer; font-size:13px;">
                    <input type="checkbox" name="modalHostelYear" value="1" /> 1st Year
                  </label>
                  <label style="display:inline-flex; align-items:center; gap:6px; font-weight:500; cursor:pointer; font-size:13px;">
                    <input type="checkbox" name="modalHostelYear" value="2" /> 2nd Year
                  </label>
                  <label style="display:inline-flex; align-items:center; gap:6px; font-weight:500; cursor:pointer; font-size:13px;">
                    <input type="checkbox" name="modalHostelYear" value="3" /> 3rd Year
                  </label>
                  <label style="display:inline-flex; align-items:center; gap:6px; font-weight:500; cursor:pointer; font-size:13px;">
                    <input type="checkbox" name="modalHostelYear" value="4" /> 4th Year
                  </label>
                </div>

                <button class="primary-button" id="hostelModalSubmitBtn" type="submit">SAVE HOSTEL BLOCK</button>
              </form>
            </div>
          </section>`}

          <div class="ct-cards-grid">
            ${hostels.map(h => `
              <article class="ct-card">
                <div class="ct-card-header-flex">
                  <div class="ct-card-title-group">
                    <h3 class="ct-card-title">${escapeHtml(h.name)} Hall of Residence</h3>
                    <span class="ct-card-subdate">${escapeHtml(h.for_gender)} Hostel</span>
                  </div>
                  <span class="ct-badge badge-verified">Active</span>
                </div>
                <div class="ct-inner-box">
                  <p class="ct-inner-text">
                    • <strong>Floors:</strong> ${h.floors} Floors<br>
                    • <strong>Room Type:</strong> ${h.seater}-Seater Configuration<br>
                    • <strong>Capacity:</strong> ${h.capacity} Students Total<br>
                    • <strong>Eligibility Year:</strong> ${h.years && h.years.length ? h.years.map(y => `Year ${y}`).join(', ') : 'All Years'}
                  </p>
                  ${viewOnly ? '' : `<div style="display:flex; gap:8px; margin-top:12px; border-top:1px solid #e2e8f0; padding-top:10px;">
                    <button class="admin-btn-secondary" style="flex:1; padding:6px 10px; font-size:12px;" type="button"
                            data-action="openEditHostelModal"
                            data-id="${escapeHtml(h.block_id)}"
                            data-name="${escapeHtml(h.name)}"
                            data-gender="${escapeHtml(h.for_gender || 'Male')}"
                            data-floors="${h.floors || 3}"
                            data-seater="${h.seater || 2}"
                            data-capacity="${h.capacity || 150}"
                            data-years="${escapeHtml(JSON.stringify(h.years || []))}">✏️ Edit</button>
                    <button class="admin-btn-secondary" style="flex:1; padding:6px 10px; font-size:12px; color:#dc2626; border-color:#fca5a5;" type="button"
                            data-action="deleteHostelBlock"
                            data-id="${escapeHtml(h.block_id)}"
                            data-name="${escapeHtml(h.name)}">🗑️ Remove</button>
                  </div>`}
                </div>
              </article>
            `).join('')}
          </div>
        </div>
      `;
    },

    async 'Contact Us'() {
      const cRes = await Auth.api('/api/contacts');
      const contacts = cRes.contacts || {};
      const cw = contacts.chiefWarden || {};
      const ho = contacts.hostelOffice || {};
      const em = contacts.emergency || {};

      return `
        <div class="ct-page-view">
          <div class="ct-heading ct-flex-between">
            <h1>Contact Us Dashboard</h1>
            <div class="admin-header-actions">
              <button class="admin-btn-primary" type="button" data-action="openEditContactsModal">✏️ Edit Contacts</button>
            </div>
          </div>

          <!-- Edit Contacts Modal -->
          <section class="complaint-modal" id="editContactsModal" hidden>
            <div class="complaint-dialog" style="max-width:620px;">
              <button class="complaint-back" type="button" data-action="closeEditContactsModal" aria-label="Back">←</button>
              <h2 style="margin:0 0 16px 0; font-size:18px;">Edit Contact Us Credentials & Details</h2>
              <form id="editContactsForm" class="complaint-form">
                <h3 style="font-size:14.5px; color:#0f172a; margin:10px 0 8px 0; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">1. Chief Warden Office</h3>
                <label for="cwName">Chief Warden Name</label>
                <input id="cwName" type="text" value="${escapeHtml(cw.name || '')}" required style="width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:8px; margin-bottom:8px;" />
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:8px;">
                  <div>
                    <label for="cwPhone">Phone</label>
                    <input id="cwPhone" type="text" value="${escapeHtml(cw.phone || '')}" required style="width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:8px;" />
                  </div>
                  <div>
                    <label for="cwEmail">Email</label>
                    <input id="cwEmail" type="email" value="${escapeHtml(cw.email || '')}" required style="width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:8px;" />
                  </div>
                </div>
                <label for="cwOffice">Office Location</label>
                <input id="cwOffice" type="text" value="${escapeHtml(cw.office || '')}" style="width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:8px; margin-bottom:12px;" />

                <h3 style="font-size:14.5px; color:#0f172a; margin:10px 0 8px 0; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">2. Hostel Office Helpdesk</h3>
                <label for="hoName">Hostel Office Title / Incharge</label>
                <input id="hoName" type="text" value="${escapeHtml(ho.name || '')}" required style="width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:8px; margin-bottom:8px;" />
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:8px;">
                  <div>
                    <label for="hoPhone">Phone</label>
                    <input id="hoPhone" type="text" value="${escapeHtml(ho.phone || '')}" required style="width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:8px;" />
                  </div>
                  <div>
                    <label for="hoEmail">Email</label>
                    <input id="hoEmail" type="email" value="${escapeHtml(ho.email || '')}" required style="width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:8px;" />
                  </div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
                  <div>
                    <label for="hoHours">Office Hours</label>
                    <input id="hoHours" type="text" value="${escapeHtml(ho.hours || '')}" style="width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:8px;" />
                  </div>
                  <div>
                    <label for="hoLocation">Office Location</label>
                    <input id="hoLocation" type="text" value="${escapeHtml(ho.location || '')}" style="width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:8px;" />
                  </div>
                </div>

                <h3 style="font-size:14.5px; color:#0f172a; margin:10px 0 8px 0; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">3. Emergency & Caretaker Helplines</h3>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:8px;">
                  <div>
                    <label for="emAmbulance">Medical / Ambulance</label>
                    <input id="emAmbulance" type="text" value="${escapeHtml(em.ambulance || '')}" style="width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:8px;" />
                  </div>
                  <div>
                    <label for="emSecurity">Security Gate</label>
                    <input id="emSecurity" type="text" value="${escapeHtml(em.security || '')}" style="width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:8px;" />
                  </div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">
                  <div>
                    <label for="emSabari">Sabari Caretaker</label>
                    <input id="emSabari" type="text" value="${escapeHtml(em.sabari || '')}" style="width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:8px;" />
                  </div>
                  <div>
                    <label for="emIndravathi">Indravathi Caretaker</label>
                    <input id="emIndravathi" type="text" value="${escapeHtml(em.indravathi || '')}" style="width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:8px;" />
                  </div>
                </div>

                <button class="primary-button" type="submit">SAVE CONTACT CREDENTIALS</button>
              </form>
            </div>
          </section>

          <div class="ct-cards-grid">
            <article class="ct-card">
              <h3 class="ct-card-title">Chief Warden Office</h3>
              <div class="ct-inner-box">
                <p class="ct-inner-text">
                  <strong>${escapeHtml(cw.name || 'Dr. G. Rajesh')}</strong><br>
                  ${escapeHtml(cw.role || 'Chief Warden & Associate Professor')}<br>
                  • <strong>Phone:</strong> ${escapeHtml(cw.phone || '+91 8818 252 001')}<br>
                  • <strong>Email:</strong> ${escapeHtml(cw.email || 'chiefwarden@nitandhra.ac.in')}<br>
                  • <strong>Office:</strong> ${escapeHtml(cw.office || 'Administrative Building, Room 104')}
                </p>
                <div class="ct-inner-footer">
                  <span class="ct-signature">Hostel Administration</span>
                </div>
              </div>
            </article>

            <article class="ct-card">
              <h3 class="ct-card-title">Hostel Office Helpdesk</h3>
              <div class="ct-inner-box">
                <p class="ct-inner-text">
                  <strong>${escapeHtml(ho.name || 'Central Hostel Office Helpdesk')}</strong><br>
                  • <strong>Phone:</strong> ${escapeHtml(ho.phone || '+91 8818 252 002')}<br>
                  • <strong>Email:</strong> ${escapeHtml(ho.email || 'hosteloffice@nitandhra.ac.in')}<br>
                  • <strong>Hours:</strong> ${escapeHtml(ho.hours || 'Monday to Saturday (9:00 AM - 5:30 PM)')}<br>
                  • <strong>Location:</strong> ${escapeHtml(ho.location || 'Central Hostel Office Block')}
                </p>
                <div class="ct-inner-footer">
                  <span class="ct-signature">Hostel Office</span>
                </div>
              </div>
            </article>

            <article class="ct-card">
              <h3 class="ct-card-title">Emergency & Caretakers</h3>
              <div class="ct-inner-box">
                <p class="ct-inner-text">
                  • <strong>Ambulance:</strong> ${escapeHtml(em.ambulance || '+91 98888 11111')}<br>
                  • <strong>Security Gate:</strong> ${escapeHtml(em.security || '+91 98765 00000')}<br>
                  • <strong>Sabari Block:</strong> ${escapeHtml(em.sabari || '+91 9988776601')}<br>
                  • <strong>Indravathi Block:</strong> ${escapeHtml(em.indravathi || '+91 9988776602')}<br>
                  • <strong>Nagavalli Block:</strong> ${escapeHtml(em.nagavalli || '+91 9988776603')}<br>
                  • <strong>Krishna Block:</strong> ${escapeHtml(em.krishna || '+91 9988776604')}
                </p>
                <div class="ct-inner-footer">
                  <span class="ct-signature">NIT Andhra Pradesh</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      `;
    }
};
