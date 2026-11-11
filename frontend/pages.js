/**
 * Dynamic Page Renderers for Hostellers
 * Fetches real data from PostgreSQL backend via Auth.api
 */

function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
}

// Standardized Date (DD/MM/YYYY) and Time (HH:MM:SS) formatters for all dashboards
function formatDate(value) {
  if (!value) return '-';
  const str = String(value).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;
  const ymdMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) return `${ymdMatch[3]}/${ymdMatch[2]}/${ymdMatch[1]}`;
  const d = new Date(value);
  if (isNaN(d.getTime())) return str;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTime(value) {
  if (!value) return '-';
  const str = String(value).trim();
  const hmsMatch = str.match(/^(\d{1,2}):(\d{2}):(\d{2})/);
  if (hmsMatch) {
    return `${hmsMatch[1].padStart(2, '0')}:${hmsMatch[2]}:${hmsMatch[3]}`;
  }
  const hmMatch = str.match(/^(\d{1,2}):(\d{2})/);
  if (hmMatch) {
    return `${hmMatch[1].padStart(2, '0')}:${hmMatch[2]}:00`;
  }
  const d = new Date(value);
  if (!isNaN(d.getTime())) {
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${mins}:${secs}`;
  }
  return str;
}

function formatDateTime(value) {
  if (!value) return '-';
  const str = String(value).trim();
  if (/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}$/.test(str)) return str;
  const parts = str.split(/[\s/T]+/);
  if (parts.length >= 2) {
    const datePart = formatDate(parts[0]);
    const timePart = formatTime(parts.slice(1).join(' '));
    return `${datePart} ${timePart}`;
  }
  const d = new Date(value);
  if (!isNaN(d.getTime())) {
    return `${formatDate(d)} ${formatTime(d)}`;
  }
  return str;
}

function pageCardAttributes(page = '') {
  if (!page) return '';
  return ` data-page-card="${escapeHtml(page)}" role="button" tabindex="0"`;
}

function noticeCard(item) {
  const hostels = Array.isArray(item.hostels) && item.hostels.length > 0
    ? item.hostels.join(', ')
    : 'All Hostels';
  return `
    <article class="notice-card">
      <div class="complaint-card-head">
        <h3>Announcement</h3>
        <span class="status-pill done" style="font-size: 11px;">${escapeHtml(hostels)}</span>
      </div>
      <small class="complaint-time">${formatDate(item.date)} ${formatTime(item.time)}</small>
      <div class="notice-paper">
        <p>${escapeHtml(item.announcement)}</p>
      </div>
    </article>
  `;
}

function complaintCard(item, canManage = false) {
  const isResolved = Boolean(item.status);
  const statusLabel = isResolved ? 'Resolved' : 'In Progress';
  const statusClass = isResolved ? 'done' : 'progress';
  const parts = String(item.complaint || '').split('\n\n');
  const title = parts.length > 1 ? parts[0] : (item.complaint?.slice(0, 30) || 'Complaint');
  const desc = parts.length > 1 ? parts.slice(1).join('\n\n') : item.complaint;
  const location = [item.hostel_name, item.room_number ? `Room ${item.room_number}` : ''].filter(Boolean).join(' • ');

  return `
    <article class="notice-card complaint-card">
      <div class="complaint-card-head">
        <div>
          <h3>${escapeHtml(title)}</h3>
          ${location ? `<small style="color:#666; font-size:12px; font-weight:700;">${escapeHtml(location)} ${item.student_name ? '• ' + escapeHtml(item.student_name) : ''}</small>` : ''}
        </div>
        <span class="status-pill ${statusClass}">${escapeHtml(statusLabel)}</span>
      </div>
      </div>
      <small class="complaint-time">${formatDate(item.date)} ${formatTime(item.time)}</small>
      <div class="notice-paper">
        <p>${escapeHtml(desc)}</p>
        <button class="vote-button ${item.has_voted ? 'voted' : ''}" 
                type="button" 
                data-action="voteComplaint" 
                data-id="${item.complaint_id}" 
                title="${item.has_voted ? 'Click to remove your vote' : 'Click to vote on this complaint'}">
          ${item.has_voted ? '★ Voted' : '☆ Vote'} (${item.votes || 0})
        </button>
      </div>
      ${canManage ? `
        <div style="margin-top: 14px; display: flex; justify-content: flex-end; gap: 8px;">
          <button class="add-button" style="height: 32px; padding: 0 12px; font-size: 12px; background: ${isResolved ? '#e10000' : '#08c21d'};"
                  type="button" data-action="toggleComplaint" data-id="${item.complaint_id}" data-next-status="${!isResolved}">
            ${isResolved ? 'Mark In Progress' : 'Mark Resolved'}
          </button>
        </div>
      ` : ''}
    </article>
  `;
}

function outingRow(item, canManage = false) {
  let statusText = 'Pending';
  let statusColor = '#d97706';
  let statusBg = '#fef3c7';

  if (item.status === true || item.status === 'true' || item.status === 'approved' || item.status === 'Approved') {
    statusText = 'Approved';
    statusColor = '#08c21d';
    statusBg = '#aef09f';
  } else if (item.status === false || item.status === 'false' || item.status === 'rejected' || item.status === 'Rejected') {
    statusText = 'Rejected';
    statusColor = '#e10000';
    statusBg = '#f49a9e';
  }

  const fromDate = formatDate(item.from_date);
  const toDate = formatDate(item.to_date);
  const displayName = canManage
    ? (item.student_name ? `${escapeHtml(item.student_name)} (${escapeHtml(item.roll_number)})` : 'Outing Request')
    : 'My Outing Request';

  return `
    <div class="request-row" style="display:flex; justify-content:space-between; align-items:flex-start; padding:16px; border-bottom:1px solid #e2e8f0;">
      <div>
        <strong>${displayName}</strong>
        <div style="font-size:13px; color:#475569; margin:4px 0;">
          <span><strong>From Date:</strong> ${escapeHtml(fromDate)}</span> | 
          <span><strong>To Date:</strong> ${escapeHtml(toDate)}</span> | 
          <span><strong>Parent Ph:</strong> ${escapeHtml(item.parent_ph_no)}</span>
        </div>
        <p style="margin:4px 0 0; font-size:13px; color:#334155; white-space:pre-line;"><strong>Purpose:</strong> ${escapeHtml(item.purpose)}</p>
      </div>
      <div style="text-align:right; flex-shrink:0; margin-left:14px;">
        <span class="status-pill" style="display:inline-block; background:${statusBg}; color:${statusColor};">${statusText}</span>
        ${canManage && item.status === null ? `
          <div style="margin-top:10px; display:flex; gap:6px;">
            <button class="add-button" style="height:28px; padding:0 10px; font-size:11px; background:#08c21d;"
                    type="button" data-action="updateOuting" data-id="${item.outing_id}" data-status="true">Approve</button>
            <button class="add-button" style="height:28px; padding:0 10px; font-size:11px; background:#e10000;"
                    type="button" data-action="updateOuting" data-id="${item.outing_id}" data-status="false">Reject</button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function maintenanceMark(value) {
  return `<span class="maintenance-mark ${value ? 'yes' : 'no'}">${value ? '✓' : '×'}</span>`;
}

function maintenanceRow(item) {
  const location = [item.hostel_name, item.room_number ? `Room ${item.room_number}` : ''].filter(Boolean).join(' • ');
  return `
    <tr>
      <td>${formatDate(item.date)}</td>
      <td>${formatTime(item.time)}</td>
      <td>${escapeHtml(location || item.room_id || '-')}</td>
      <td>${maintenanceMark(Boolean(item.cleaning_status))}</td>
      <td>${maintenanceMark(Boolean(item.moping_status))}</td>
      <td>${escapeHtml(item.remarks || 'None')}</td>
    </tr>
  `;
}

const PageTemplates = {
  // ================= STUDENT PAGES =================
  student: {
    async Dashboard() {
      const [annRes, compRes, outRes, mntRes, meRes] = await Promise.all([
        Auth.api('/api/announcements'),
        Auth.api('/api/complaints?mine=true'),
        Auth.api('/api/outings'),
        Auth.api('/api/maintenance'),
        Auth.api('/api/me')
      ]);

      const announcements = annRes.announcements || [];
      const complaints = compRes.complaints || [];
      const outings = outRes.outings || [];
      const maintenance = mntRes.maintenance || [];
      const student = meRes.user || {};

      const latestAnn = announcements[0]?.announcement || 'No new announcements.';
      const latestComp = complaints[0] ? `${complaints[0].complaint.slice(0, 60)}...` : 'No complaints submitted.';
      const latestOut = outings[0] ? `${outings[0].purpose.slice(0, 60)}` : 'No active outing requests.';
      const latestMnt = maintenance[0] ? `Cleaning: ${maintenance[0].cleaning_status ? 'Yes' : 'No'}, Remarks: ${maintenance[0].remarks}` : 'No maintenance records.';

      return `
        <div class="section-heading">
          <h2>Welcome back, ${escapeHtml(student.name || 'Student')}</h2>
          <p>${student.block ? `${escapeHtml(student.block)} • Room ${escapeHtml(student.room || 'Not Assigned')}` : 'No room allocated yet. Please visit Hostel Room Allocation.'}</p>
        </div>
        <section class="card-grid dashboard-cards">
          <article class="notice-card" data-page-card="Complaints" role="button" tabindex="0">
            <div class="complaint-card-head">
              <h3>Complaints (${complaints.length})</h3>
              <span class="status-pill progress">Active</span>
            </div>
            <div class="notice-paper">
              <p>${escapeHtml(latestComp)}</p>
              <small>Click to view & submit complaints</small>
            </div>
          </article>

          <article class="notice-card" data-page-card="Non Local Outing" role="button" tabindex="0">
            <div class="complaint-card-head">
              <h3>Outing Requests (${outings.length})</h3>
              <span class="status-pill done">Requests</span>
            </div>
            <div class="notice-paper">
              <p>${escapeHtml(latestOut)}</p>
              <small>Click to apply for outing</small>
            </div>
          </article>

          <article class="notice-card" data-page-card="Announcements" role="button" tabindex="0">
            <div class="complaint-card-head">
              <h3>Announcements (${announcements.length})</h3>
              <span class="status-pill done">Notice</span>
            </div>
            <div class="notice-paper">
              <p>${escapeHtml(latestAnn)}</p>
              <small>Click to view hostel circulars</small>
            </div>
          </article>

          <article class="notice-card" data-page-card="Maintenance" role="button" tabindex="0">
            <div class="complaint-card-head">
              <h3>Maintenance (${maintenance.length})</h3>
              <span class="status-pill progress">Logs</span>
            </div>
            <div class="notice-paper">
              <p>${escapeHtml(latestMnt)}</p>
              <small>Click to check cleaning status</small>
            </div>
          </article>

          <article class="notice-card" data-page-card="Hostel Room Allocation" role="button" tabindex="0">
            <div class="complaint-card-head">
              <h3>Room Details</h3>
              <span class="status-pill done">${student.room ? 'Allocated' : 'Unallocated'}</span>
            </div>
            <div class="notice-paper">
              <p>Block: ${escapeHtml(student.block || 'None')}\nRoom: ${escapeHtml(student.room || 'None')}</p>
              <small>Click to view or allocate room</small>
            </div>
          </article>

          <article class="notice-card" data-page-card="Hostel Blocks" role="button" tabindex="0">
            <div class="complaint-card-head">
              <h3>Hostel Blocks</h3>
              <span class="status-pill done">Campus</span>
            </div>
            <div class="notice-paper">
              <p>View all campus hostel blocks, floors, and capacities.</p>
              <small>Click to view details</small>
            </div>
          </article>
        </section>
      `;
    },

    async Announcements() {
      const res = await Auth.api('/api/announcements');
      const announcements = res.announcements || [];
      return `
        <div class="section-heading">
          <h2>Hostel Announcements</h2>
          <p>Official notices from hostel management</p>
        </div>
        <section class="card-grid">
          ${announcements.length ? announcements.map(noticeCard).join('') : '<p style="color:#666;">No announcements yet.</p>'}
        </section>
      `;
    },

    async Complaints() {
      const res = await Auth.api('/api/complaints');
      const allComplaints = res.complaints || [];

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
        return true;
      });

      return `
        <div class="page-toolbar">
          <div class="section-heading">
            <h2>Complaints</h2>
            <p>Report and track hostel issues</p>
          </div>
          <div class="toolbar-actions">
            <select id="complaintFilter" class="soft-select" aria-label="Complaint filter">
              <option value="all">All complaints</option>
              <option value="mine">My complaints</option>
            </select>
            <button class="add-button" type="button" data-action="openComplaintForm">+ Add Complaint</button>
          </div>
        </div>

        <section class="complaint-modal" id="complaintComposer" aria-labelledby="complaintFormTitle" hidden>
          <div class="complaint-dialog">
            <button class="complaint-back" type="button" data-action="closeComplaintForm" aria-label="Back">←</button>
            <h2 id="complaintFormTitle">New Complaint</h2>
            <form id="complaintForm" class="complaint-form">
              <label for="complaintTitle">Title</label>
              <input id="complaintTitle" type="text" placeholder="e.g. Water Leakage in Washroom" required />

              <label for="complaintDesc">Description</label>
              <textarea id="complaintDesc" rows="6" placeholder="Describe the issue in detail..." required></textarea>

              <button class="primary-button" type="submit">SUBMIT COMPLAINT</button>
            </form>
          </div>
        </section>

        <section class="card-grid" id="complaintCards">
          ${complaints.length ? complaints.map(c => complaintCard(c, false)).join('') : '<p style="color:#666;">No complaints registered yet.</p>'}
        </section>
      `;
    },

    async Maintenance() {
      const res = await Auth.api('/api/maintenance');
      const records = res.maintenance || [];

      return `
        <div class="page-toolbar maintenance-toolbar">
          <div class="section-heading">
            <h2>Room Maintenance</h2>
            <p>Daily cleaning and mopping tracking</p>
          </div>
          <button class="add-button" type="button" data-action="openMaintenanceForm">+ Log Record</button>
        </div>

        <section class="maintenance-table-wrap">
          <table class="maintenance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Room</th>
                <th>Cleaning</th>
                <th>Mopping</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${records.length ? records.map(maintenanceRow).join('') : '<tr><td colspan="6" style="text-align:center; padding:20px; color:#888;">No maintenance records found.</td></tr>'}
            </tbody>
          </table>
        </section>

        <section class="complaint-modal" id="maintenanceComposer" aria-labelledby="maintenanceFormTitle" hidden>
          <div class="complaint-dialog maintenance-dialog">
            <button class="complaint-back" type="button" data-action="closeMaintenanceForm" aria-label="Back">←</button>
            <h2 id="maintenanceFormTitle">Log Maintenance</h2>
            <form id="maintenanceForm" class="maintenance-form">
              <p id="maintenanceRecordTime"></p>
              <div class="maintenance-check-grid">
                <div class="maintenance-choice-row">
                  <strong>Cleaning Done</strong>
                  <div class="maintenance-choice-group">
                    <button class="choice-icon active" type="button" data-maintenance-choice="cleaning" data-value="true">✓</button>
                    <button class="choice-icon" type="button" data-maintenance-choice="cleaning" data-value="false">×</button>
                  </div>
                </div>
                <div class="maintenance-choice-row">
                  <strong>Mopping Done</strong>
                  <div class="maintenance-choice-group">
                    <button class="choice-icon active" type="button" data-maintenance-choice="moping" data-value="true">✓</button>
                    <button class="choice-icon" type="button" data-maintenance-choice="moping" data-value="false">×</button>
                  </div>
                </div>
              </div>
              <input id="maintenanceCleaning" type="hidden" value="true" />
              <input id="maintenanceMoping" type="hidden" value="true" />
              <label for="maintenanceRemarks">Remarks</label>
              <input id="maintenanceRemarks" type="text" placeholder="e.g. Cleaned thoroughly" />
              <button class="primary-button" type="submit">SUBMIT RECORD</button>
            </form>
          </div>
        </section>
      `;
    },

    async 'Non Local Outing'() {
      const [meRes, res] = await Promise.all([
        Auth.api('/api/me'),
        Auth.api('/api/outings')
      ]);
      const student = meRes.user || {};
      const allOutings = res.outings || [];
      const currentRoll = String(student.roll || student.userId || '');
      // Strictly show ONLY this student's own requests
      const outings = allOutings.filter(o => String(o.roll_number) === currentRoll);

      return `
        <div class="section-heading">
          <h2>Non Local Outing</h2>
          <p>Apply for permission before leaving campus</p>
        </div>

        <section class="form-panel" style="margin-bottom: 24px;">
          <form id="outingForm" class="functional-form">
            <label>From Date <input id="outingFromDate" type="date" required /></label>
            <label>To Date <input id="outingToDate" type="date" required /></label>
            <label>Parent Phone No <input id="outingParentPhone" type="tel" pattern="[0-9]{10}" maxlength="10" placeholder="10-digit mobile number" required /></label>
            <label class="wide">Purpose of Outing <textarea id="outingPurpose" rows="3" placeholder="What is the purpose of outing..." required></textarea></label>
            <button class="primary-button" type="submit">SUBMIT OUTING REQUEST</button>
          </form>
        </section>

        <div class="section-heading">
          <h2>My Outing Requests</h2>
        </div>
        <section class="list-panel" style="padding:0;">
          ${outings.length ? outings.map(o => outingRow(o, false)).join('') : '<p style="padding:20px; color:#888;">You have not submitted any outing requests yet.</p>'}
        </section>
      `;
    },

    async 'Hostel Room Allocation'() {
      const [meRes, allocRes, winRes, hostelsRes] = await Promise.all([
        Auth.api('/api/me'),
        Auth.api('/api/rooms/my-allocation'),
        Auth.api('/api/windows'),
        Auth.api('/api/hostels')
      ]);
      const student = meRes.user || {};
      const alloc = allocRes.allocation || null;
      const isAllocationOpen = Boolean(winRes.isAllocationOpen);
      const allocWin = winRes.windows?.allocation || {};
      const allHostels = hostelsRes.hostels || [];

      // 1. Pending Admin Verification State
      if (alloc && alloc.status === 'Review') {
        return `
          <section class="profile-details">
            <div class="section-heading">
              <h2>Hostel Room Allocation</h2>
              <p>Your room allocation request with PDF fee receipt has been submitted</p>
            </div>

            <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:12px; padding:22px; margin-bottom:24px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
                <span style="font-size:16px; font-weight:800; color:#b45309;">🟡 Verification Status: Review (Waiting for Admin Verification)</span>
                <span class="status-select-badge badge-review" style="pointer-events:none;">Review</span>
              </div>
              <p style="color:#78350f; font-size:13.5px; margin:0 0 16px 0; line-height:1.5;">
                Your paid SBI Collect fee receipt PDF has been uploaded and is waiting for official verification by the Admin / Hostel Office. Once verified, your room will be confirmed and you will receive an instant notification.
              </p>
              <dl>
                <div><dt>Student Name</dt><dd>${escapeHtml(student.name || alloc.name)}</dd></div>
                <div><dt>Roll Number</dt><dd><strong>${escapeHtml(student.roll || alloc.roll)}</strong></dd></div>
                <div><dt>Requested Hostel</dt><dd><strong>${escapeHtml(alloc.hostel)}</strong></dd></div>
                <div><dt>Requested Floor</dt><dd><strong>${escapeHtml(alloc.floor || 'Ground Floor')}</strong></dd></div>
                <div><dt>Requested Room</dt><dd><strong>${escapeHtml(String(alloc.room).startsWith('Room') ? alloc.room : `Room ${alloc.room}`)} (${escapeHtml(alloc.cot || 'Cot 1')})</strong></dd></div>
                <div><dt>Application Time</dt><dd>${escapeHtml(formatDateTime(alloc.dateTime))}</dd></div>
                <div><dt>SBI Challan Ref No.</dt><dd style="color:#0284c7; font-weight:700;">${escapeHtml(alloc.receiptRef || 'REC-DUK829104')}</dd></div>
                <div>
                  <dt>Submitted Fee Receipt</dt>
                  <dd>
                    <a href="#" class="receipt-link" data-action="viewStudentMyPdf" data-roll="${escapeHtml(alloc.roll)}" data-name="${escapeHtml(alloc.name)}" data-room="${escapeHtml(alloc.room)}" data-hostel="${escapeHtml(alloc.hostel)}">
                      📄 ${escapeHtml(alloc.receiptName || 'SBI_Fee_Receipt.pdf')}
                    </a>
                    <span class="badge-verified" style="margin-left:8px; background:#fef3c7; color:#92400e; border:1px solid #fcd34d;">Pending Admin Verification</span>
                  </dd>
                </div>
              </dl>
            </div>

            <div style="padding:18px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px;">
              <strong style="font-size:14px; color:#1e293b; display:block; margin-bottom:6px;">Need to update your Fee Receipt PDF?</strong>
              <p style="font-size:12.5px; color:#64748b; margin:0 0 10px 0;">Upload a replacement SBI Collect receipt document in PDF format (.pdf)</p>
              <form id="reuploadReceiptForm" style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
                <input type="file" id="reuploadReceiptPdf" accept=".pdf,application/pdf" style="font-size:13px;" required />
                <button class="primary-button" style="width:auto; padding:8px 18px; font-size:13px;" type="submit">Re-upload PDF</button>
              </form>
            </div>
          </section>

          <!-- Receipt Viewer Modal -->
          <section class="complaint-modal" id="studentReceiptModal" hidden>
            <div class="complaint-dialog pdf-receipt-modal-dialog">
              <button class="complaint-back" type="button" data-action="closeStudentReceiptModal" aria-label="Back">←</button>
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px;">
                <h2 style="margin:0; font-size:18px;">📄 Hostel Fee Receipt (PDF)</h2>
                <div style="display:flex; gap:8px;">
                  <button class="admin-btn-primary" type="button" id="btnDownloadMyPdf" style="padding:6px 14px; font-size:12.5px;">⬇ Download PDF</button>
                  <button class="choice-icon" type="button" data-action="closeStudentReceiptModal" style="border:none; font-size:18px;">✕</button>
                </div>
              </div>
              <div id="studentPdfContainer" style="margin:16px 0;"></div>
            </div>
          </section>
        `;
      }

      // 2. Verified / Allocated State
      if (student.room_id || (alloc && alloc.status === 'Verified')) {
        const roomNum = student.room || alloc?.room || '-';
        const hostelName = student.block || alloc?.hostel || '-';
        return `
          <section class="profile-details">
            <div class="section-heading">
              <h2>Hostel Room Allocation</h2>
              <p>Your current confirmed room allocation details</p>
            </div>

            <div style="display:inline-flex; align-items:center; gap:8px; margin-bottom:18px; padding:6px 14px; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px;">
              <span style="font-weight:800; color:#065f46; font-size:13px;">🟢 Status: Verified & Confirmed by Admin</span>
            </div>

            <dl>
              <div><dt>Student Name</dt><dd>${escapeHtml(student.name)}</dd></div>
              <div><dt>Roll Number</dt><dd>${escapeHtml(student.roll)}</dd></div>
              <div><dt>Registration No</dt><dd>${escapeHtml(student.registration || '-')}</dd></div>
              <div><dt>Hostel Block</dt><dd><strong>${escapeHtml(hostelName)}</strong></dd></div>
              <div><dt>Room Number</dt><dd><strong>${escapeHtml(String(roomNum).startsWith('Room') ? roomNum : `Room ${roomNum}`)}</strong></dd></div>
              <div><dt>Year / Gender</dt><dd>Year ${escapeHtml(student.year || '-')} • ${escapeHtml(student.gender || '-')}</dd></div>
              ${alloc?.dateTime ? `<div><dt>Verified Time</dt><dd>${escapeHtml(formatDateTime(alloc.dateTime))}</dd></div>` : ''}
              <div>
                <dt>Fee Receipt (PDF)</dt>
                <dd>
                  <a href="#" class="receipt-link" data-action="viewStudentMyPdf" data-roll="${escapeHtml(student.roll)}" data-name="${escapeHtml(student.name)}" data-room="${escapeHtml(roomNum)}" data-hostel="${escapeHtml(hostelName)}">
                    📄 SBI_Collect_Receipt_${escapeHtml(student.roll)}.pdf
                  </a>
                  <span class="badge-verified" style="margin-left:8px;">Paid & Verified</span>
                </dd>
              </div>
            </dl>

            <div style="margin-top:20px; padding:18px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px;">
              <strong style="font-size:14px; color:#1e293b; display:block; margin-bottom:6px;">Upload / Update Fee Receipt (PDF):</strong>
              <p style="font-size:12.5px; color:#64748b; margin:0 0 10px 0;">Upload your official SBI Collect fee receipt document in PDF format (.pdf)</p>
              <form id="reuploadReceiptForm" style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
                <input type="file" id="reuploadReceiptPdf" accept=".pdf,application/pdf" style="font-size:13px;" required />
                <button class="primary-button" style="width:auto; padding:8px 18px; font-size:13px;" type="submit">Upload PDF</button>
              </form>
            </div>

            <div style="margin-top:24px; padding-top:16px; border-top:1px solid #e2e8f0; display:flex; gap:12px;">
              <button class="primary-button" style="background:#e10000; width:auto; padding:10px 20px;" type="button" data-action="goToVacateRoom">Apply for Evacuation / Vacate Room</button>
            </div>
          </section>

          <!-- Receipt Viewer Modal -->
          <section class="complaint-modal" id="studentReceiptModal" hidden>
            <div class="complaint-dialog pdf-receipt-modal-dialog">
              <button class="complaint-back" type="button" data-action="closeStudentReceiptModal" aria-label="Back">←</button>
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px;">
                <h2 style="margin:0; font-size:18px;">📄 Hostel Fee Receipt (PDF)</h2>
                <div style="display:flex; gap:8px;">
                  <button class="admin-btn-primary" type="button" id="btnDownloadMyPdf" style="padding:6px 14px; font-size:12.5px;">⬇ Download PDF</button>
                  <button class="choice-icon" type="button" data-action="closeStudentReceiptModal" style="border:none; font-size:18px;">✕</button>
                </div>
              </div>
              <div id="studentPdfContainer" style="margin:16px 0;"></div>
            </div>
          </section>
        `;
      }

      // 3. Not Allocated: Enforce Date Window
      if (!isAllocationOpen) {
        return `
          <section class="profile-details">
            <div class="section-heading">
              <h2>Hostel Room Allocation</h2>
              <p>Room allocation portal status</p>
            </div>

            <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:24px; margin-bottom:20px;">
              <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
                <span style="font-size:24px;">🔒</span>
                <div>
                  <h3 style="margin:0; font-size:17px; color:#991b1b;">Room Allocation Window is Currently Closed</h3>
                  <span style="color:#b91c1c; font-size:13px; font-weight:600;">Applications are restricted outside active allocation dates</span>
                </div>
              </div>
              <p style="color:#7f1d1d; font-size:13.5px; line-height:1.6; margin:0 0 14px 0;">
                Hostel room allocation is only permitted during the scheduled window set by the administration.
                <br>• <strong>Scheduled Window:</strong> ${escapeHtml(formatDate(allocWin.startDate))} to ${escapeHtml(formatDate(allocWin.endDate))}
                <br>Please contact the Chief Warden or Hostel Administration office if you require an exception.
              </p>
              <button class="primary-button" style="width:auto; padding:8px 18px; font-size:13px; background:#475569;" type="button" onclick="loadPage('student', 'Contact Us')">Contact Hostel Office →</button>
            </div>
          </section>
        `;
      }

      // 4. Window is OPEN: Multi-input (Hostel Block, Floor No, Room No, Cot No) & PDF Receipt
      // Filter available hostel blocks strictly by student's Gender and Eligibility Academic Year
      const studentGender = (student.gender || 'Male').toLowerCase();
      const studentYear = Number(student.year) || 3;

      // Filter hostels strictly matching student gender and academic year
      const eligibleHostels = allHostels.filter(h => {
        // Gender match
        if (h.for_gender && h.for_gender.toLowerCase() !== studentGender && h.for_gender !== 'Co-ed') {
          return false;
        }
        // Year eligibility match
        if (h.years && h.years.length > 0) {
          const yrs = h.years.map(Number);
          if (!yrs.includes(studentYear)) return false;
        }
        return true;
      });

      return `
        <section class="form-panel">
          <div class="section-heading">
            <h2>Hostel Room Allocation</h2>
            <p>Select your Hostel Block, Floor, Room, and Cot, then submit your SBI Collect Fee Receipt (PDF):</p>
          </div>

          <!-- Active Window Banner -->
          <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:10px; padding:12px 18px; margin-bottom:16px; display:flex; align-items:center; gap:10px;">
            <span style="font-size:16px;">🟢</span>
            <span style="font-size:13.5px; color:#065f46; font-weight:600;">
              Room Allocation Window is <strong>OPEN</strong> (Valid until ${escapeHtml(formatDate(allocWin.endDate))})
            </span>
          </div>

          <!-- Eligibility Info Card -->
          <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; padding:12px 18px; margin-bottom:20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
            <span style="font-size:13px; color:#0369a1;">
              👤 <strong>${escapeHtml(student.name)}</strong> (Roll: ${escapeHtml(student.roll)}) • <strong>${escapeHtml(student.gender || 'Male')}</strong> • <strong>Year ${escapeHtml(student.year || '3')}</strong>
            </span>
            <span style="font-size:12.5px; background:#e0f2fe; color:#0284c7; padding:4px 10px; border-radius:6px; font-weight:700;">
              Showing hostels eligible for ${escapeHtml(student.gender || 'Male')} Year ${escapeHtml(student.year || '3')}
            </span>
          </div>

          <!-- Store eligible hostels data for dynamic client-side cascading calculation -->
          <script id="eligibleHostelsJson" type="application/json">
            ${JSON.stringify(eligibleHostels)}
          </script>

          ${!eligibleHostels.length ? `
            <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:18px; text-align:center;">
              <p style="margin:0; color:#b45309; font-weight:700; font-size:14px;">⚠️ No hostel blocks are currently available matching your Gender (${escapeHtml(student.gender || 'Male')}) and Year (${escapeHtml(student.year || '3')}).</p>
              <small style="color:#92400e; display:block; margin-top:6px;">Please contact the Chief Warden or Hostel Office for assistance.</small>
            </div>
          ` : `
            <form id="allocateRoomForm" class="functional-form">
              <!-- Input 1: Hostel Block (Filtered by student gender and eligibility year) -->
              <label class="wide">1. Select Eligible Hostel Block
                <select id="allocHostelSelect" required>
                  <option value="">-- Choose Eligible Hostel Block --</option>
                  ${eligibleHostels.map(h => `
                    <option value="${escapeHtml(h.name)}">
                      ${escapeHtml(h.name)} Hall of Residence (${escapeHtml(h.for_gender)} • ${h.seater}-Seater • ${h.floors} Floors)
                    </option>
                  `).join('')}
                </select>
              </label>

              <!-- Input 2: Floor Number (Ground Floor, First Floor to no. floors - 1) -->
              <label class="wide">2. Select Floor
                <select id="allocFloorSelect" required disabled>
                  <option value="">-- First select a Hostel Block above --</option>
                </select>
              </label>

              <!-- Input 3: Room Number (Uniformly divided across floors with remainder on Ground Floor) -->
              <label class="wide">3. Select Room Number
                <select id="allocRoomSelect" required disabled>
                  <option value="">-- First select a Floor above --</option>
                </select>
              </label>

              <!-- Input 4: Available Cot Number -->
              <label class="wide">4. Select Available Cot
                <select id="allocCotSelect" required disabled>
                  <option value="">-- First select a Room Number above --</option>
                </select>
              </label>

              <!-- Input 5: Fee Receipt PDF -->
              <label class="wide">5. Upload Fee Receipt (PDF document required)
                <div class="pdf-upload-box">
                  <p style="margin:0 0 6px 0; font-size:14px; color:#1e293b;">📄 <strong>Upload SBI Collect Fee Challan (.pdf)</strong></p>
                  <input type="file" id="feeReceiptPdf" accept=".pdf,application/pdf" required />
                  <small style="color:#64748b; display:block; margin-top:6px;">Supported file type: PDF (.pdf) only. Max file size: 10MB</small>
                </div>
              </label>

              <button class="primary-button" type="submit">SUBMIT FOR ADMIN VERIFICATION</button>
            </form>
          `}
        </section>
      `;
    },

    async 'Vacating Room'() {
      const [meRes, evacRes, winRes] = await Promise.all([
        Auth.api('/api/me'),
        Auth.api('/api/rooms/my-evacuation'),
        Auth.api('/api/windows')
      ]);
      const student = meRes.user || {};
      const evac = evacRes.evacuation || null;
      const isEvacuationOpen = Boolean(winRes.isEvacuationOpen);
      const evacWin = winRes.windows?.evacuation || {};

      // 1. Pending Admin Verification for Evacuation
      if (evac && evac.status === 'Review') {
        return `
          <section class="profile-details">
            <div class="section-heading">
              <h2>Hostel Room Evacuation</h2>
              <p>Your evacuation application has been submitted for Admin verification</p>
            </div>

            <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:12px; padding:22px; margin-bottom:20px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
                <span style="font-size:16px; font-weight:800; color:#b45309;">🟡 Evacuation Status: Review (Pending Admin Verification)</span>
                <span class="status-select-badge badge-review" style="pointer-events:none;">Review</span>
              </div>
              <p style="color:#78350f; font-size:13.5px; margin:0 0 16px 0; line-height:1.5;">
                You have applied to vacate your hostel room. When the Admin verifies and approves your evacuation and dues clearance, you will receive an instant notification and your room will be officially cleared.
              </p>
              <dl>
                <div><dt>Hostel Block</dt><dd><strong>${escapeHtml(evac.hostel)}</strong></dd></div>
                <div><dt>Room Number</dt><dd><strong>Room ${escapeHtml(evac.room)}</strong></dd></div>
                <div><dt>Expected Leave Date</dt><dd><strong>${escapeHtml(formatDate(evac.leaveDate))}</strong></dd></div>
                <div><dt>Application Time</dt><dd>${escapeHtml(formatDateTime(evac.dateTime))}</dd></div>
                <div><dt>Reason for Vacating</dt><dd>${escapeHtml(evac.reason || 'Not specified')}</dd></div>
              </dl>
            </div>
          </section>
        `;
      }

      // 2. Active Room: Check if Evacuation Window is Open
      if (student.room_id || student.room) {
        if (!isEvacuationOpen) {
          return `
            <section class="profile-details">
              <div class="section-heading">
                <h2>Hostel Room Evacuation</h2>
                <p>Evacuation portal status</p>
              </div>

              <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:24px; margin-bottom:20px;">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
                  <span style="font-size:24px;">🔒</span>
                  <div>
                    <h3 style="margin:0; font-size:17px; color:#991b1b;">Hostel Room Evacuation Window is Currently Closed</h3>
                    <span style="color:#b91c1c; font-size:13px; font-weight:600;">Evacuation can only be done during official evacuation dates</span>
                  </div>
                </div>
                <p style="color:#7f1d1d; font-size:13.5px; line-height:1.6; margin:0 0 14px 0;">
                  Room evacuation applications can only be submitted during the scheduled evacuation period set by the administration.
                  <br>• <strong>Scheduled Evacuation Window:</strong> ${escapeHtml(formatDate(evacWin.startDate))} to ${escapeHtml(formatDate(evacWin.endDate))}
                  <br>If you have an urgent medical or academic departure, please contact the Hostel Office directly.
                </p>
                <button class="primary-button" style="width:auto; padding:8px 18px; font-size:13px; background:#475569;" type="button" onclick="loadPage('student', 'Contact Us')">Contact Hostel Office →</button>
              </div>
            </section>
          `;
        }

        return `
          <section class="form-panel">
            <div class="section-heading">
              <h2>Apply for Hostel Room Evacuation</h2>
              <p>Submit your formal room evacuation request for: <strong>${escapeHtml(student.block || 'Sabari')} - Room ${escapeHtml(student.room || '112')}</strong></p>
            </div>

            <!-- Active Evacuation Window Banner -->
            <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:10px; padding:12px 18px; margin-bottom:20px; display:flex; align-items:center; gap:10px;">
              <span style="font-size:16px;">🟢</span>
              <span style="font-size:13.5px; color:#065f46; font-weight:600;">
                Hostel Evacuation Window is <strong>OPEN</strong> (Until ${escapeHtml(formatDate(evacWin.endDate))})
              </span>
            </div>

            <form id="applyEvacuationForm" class="functional-form">
              <label class="wide">Expected Leaving Date
                <input id="evacLeaveDate" type="date" required />
              </label>
              <label class="wide">Reason for Vacating
                <textarea id="evacReason" rows="4" placeholder="Enter reason (e.g. Semester completion, internship, personal reasons)..." required></textarea>
              </label>
              <button class="primary-button" style="background:#e10000;" type="submit">SUBMIT EVACUATION FOR ADMIN VERIFICATION</button>
            </form>
          </section>
        `;
      }

      // 3. Evacuation Verified & Completed
      if (evac && evac.status === 'Verified') {
        return `
          <section class="profile-details">
            <div class="section-heading">
              <h2>Hostel Room Evacuation</h2>
              <p>Evacuation status</p>
            </div>
            <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:12px; padding:22px;">
              <span style="font-size:16px; font-weight:800; color:#065f46; display:block; margin-bottom:8px;">🟢 Evacuation Verified & Completed!</span>
              <p style="color:#047857; font-size:13.5px; margin:0 0 12px 0;">
                Your room evacuation for <strong>${escapeHtml(evac.hostel)} - Room ${escapeHtml(evac.room)}</strong> has been verified and confirmed by the Admin. All hostel clearance dues are completed.
              </p>
              <p style="color:#64748b; font-size:13px; margin:0;">
                Leave Date: ${escapeHtml(formatDate(evac.leaveDate))} • Verified on: ${escapeHtml(formatDateTime(evac.dateTime))}
              </p>
            </div>
          </section>
        `;
      }

      // 4. No room allocated
      return `
        <section class="profile-details">
          <div class="section-heading">
            <h2>Vacating Room</h2>
            <p>You do not currently have any hostel room allocated.</p>
          </div>
        </section>
      `;
    },

    async 'Contact Us'() {
      const cRes = await Auth.api('/api/contacts');
      const contacts = cRes.contacts || {};
      const cw = contacts.chiefWarden || {};
      const ho = contacts.hostelOffice || {};
      const em = contacts.emergency || {};

      return `
        <section class="profile-details">
          <div class="section-heading">
            <h2>Hostel Administration Contact Details</h2>
            <p>Official credentials and contact helplines for NIT Andhra Pradesh Hostels</p>
          </div>
          <dl>
            <div>
              <dt>Chief Warden Office</dt>
              <dd>
                <strong>${escapeHtml(cw.name || 'Dr. G. Rajesh')}</strong> (${escapeHtml(cw.role || 'Chief Warden')})<br>
                📞 Phone: <a href="tel:${escapeHtml(cw.phone || '')}" style="color:var(--blue);">${escapeHtml(cw.phone || '+91 8818 252 001')}</a> • ✉️ Email: <a href="mailto:${escapeHtml(cw.email || '')}" style="color:var(--blue);">${escapeHtml(cw.email || 'chiefwarden@nitandhra.ac.in')}</a><br>
                📍 ${escapeHtml(cw.office || 'Administrative Building, Room 104')}
              </dd>
            </div>
            <div>
              <dt>Hostel Office Helpdesk</dt>
              <dd>
                <strong>${escapeHtml(ho.name || 'Central Hostel Office Helpdesk')}</strong><br>
                📞 Phone: <a href="tel:${escapeHtml(ho.phone || '')}" style="color:var(--blue);">${escapeHtml(ho.phone || '+91 8818 252 002')}</a> • ✉️ Email: <a href="mailto:${escapeHtml(ho.email || '')}" style="color:var(--blue);">${escapeHtml(ho.email || 'hosteloffice@nitandhra.ac.in')}</a><br>
                🕒 Timings: ${escapeHtml(ho.hours || 'Monday to Saturday: 9:00 AM - 5:30 PM')}<br>
                📍 Location: ${escapeHtml(ho.location || 'Central Hostel Office Block')}
              </dd>
            </div>
            <div>
              <dt>Medical & Campus Security</dt>
              <dd>
                🚑 Medical Helpline: <strong>${escapeHtml(em.ambulance || '+91 98888 11111 (24x7 Ambulance)')}</strong><br>
                🛡️ Campus Security: <strong>${escapeHtml(em.security || 'Ext 100 / +91 98765 00000')}</strong>
              </dd>
            </div>
            <div>
              <dt>Caretaker Helplines</dt>
              <dd>
                • <strong>Sabari Block:</strong> ${escapeHtml(em.sabari || '+91 9988776601')}<br>
                • <strong>Indravathi Block:</strong> ${escapeHtml(em.indravathi || '+91 9988776602')}<br>
                • <strong>Nagavalli Block:</strong> ${escapeHtml(em.nagavalli || '+91 9988776603')}<br>
                • <strong>Krishna Block:</strong> ${escapeHtml(em.krishna || '+91 9988776604')}<br>
                • <strong>Vamsadhara Block:</strong> ${escapeHtml(em.vamsadhara || '+91 9988776605')}
              </dd>
            </div>
          </dl>
        </section>
      `;
    }
  },

  // ================= CARETAKER PAGES =================
  caretaker: {
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
      return PageTemplates.admin['Hostel Blocks']();
    }
  },

  // ================= ADMIN PAGES =================
  admin: {
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

    async 'Hostel Blocks'() {
      const hostelsRes = await Auth.api('/api/hostels');
      const hostels = hostelsRes.hostels || [
        { block_id: 'SAB_B_03', name: 'Sabari', for_gender: 'Male', floors: 3, seater: 2, capacity: 150 },
        { block_id: 'IND_B_03', name: 'Indravathi', for_gender: 'Male', floors: 4, seater: 2, capacity: 200 },
        { block_id: 'NAG_B_02', name: 'Nagavalli', for_gender: 'Male', floors: 3, seater: 2, capacity: 150 },
        { block_id: 'KRI_G_01', name: 'Krishna', for_gender: 'Female', floors: 4, seater: 3, capacity: 220 }
      ];

      return `
        <div class="ct-page-view">
          <div class="ct-heading ct-flex-between">
            <h1>Hostel Blocks</h1>
            <div class="admin-header-actions">
              <button class="admin-btn-primary" type="button" data-action="openAddHostelModal">+ Add Hostel Block</button>
            </div>
          </div>

          <!-- Add / Edit Hostel Block Modal -->
          <section class="complaint-modal" id="hostelBlockModal" hidden>
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
          </section>

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
                  <div style="display:flex; gap:8px; margin-top:12px; border-top:1px solid #e2e8f0; padding-top:10px;">
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
                  </div>
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
  }
};

async function getPageContent(role, page) {
  const handler = PageTemplates[role]?.[page] || PageTemplates.student[page];
  if (typeof handler === 'function') {
    try {
      return await handler();
    } catch (err) {
      console.error('Page render error:', err);
      return `<div class="error-panel"><p>Failed to load ${escapeHtml(page)}: ${escapeHtml(err.message)}</p></div>`;
    }
  }
  return PageTemplates.student.Dashboard();
}
