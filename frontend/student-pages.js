/* Student page renderers */
window.PageTemplates = window.PageTemplates || {};
window.PageTemplates.student = {
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

    async 'Hostel Blocks'() {
      const res = await Auth.api('/api/hostels');
      const hostels = res.hostels || [];

      return `
        <div class="ct-page-view">
          <div class="ct-heading">
            <h1>Hostel Blocks</h1>
            <p>View hostel block details, room types, and student capacity.</p>
          </div>
          <div class="ct-cards-grid">
            ${hostels.length ? hostels.map(h => `
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
                    • <strong>Floors:</strong> ${escapeHtml(h.floors)} Floors<br>
                    • <strong>Room Type:</strong> ${escapeHtml(h.seater)}-Seater Configuration<br>
                    • <strong>Capacity:</strong> ${escapeHtml(h.capacity)} Students Total<br>
                    • <strong>Eligibility Year:</strong> ${h.years && h.years.length ? h.years.map(y => `Year ${escapeHtml(y)}`).join(', ') : 'All Years'}
                  </p>
                </div>
              </article>
            `).join('') : '<p style="color:#666;">No hostel block information is available.</p>'}
          </div>
        </div>
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
};
