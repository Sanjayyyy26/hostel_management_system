/**
 * Shared helpers for page renderers
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

