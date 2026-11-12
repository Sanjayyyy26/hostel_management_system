/* Caretaker page renderers */
window.PageTemplates = window.PageTemplates || {};
window.PageTemplates.caretaker = {
    async Dashboard() {
      const [compRes, mntRes, outRes, annRes, meRes] = await Promise.all([
        Auth.api('/api/complaints'),
        Auth.api('/api/maintenance'),
        Auth.api('/api/outings'),
        Auth.api('/api/announcements'),
        Auth.api('/api/me')
      ]);

      const allComplaints = compRes.complaints || [];
      const allOutings = outRes.outings || [];
      const announcements = annRes.announcements || [];
      const user = meRes.user || {};
      const ctBlocks = (user.blocks || []).map(b => (b.name || '').toLowerCase());
      const ctBlockIds = (user.blocks || []).map(b => (b.block_id || '').toUpperCase());

      const outings = allOutings.filter(o => {
        if (!ctBlocks.length && !ctBlockIds.length) return true;
        if (o.block_id && ctBlockIds.includes(String(o.block_id).toUpperCase())) return true;
        if (o.hostel_name && ctBlocks.some(b => o.hostel_name.toLowerCase().includes(b) || b.includes(o.hostel_name.toLowerCase()))) return true;
        return false;
      });

      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const complaints = allComplaints.filter(c => {
        const isResolved = Boolean(c.status) && String(c.status) !== 'false' && String(c.status) !== '0';
        if (isResolved) {
          const compDate = c.resolved_at || c.date;
          if (compDate) {
            const d = new Date(compDate);
            if (!isNaN(d.getTime()) && (now - d.getTime()) > threeDaysMs) return false;
          }
        }
        if (!ctBlocks.length && !ctBlockIds.length) return true;
        if (c.block_id && ctBlockIds.includes(String(c.block_id).toUpperCase())) return true;
        if (c.hostel_name && ctBlocks.some(b => c.hostel_name.toLowerCase().includes(b) || b.includes(c.hostel_name.toLowerCase()))) return true;
        return false;
      });

      // Items matching UI design (Image 1)
      const comp1 = complaints[0] || {
        complaint: 'No drinking water in Sabari.\nPoor maintaince\nNo cleaning',
        votes: 12
      };
      const comp2 = complaints[1] || comp1;

      const out1 = outings[0] || {
        purpose: 'Your non local outing is accepted.\nPlease get the acknowledgement and you are done to go with your outing.',
        signature: 'Sabari - G30 - 424001'
      };
      const out2 = outings[1] || {
        purpose: 'Your non local outing is accepted.\nPlease get the acknowledgement and you are done to go with your outing.',
        signature: 'Sabari Caretaker'
      };

      const ann1 = announcements[0] || {
        announcement: 'Please collect your special dinner tokens at your respected hostel blocks from the caretaker.',
        author: 'Hostel Office'
      };
      const ann2 = announcements[1] || ann1;

      return `
        <div class="ct-page-view">
          <div class="ct-heading">
            <h1>Dashboard</h1>
          </div>
          <div class="ct-cards-grid">
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

            <!-- Card 2: Non Local Outing Requests -->
            <article class="ct-card" data-page-card="Non Local Outing" role="button" tabindex="0">
              <h3 class="ct-card-title">Non Local Outing Requests</h3>
              <div class="ct-inner-box">
                <p class="ct-inner-text">${escapeHtml(out1.purpose || '').replace(/\n/g, '<br>')}</p>
                <div class="ct-inner-footer">
                  <span class="ct-signature">${escapeHtml(out1.signature || (out1.block_name ? `${out1.block_name} - ${out1.room_number || 'Room'} - ${out1.roll_number || '424001'}` : 'Sabari - G30 - 424001'))}</span>
                </div>
              </div>
            </article>

            <!-- Card 3: New Announcement -->
            <article class="ct-card" data-page-card="Announcements" role="button" tabindex="0">
              <h3 class="ct-card-title">New Announcement</h3>
              <div class="ct-inner-box">
                <p class="ct-inner-text">${escapeHtml(ann1.announcement || '').replace(/\n/g, '<br>')}</p>
                <div class="ct-inner-footer">
                  <span class="ct-signature">${escapeHtml(ann1.author || 'Hostel Office')}</span>
                </div>
              </div>
            </article>

            <!-- Card 4: Review Complaints -->
            <article class="ct-card" data-page-card="Complaints" role="button" tabindex="0">
              <h3 class="ct-card-title">Review Complaints</h3>
              <div class="ct-inner-box">
                <p class="ct-inner-text">${escapeHtml(comp2.complaint || comp1.complaint || '').replace(/\n/g, '<br>')}</p>
                <div class="ct-inner-footer">
                  <span class="ct-star-vote">☆ ${comp2.votes ?? 12} votes</span>
                </div>
              </div>
            </article>

            <!-- Card 5: Non Local Outing -->
            <article class="ct-card" data-page-card="Non Local Outing" role="button" tabindex="0">
              <h3 class="ct-card-title">Non Local Outing</h3>
              <div class="ct-inner-box">
                <p class="ct-inner-text">${escapeHtml(out2.purpose || out1.purpose || '').replace(/\n/g, '<br>')}</p>
                <div class="ct-inner-footer">
                  <span class="ct-signature">${escapeHtml(out2.signature || 'Sabari Caretaker')}</span>
                </div>
              </div>
            </article>

            <!-- Card 6: New Announcement -->
            <article class="ct-card" data-page-card="Announcements" role="button" tabindex="0">
              <h3 class="ct-card-title">New Announcement</h3>
              <div class="ct-inner-box">
                <p class="ct-inner-text">${escapeHtml(ann2.announcement || ann1.announcement || '').replace(/\n/g, '<br>')}</p>
                <div class="ct-inner-footer">
                  <span class="ct-signature">${escapeHtml(ann2.author || 'Hostel Office')}</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      `;
    },

    async Announcements() {
      const [annRes, meRes] = await Promise.all([
        Auth.api('/api/announcements'),
        Auth.api('/api/me')
      ]);
      const announcements = annRes.announcements || [];
      const blocks = meRes.user?.blocks || [];

      const defaultCards = [
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
            <button class="ct-btn-primary" type="button" data-action="openAnnouncementForm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Announcement
            </button>
          </div>

          <section class="complaint-modal" id="announcementComposer" aria-labelledby="annFormTitle" hidden>
            <div class="complaint-dialog">
              <button class="complaint-back" type="button" data-action="closeAnnouncementForm" aria-label="Back">←</button>
              <h2 id="annFormTitle">Post Announcement</h2>
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
            }).join('') : defaultCards.map(d => `
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
      const [res, meRes] = await Promise.all([
        Auth.api('/api/complaints'),
        Auth.api('/api/me')
      ]);
      const allComplaints = res.complaints || [];
      const user = meRes.user || {};
      const ctBlocks = (user.blocks || []).map(b => (b.name || '').toLowerCase());
      const ctBlockIds = (user.blocks || []).map(b => (b.block_id || '').toUpperCase());

      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const complaints = allComplaints.filter(c => {
        const isResolved = Boolean(c.status) && String(c.status) !== 'false' && String(c.status) !== '0';
        if (isResolved) {
          const compDate = c.resolved_at || c.date;
          if (compDate) {
            const d = new Date(compDate);
            if (!isNaN(d.getTime()) && (now - d.getTime()) > threeDaysMs) return false;
          }
        }
        if (!ctBlocks.length && !ctBlockIds.length) return true;
        if (c.block_id && ctBlockIds.includes(String(c.block_id).toUpperCase())) return true;
        if (c.hostel_name && ctBlocks.some(b => c.hostel_name.toLowerCase().includes(b) || b.includes(c.hostel_name.toLowerCase()))) return true;
        return false;
      });

      const defaultComplaints = [
        {
          id: 'CMP_1',
          title: 'No Cleaning',
          dateAgo: '2 days ago',
          status: 'In Progress',
          text: 'It\'s been 3 days since no cleaning has done to our rooms.',
          votes: 5
        },
        {
          id: 'CMP_2',
          title: 'Non Local Outing',
          dateAgo: '1 week ago',
          status: 'In Progress',
          text: 'No non local outing for students who hasn\'t applied to it.',
          votes: 0
        },
        {
          id: 'CMP_3',
          title: 'Power Shutdown',
          dateAgo: '2 months ago',
          status: 'Done',
          text: 'Dear Students, This is to inform you that there will be a power shut-down on 14 August 2026 from 9:00 AM to 5:00 PM',
          votes: 2
        }
      ];

      return `
        <div class="ct-page-view">
          <div class="ct-heading ct-flex-between">
            <h1>Complaints</h1>
            <div class="ct-filter-dropdown-wrap">
              <select class="ct-filter-select" id="ctComplaintsFilter">
                <option value="all">All</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div class="ct-cards-grid" id="ctComplaintsGrid">
            ${complaints.length ? complaints.map(c => {
              const isResolved = Boolean(c.status) && String(c.status) !== 'false' && String(c.status) !== '0';
              const statusText = isResolved ? 'Done' : 'In Progress';
              const statusClass = isResolved ? 'badge-done' : 'badge-progress';
              const parts = String(c.complaint || '').split('\n\n');
              const title = parts.length > 1 ? parts[0] : (c.complaint?.slice(0, 30) || 'Complaint');
              const text = parts.length > 1 ? parts.slice(1).join('\n\n') : c.complaint;
              return `
                <article class="ct-card ct-complaint-card" data-status="${isResolved ? 'done' : 'in_progress'}" data-id="${escapeHtml(c.complaint_id)}">
                  <div class="ct-card-header-flex">
                    <div class="ct-card-title-group">
                      <h3 class="ct-card-title">${escapeHtml(title)}</h3>
                      <span class="ct-card-subdate">${escapeHtml(formatDate(c.date))}${c.time ? ' ' + escapeHtml(formatTime(c.time)) : ''}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <button class="ct-badge ${statusClass}" type="button" data-action="toggleComplaint" data-id="${escapeHtml(c.complaint_id)}" data-next-status="${!isResolved}" title="Click to mark as ${isResolved ? 'In Progress' : 'Done'}">${statusText}</button>
                      <button class="delete-btn" type="button" data-action="deleteComplaint" data-id="${escapeHtml(c.complaint_id)}" title="Delete Complaint" style="background:#fee2e2; border:none; color:#dc2626; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600; display:inline-flex; align-items:center; gap:4px;">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
                        Delete
                      </button>
                    </div>
                  </div>
                  <div class="ct-inner-box">
                    <p class="ct-inner-text">${escapeHtml(text || '')}</p>
                    <div class="ct-inner-footer">
                      <span class="ct-star-vote">☆ ${c.votes || 0} votes</span>
                    </div>
                  </div>
                </article>
              `;
            }).join('') : `
              <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: #888; background: #fff; border-radius: 12px; border: 1px dashed #ddd;">
                <p style="font-size: 16px; margin: 0;">No complaints registered yet.</p>
              </div>
            `}
          </div>
        </div>
      `;
    },

    async Maintenance() {
      const res = await Auth.api('/api/maintenance');
      const records = res.maintenance || [];

      const defaultGroups = [
        {
          date: '08 / 09 / 2026',
          rows: [
            { room: 'S12', time: '9:59 AM', cleaning: true, moping: false, remarks: 'None' },
            { room: 'G30', time: '9:00 AM', cleaning: true, moping: false, remarks: 'None' },
            { room: 'F16', time: '2:15 PM', cleaning: true, moping: true, remarks: 'None' },
            { room: 'G32', time: '12:20 PM', cleaning: true, moping: false, remarks: 'None' }
          ]
        },
        {
          date: '06 / 09 / 2026',
          rows: [
            { room: 'S12', time: '9:59 AM', cleaning: true, moping: false, remarks: 'None' },
            { room: 'G30', time: '9:00 AM', cleaning: true, moping: false, remarks: 'None' }
          ]
        }
      ];

      return `
        <div class="ct-page-view">
          <div class="ct-heading">
            <h1>Maintenance Records</h1>
          </div>

          <div class="ct-maintenance-container">
            ${records.length ? `
              <div class="ct-maintenance-group">
                <h3 class="ct-date-header">${formatDate(new Date())}</h3>
                <table class="ct-maintenance-table">
                  <thead>
                    <tr>
                      <th>Room No.</th>
                      <th>Time</th>
                      <th>Cleaning</th>
                      <th>Moping</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${records.map(r => `
                      <tr>
                        <td><strong>${escapeHtml(r.room_number || r.room_id || 'Room')}</strong></td>
                        <td>${escapeHtml(formatTime(r.time))}</td>
                        <td><span class="ct-status-icon ${r.cleaning_status ? 'check' : 'cross'}">${r.cleaning_status ? '✓' : '✕'}</span></td>
                        <td><span class="ct-status-icon ${r.moping_status ? 'check' : 'cross'}">${r.moping_status ? '✓' : '✕'}</span></td>
                        <td>${escapeHtml(r.remarks || 'None')}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : defaultGroups.map(g => `
              <div class="ct-maintenance-group">
                <h3 class="ct-date-header">${escapeHtml(formatDate(g.date))}</h3>
                <table class="ct-maintenance-table">
                  <thead>
                    <tr>
                      <th>Room No.</th>
                      <th>Time</th>
                      <th>Cleaning</th>
                      <th>Moping</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${g.rows.map(r => `
                      <tr>
                        <td><strong>${escapeHtml(r.room)}</strong></td>
                        <td>${escapeHtml(formatTime(r.time))}</td>
                        <td><span class="ct-status-icon ${r.cleaning ? 'check' : 'cross'}">${r.cleaning ? '✓' : '✕'}</span></td>
                        <td><span class="ct-status-icon ${r.moping ? 'check' : 'cross'}">${r.moping ? '✓' : '✕'}</span></td>
                        <td>${escapeHtml(r.remarks)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    },

    async 'Non Local Outing'() {
      const [res, meRes] = await Promise.all([
        Auth.api('/api/outings'),
        Auth.api('/api/me')
      ]);
      const allOutings = res.outings || [];
      const user = meRes.user || {};
      const ctBlocks = (user.blocks || []).map(b => (b.name || '').toLowerCase());
      const ctBlockIds = (user.blocks || []).map(b => (b.block_id || '').toUpperCase());

      // Filter strictly to assigned hostel block students only
      const outings = allOutings.filter(o => {
        if (!ctBlocks.length && !ctBlockIds.length) return true;
        if (o.block_id && ctBlockIds.includes(String(o.block_id).toUpperCase())) return true;
        if (o.hostel_name && ctBlocks.some(b => o.hostel_name.toLowerCase().includes(b) || b.includes(o.hostel_name.toLowerCase()))) return true;
        return false;
      });

      const defaultOutings = [
        {
          id: '1',
          roll: '424001',
          dateAgo: '2 days ago',
          status: 'In Progress',
          createdDate: '06 Oct 2026',
          appliedDate: '10/09/2026',
          time: '03:34 PM',
          from: '12/09/2026',
          to: '14/09/2026',
          reason: 'Non local outing to go home for Vinayaka Chavithi',
          parentPhone: '9988776655'
        },
        {
          id: '2',
          roll: '524001',
          dateAgo: '2 min ago',
          status: 'In Progress',
          createdDate: '06 Oct 2026',
          appliedDate: '18/09/2026',
          time: '08:14 PM',
          from: '12/09/2026',
          to: '20/09/2026',
          reason: 'Non local outing to go home for vacation.',
          parentPhone: '9988176918'
        }
      ];

      return `
        <div class="ct-page-view">
          <div class="ct-heading ct-flex-between">
            <h1>Non Local Requests</h1>
            <div class="ct-filter-dropdown-wrap">
              <select class="ct-filter-select" id="ctOutingsFilter">
                <option value="all">All</option>
                <option value="in_progress">In Progress</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>

          <div class="ct-cards-grid ct-requests-grid" id="ctOutingsGrid">
            ${outings.length ? outings.map(o => {
              const isApproved = o.status === true || o.status === 'true' || o.status === 'approved' || o.status === 'Approved';
              const isPending = o.status === null || o.status === undefined || o.status === '' || o.status === 'in_progress' || o.status === 'Pending' || o.status === 'In Progress';
              const statusText = isPending ? 'In Progress' : (isApproved ? 'Approved' : 'Rejected');
              const statusClass = isPending ? 'badge-progress' : (isApproved ? 'badge-done' : 'badge-rejected');
              return `
                <article class="ct-card ct-request-card"
                  data-outing-card="true"
                  data-id="${escapeHtml(o.outing_id || o.id)}"
                  data-roll="${escapeHtml(o.roll_number || '424001')}"
                  data-created-date="${escapeHtml(formatDate(o.created_date || o.date))}"
                  data-date-ago="${escapeHtml(o.date_ago || 'Recent')}"
                  data-applied-date="${escapeHtml(formatDate(o.date))}"
                  data-time="${escapeHtml(formatTime(o.time))}"
                  data-from="${escapeHtml(formatDate(o.from_date))}"
                  data-to="${escapeHtml(formatDate(o.to_date))}"
                  data-purpose="${escapeHtml(o.purpose || 'Non local outing')}"
                  data-phone="${escapeHtml(o.parent_ph_no || '-')}"
                  data-status="${isPending ? 'in_progress' : (isApproved ? 'approved' : 'rejected')}"
                  data-status-text="${statusText}"
                  role="button" tabindex="0">
                  <div class="ct-card-header-flex">
                    <div class="ct-card-title-group">
                      <h3 class="ct-card-title">${escapeHtml(o.roll_number || '424001')}</h3>
                      <span class="ct-card-subdate">${escapeHtml(o.date_ago || 'Recent')}</span>
                    </div>
                    <span class="ct-badge ${statusClass}">${statusText}</span>
                  </div>

                  <div class="ct-tags-row">
                    <span class="ct-pill">${escapeHtml(o.roll_number || '424001')}</span>
                    <span class="ct-pill">${escapeHtml(formatDate(o.date))}</span>
                    <span class="ct-pill">${escapeHtml(formatTime(o.time))}</span>
                  </div>

                  <div class="ct-dates-row">
                    <span class="ct-pill date-pill">From ${escapeHtml(formatDate(o.from_date))}</span>
                    <span class="ct-pill date-pill">To ${escapeHtml(formatDate(o.to_date))}</span>
                  </div>

                  <div class="ct-reason-box">
                    <p>${escapeHtml(o.purpose || '')}</p>
                  </div>

                  <div class="ct-phone-box">
                    <small>Parent Phone Number</small>
                    <strong>${escapeHtml(o.parent_ph_no || '9988776655')}</strong>
                  </div>
                </article>
              `;
            }).join('') : `
              <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: #888; background: #fff; border-radius: 12px; border: 1px dashed #ddd;">
                <p style="font-size: 16px; margin: 0;">No outing requests found.</p>
              </div>
            `}
          </div>

          <!-- NON LOCAL REQUEST DETAILS MODAL (UI DESIGN) -->
          <div class="ct-modal-backdrop" id="ctOutingModal" aria-hidden="true">
            <div class="ct-modal-window" role="dialog" aria-modal="true">
              <div class="ct-modal-header">
                <button class="ct-btn-back" id="ctModalBackBtn" type="button">
                  ← Go Back
                </button>
                <span class="ct-modal-badge badge-progress" id="ctModalBadge">In Progress</span>
              </div>

              <div class="ct-modal-timestamps">
                <div class="ct-modal-date-main" id="ctModalDateMain">06 Oct 2026</div>
                <div class="ct-modal-date-ago" id="ctModalDateAgo">2 days ago</div>
              </div>

              <div class="ct-modal-body-card">
                <div class="ct-form-row-3">
                  <div class="ct-gray-box">
                    <span class="ct-gray-box-label">Roll Number</span>
                    <span class="ct-gray-box-val" id="ctModalRoll">424001</span>
                  </div>
                  <div class="ct-gray-box">
                    <span class="ct-gray-box-label">Date</span>
                    <span class="ct-gray-box-val" id="ctModalDate">10/09/2026</span>
                  </div>
                  <div class="ct-gray-box">
                    <span class="ct-gray-box-label">Time</span>
                    <span class="ct-gray-box-val" id="ctModalTime">03:34 PM</span>
                  </div>
                </div>

                <div class="ct-form-row-2">
                  <div class="ct-gray-box">
                    <span class="ct-gray-box-label">From</span>
                    <span class="ct-gray-box-val" id="ctModalFrom">12/09/2026</span>
                  </div>
                  <div class="ct-gray-box">
                    <span class="ct-gray-box-label">To</span>
                    <span class="ct-gray-box-val" id="ctModalTo">14/09/2026</span>
                  </div>
                </div>

                <div class="ct-gray-box purpose-box full-width">
                  <span class="ct-gray-box-label">Purpose</span>
                  <span class="ct-gray-box-val" id="ctModalPurpose">Non local outing to go home for Vinayaka Chavithi</span>
                </div>

                <div class="ct-gray-box half-width">
                  <span class="ct-gray-box-label">Parent Phone Number</span>
                  <span class="ct-gray-box-val" id="ctModalPhone">9988776655</span>
                </div>
              </div>

              <div class="ct-modal-footer">
                <button class="ct-btn-allow" id="ctModalAllowBtn" type="button" data-outing-id="1">
                  ALLOW
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    async 'Room Inspection'() {
      const res = await Auth.api('/api/inspection');
      const rooms = res.rooms || [];

      return `
        <div class="ct-page-view">
          <div class="ct-heading">
            <h1>Room Inspection</h1>
          </div>
          <section class="maintenance-table-wrap">
            <table class="maintenance-table">
              <thead>
                <tr>
                  <th>Room Number</th>
                  <th>Hostel</th>
                  <th>Floor</th>
                  <th>Occupants</th>
                </tr>
              </thead>
              <tbody>
                ${rooms.length ? rooms.map(r => `
                  <tr>
                    <td><strong>Room ${r.room_number}</strong></td>
                    <td>${escapeHtml(r.hostel_name)}</td>
                    <td>Floor ${r.floor_number}</td>
                    <td>
                      ${Array.isArray(r.students) && r.students.length > 0
                        ? r.students.map(s => `<div>${escapeHtml(s.name)} (Roll: ${s.roll}) - 📞 ${escapeHtml(s.phone)}</div>`).join('')
                        : '<em style="color:#888;">Vacant</em>'}
                    </td>
                  </tr>
                `).join('') : '<tr><td colspan="4" style="text-align:center; padding:20px; color:#888;">No rooms found.</td></tr>'}
              </tbody>
            </table>
          </section>
        </div>
      `;
    },

    async 'Student List'() {
      const res = await Auth.api('/api/students');
      const students = res.students || [];

      return `
        <div class="ct-page-view">
          <div class="ct-heading">
            <h1>Student Directory</h1>
          </div>
          <section class="maintenance-table-wrap">
            <table class="maintenance-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Hostel & Room</th>
                  <th>Year</th>
                  <th>Phone</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                ${students.length ? students.map(s => `
                  <tr>
                    <td><strong>${s.roll_number}</strong></td>
                    <td>${escapeHtml(s.name)}</td>
                    <td>${escapeHtml(s.hostel_name || 'Unallocated')} ${s.room_number ? `(Room ${s.room_number})` : ''}</td>
                    <td>Year ${s.year}</td>
                    <td>${escapeHtml(s.phone_number)}</td>
                    <td>${escapeHtml(s.email)}</td>
                  </tr>
                `).join('') : '<tr><td colspan="6" style="text-align:center; padding:20px; color:#888;">No students found.</td></tr>'}
              </tbody>
            </table>
          </section>
        </div>
      `;
    },

    async 'Hostel Blocks'() {
      return PageTemplates.admin['Hostel Blocks'](true);
    }
};
