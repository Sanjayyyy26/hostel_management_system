/**
 * Main Application Script for Hostellers
 * Connects frontend UI to PostgreSQL backend API
 */

// ==================== DOM ELEMENTS ====================
const authView = document.querySelector('#authView');
const dashboardView = document.querySelector('#dashboardView');
const loginContent = document.querySelector('#loginContent');
const registerContent = document.querySelector('#registerContent');
const loginForm = document.querySelector('#loginForm');
const registerForm = document.querySelector('#registerForm');
const roles = document.querySelectorAll('.role');
const loginId = document.querySelector('#loginId');
const idLabel = document.querySelector('#idLabel');
const toast = document.querySelector('#toast');
const loginError = document.querySelector('#loginError');
const registerError = document.querySelector('#registerError');
const registerSuccess = document.querySelector('#registerSuccess');
const sessionModal = document.querySelector('#sessionModal');
const modalTimer = document.querySelector('#modalTimer');

let currentRole = 'student';
let sessionInterval = null;
let remainingTime = 0;

// ==================== SESSION MANAGEMENT ====================
function startSessionTimer() {
  updateTimerDisplay();
  sessionInterval = setInterval(updateTimerDisplay, 1000);
}

function formatRemainingTime(milliseconds) {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
  const session = Auth.getSession();
  if (!session) {
    stopSessionTimer();
    return;
  }

  remainingTime = Math.max(0, session.expiresAt - Date.now());
  const formattedTime = formatRemainingTime(remainingTime);

  if (remainingTime <= 5 * 60 * 1000 && remainingTime > 0) {
    if (modalTimer) modalTimer.textContent = formattedTime;
    if (sessionModal) sessionModal.hidden = false;
  }

  if (remainingTime <= 0) {
    stopSessionTimer();
    handleLogout();
    showToast('Session expired. Please log in again.');
  }
}

function stopSessionTimer() {
  if (sessionInterval) {
    clearInterval(sessionInterval);
    sessionInterval = null;
  }
}

function extendSession() {
  Auth.refreshSession();
  if (sessionModal) sessionModal.hidden = true;
  showToast('Session extended for 30 minutes', 'success');
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'info') {
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  window.setTimeout(() => {
    toast.className = 'toast';
  }, 3500);
}

// ==================== VIEW MANAGEMENT ====================
function updateSidebarProfile(session) {
  if (!session) session = Auth.getSession();
  if (!session) return;
  const profileName = document.querySelector('#profileName');
  const profileId = document.querySelector('#profileId');
  const profileRole = document.querySelector('#profileRole');

  if (profileName) profileName.textContent = session.name || 'User';

  if (session.role === 'student') {
    if (profileId) profileId.textContent = `Roll: ${session.roll || session.userId}`;
    if (profileRole) {
      const roomPart = session.room ? `Room ${session.room}` : 'Room: None';
      const blockPart = session.block ? session.block : 'Hostel';
      profileRole.innerHTML = `${blockPart} • ${roomPart}<br><span style="color:#2563eb; font-weight:700;">Year ${session.year || '-'}</span>`;
    }
  } else if (session.role === 'caretaker') {
    const caretakerName = session.name === 'One Caretaker' ? 'CareTaker One' : (session.name || 'CareTaker One');
    if (profileName) profileName.textContent = caretakerName;
    const blockName = (session.blocks && session.blocks.length ? session.blocks[0].name : '') || session.hostel_name || session.block || 'Sabari';
    if (profileId) profileId.textContent = `${blockName} - Hall of Residence`;
    if (profileRole) profileRole.textContent = 'Contact No.';
    const profileImg = document.querySelector('#profileImage');
    if (profileImg) {
      profileImg.style.background = '#ffffff';
      profileImg.style.border = 'none';
      profileImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="white"><circle cx="32" cy="32" r="32"/></svg>';
    }
  } else if (session.role === 'admin') {
    if (profileName) profileName.textContent = 'Admin ID';
    if (profileId) {
      profileId.innerHTML = 'Hostel Office<br>National Institute of Technology<br>Andhra Pradesh';
      profileId.style.display = 'block';
    }
    if (profileRole) {
      profileRole.textContent = '';
      profileRole.style.display = 'none';
    }
    const profileImg = document.querySelector('#profileImage');
    if (profileImg) {
      profileImg.style.background = '#ffffff';
      profileImg.style.border = 'none';
      profileImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="white"><circle cx="32" cy="32" r="32"/></svg>';
    }
  } else {
    if (profileId) profileId.textContent = `Admin: ${session.userId}`;
    if (profileRole) profileRole.innerHTML = 'System Administrator';
  }
}

function showDashboard(role) {
  authView.hidden = true;
  dashboardView.hidden = false;
  authView.style.display = 'none';
  dashboardView.style.display = 'flex';

  dashboardView.classList.toggle('caretaker-mode', role === 'caretaker');
  dashboardView.classList.toggle('admin-mode', role === 'admin');

  // Show role navigation
  document.querySelectorAll('.main-nav').forEach(nav => nav.hidden = true);
  const targetNav = document.getElementById(`${role}Nav`);
  if (targetNav) targetNav.hidden = false;

  // Update profile in sidebar
  updateSidebarProfile();

  // Sync live student details from database
  Auth.api('/api/me').then(res => {
    if (res.success && res.user) {
      Auth.updateSessionUser(res.user);
      updateSidebarProfile(res.user);
    }
  });

  // Make sidebar profile clickable to view profile
  const sidebarProfileEl = document.querySelector('#sidebarProfile');
  if (sidebarProfileEl && !sidebarProfileEl.dataset.profileBound) {
    sidebarProfileEl.dataset.profileBound = 'true';
    sidebarProfileEl.style.cursor = 'pointer';
    sidebarProfileEl.title = 'Click to view My Profile';
    sidebarProfileEl.addEventListener('click', (e) => {
      if (e.target.closest('#closeMenu')) return;
      const cur = Auth.getSession();
      if (cur && cur.role === 'student') {
        loadPage('student', 'My Profile');
      }
    });
  }

  const defaultPage = Auth.getDefaultPage(role);
  loadPage(role, defaultPage);
  startSessionTimer();
  updateDate();
}

function showLogin() {
  stopSessionTimer();
  if (sessionModal) sessionModal.hidden = true;
  dashboardView.hidden = true;
  authView.hidden = false;
  dashboardView.style.display = 'none';
  authView.style.display = 'grid';
  dashboardView.classList.remove('caretaker-mode');
  dashboardView.classList.remove('admin-mode');
  loginForm.reset();
  registerForm.reset();
  loginContent.hidden = false;
  registerContent.hidden = true;
  hideErrors();
}

function hideErrors() {
  if (loginError) loginError.hidden = true;
  if (registerError) registerError.hidden = true;
  if (registerSuccess) registerSuccess.hidden = true;
}

function updateDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  const dateEl = document.querySelector('#topbarDate');
  if (dateEl) {
    dateEl.textContent = `${day}/${month}/${year} ${hours}:${mins}:${secs}`;
  }
}

function updateActiveNav(page) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });
}

// ==================== PAGE LOADING ====================
let pageLoadSequence = 0;
async function loadPage(role, page) {
  if (!Auth.checkAccess(role, page)) {
    showToast('Access denied to this page', 'error');
    return;
  }
  const requestId = ++pageLoadSequence;

  const pageContent = document.querySelector('#pageContent');
  const pageTitle = document.querySelector('#pageTitle');
  if (pageTitle) pageTitle.textContent = page;
  updateActiveNav(page);

  pageContent.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading...</p></div>';

  try {
    const html = await getPageContent(role, page);
    if (requestId !== pageLoadSequence) return;
    pageContent.innerHTML = html;
    addPageEventListeners(role, page);
  } catch (error) {
    if (requestId !== pageLoadSequence) return;
    console.error('Page load error:', error);
    pageContent.innerHTML = `<div class="error-panel" style="padding:20px; color:#e10000;"><p>Error loading page: ${escapeHtml(error.message)}</p></div>`;
  }
}

// ==================== PAGE EVENT LISTENERS ====================
function addPageEventListeners(role, page) {
  // Navigation cards click
  document.querySelectorAll('[data-page-card]').forEach(card => {
    const targetPage = card.dataset.pageCard;
    const clickHandler = () => {
      const session = Auth.getSession();
      if (!session) return;
      loadPage(session.role, targetPage);
    };
    card.addEventListener('click', clickHandler);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        clickHandler();
      }
    });
  });

  // Complaint modal handlers
  document.querySelector('[data-action="openComplaintForm"]')?.addEventListener('click', () => {
    const composer = document.querySelector('#complaintComposer');
    if (composer) {
      composer.hidden = false;
      document.querySelector('#complaintTitle')?.focus();
    }
  });

  document.querySelectorAll('[data-action="closeComplaintForm"], #complaintComposer').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.complaint-dialog') && !e.target.matches('[data-action="closeComplaintForm"]')) return;
      const composer = document.querySelector('#complaintComposer');
      if (composer) composer.hidden = true;
    });
  });

  // Submit Complaint Form
  const complaintForm = document.querySelector('#complaintForm');
  if (complaintForm) {
    complaintForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.querySelector('#complaintTitle').value.trim();
      const body = document.querySelector('#complaintDesc').value.trim();
      if (!title || !body) return;

      const res = await Auth.api('/api/complaints', {
        method: 'POST',
        body: JSON.stringify({ title, body })
      });

      if (!res.success) {
        showToast(res.message || 'Failed to submit complaint', 'error');
        return;
      }

      showToast('Complaint submitted successfully!', 'success');
      loadPage(role, 'Complaints');
    });
  }

  // Vote on complaint
  document.querySelectorAll('[data-action="voteComplaint"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (btn.disabled) return;
      btn.disabled = true;
      const complaintId = btn.dataset.id;
      const res = await Auth.api(`/api/complaints/${complaintId}/vote`, { method: 'POST' });
      if (res.success) {
        showToast(res.message || 'Vote registered!', 'success');
        loadPage(role, page);
      } else {
        btn.disabled = false;
        showToast(res.message || 'Failed to register vote', 'error');
      }
    });
  });

  // Delete complaint (Student, Caretaker & Admin)
  document.querySelectorAll('[data-action="deleteComplaint"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const complaintId = btn.dataset.id;
      if (!confirm('Are you sure you want to delete this complaint? This cannot be undone.')) {
        return;
      }
      btn.disabled = true;
      const res = await Auth.api(`/api/complaints/${complaintId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        showToast('Complaint deleted successfully', 'success');
        loadPage(role, page);
      } else {
        btn.disabled = false;
        showToast(res.message || 'Failed to delete complaint', 'error');
      }
    });
  });

  // Delete announcement (Caretaker & Admin)
  document.querySelectorAll('[data-action="deleteAnnouncement"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const annId = btn.dataset.id;
      if (!annId) return;
      if (!confirm('Are you sure you want to delete this announcement? This cannot be undone.')) {
        return;
      }
      btn.disabled = true;
      try {
        const res = await Auth.api(`/api/announcements/${annId}`, {
          method: 'DELETE'
        });
        if (res.success) {
          showToast('Announcement deleted successfully', 'success');
          loadPage(role, page);
        } else {
          btn.disabled = false;
          showToast(res.message || 'Failed to delete announcement', 'error');
        }
      } catch (err) {
        btn.disabled = false;
        showToast('Failed to delete announcement', 'error');
      }
    });
  });

  // Toggle complaint status (Caretaker/Admin)
  document.querySelectorAll('[data-action="toggleComplaint"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const complaintId = btn.dataset.id;
      const nextStatus = btn.dataset.nextStatus === 'true';

      // Immediate visual feedback
      const card = btn.closest('.ct-complaint-card') || btn.closest('.notice-card');
      const prevText = btn.textContent;
      const prevClass = btn.className;
      const prevNextStatus = btn.dataset.nextStatus;

      btn.textContent = nextStatus ? 'Done' : 'In Progress';
      btn.className = `ct-badge ${nextStatus ? 'badge-done' : 'badge-progress'}`;
      btn.dataset.nextStatus = String(!nextStatus);
      btn.title = `Click to mark as ${nextStatus ? 'In Progress' : 'Done'}`;
      if (card && card.dataset) {
        card.dataset.status = nextStatus ? 'done' : 'in_progress';
      }

      btn.disabled = true;
      try {
        const res = await Auth.api(`/api/complaints/${complaintId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: nextStatus })
        });
        if (res.success) {
          showToast(nextStatus ? 'Marked complaint as Done' : 'Marked complaint as In Progress', 'success');
        } else {
          btn.textContent = prevText;
          btn.className = prevClass;
          btn.dataset.nextStatus = prevNextStatus;
          btn.title = `Click to mark as ${prevNextStatus === 'true' ? 'Done' : 'In Progress'}`;
          if (card && card.dataset) card.dataset.status = prevNextStatus === 'true' ? 'in_progress' : 'done';
          showToast(res.message || 'Failed to update complaint', 'error');
        }
      } catch (err) {
        btn.textContent = prevText;
        btn.className = prevClass;
        btn.dataset.nextStatus = prevNextStatus;
        if (card && card.dataset) card.dataset.status = prevNextStatus === 'true' ? 'in_progress' : 'done';
        showToast('Failed to update complaint', 'error');
      } finally {
        btn.disabled = false;
      }
    });
  });

  // Filter complaints
  document.querySelector('#complaintFilter')?.addEventListener('change', async (e) => {
    const isMine = e.target.value === 'mine';
    const res = await Auth.api(`/api/complaints?mine=${isMine}`);
    const cardsEl = document.querySelector('#complaintCards');
    if (cardsEl) {
      const list = res.complaints || [];
      cardsEl.innerHTML = list.length
        ? list.map(c => complaintCard(c, role !== 'student')).join('')
        : '<p style="color:#666;">No complaints found.</p>';
      addPageEventListeners(role, page);
    }
  });

  // Caretaker complaints filter
  document.querySelector('#ctComplaintsFilter')?.addEventListener('change', (e) => {
    const val = e.target.value;
    document.querySelectorAll('.ct-complaint-card').forEach(card => {
      if (val === 'all') {
        card.style.display = 'flex';
      } else {
        card.style.display = card.dataset.status === val ? 'flex' : 'none';
      }
    });
  });

  // Caretaker outings filter
  document.querySelector('#ctOutingsFilter')?.addEventListener('change', (e) => {
    const val = e.target.value;
    document.querySelectorAll('.ct-request-card').forEach(card => {
      if (val === 'all') {
        card.style.display = 'flex';
      } else {
        card.style.display = card.dataset.status === val ? 'flex' : 'none';
      }
    });
  });

  // Caretaker Outing Details Modal (UI Design with ALLOW & Go Back buttons)
  const outingModal = document.querySelector('#ctOutingModal');
  const closeOutingModal = () => {
    if (outingModal) {
      outingModal.classList.remove('open');
      outingModal.setAttribute('aria-hidden', 'true');
    }
  };

  document.querySelectorAll('[data-outing-card]').forEach(card => {
    const handleCardOpen = () => {
      if (!outingModal) return;
      const d = card.dataset;
      const rollEl = document.querySelector('#ctModalRoll');
      const dateMainEl = document.querySelector('#ctModalDateMain');
      const dateAgoEl = document.querySelector('#ctModalDateAgo');
      const dateEl = document.querySelector('#ctModalDate');
      const timeEl = document.querySelector('#ctModalTime');
      const fromEl = document.querySelector('#ctModalFrom');
      const toEl = document.querySelector('#ctModalTo');
      const purposeEl = document.querySelector('#ctModalPurpose');
      const phoneEl = document.querySelector('#ctModalPhone');
      const badgeEl = document.querySelector('#ctModalBadge');
      const allowBtn = document.querySelector('#ctModalAllowBtn');

      if (rollEl) rollEl.textContent = d.roll || '424001';
      if (dateMainEl) dateMainEl.textContent = d.createdDate || '06 Oct 2026';
      if (dateAgoEl) dateAgoEl.textContent = d.dateAgo || '2 days ago';
      if (dateEl) dateEl.textContent = d.appliedDate || '10/09/2026';
      if (timeEl) timeEl.textContent = d.time || '03:34 PM';
      if (fromEl) fromEl.textContent = d.from || '12/09/2026';
      if (toEl) toEl.textContent = d.to || '14/09/2026';
      if (purposeEl) purposeEl.textContent = d.purpose || 'Non local outing to go home for Vinayaka Chavithi';
      if (phoneEl) phoneEl.textContent = d.phone || '9988776655';

      const isApproved = d.status === 'approved';
      if (badgeEl) {
        badgeEl.textContent = isApproved ? 'Approved' : 'In Progress';
        badgeEl.className = `ct-modal-badge ${isApproved ? 'badge-done' : 'badge-progress'}`;
      }

      if (allowBtn) {
        allowBtn.dataset.outingId = d.id || '';
        if (isApproved) {
          allowBtn.textContent = 'ALLOWED';
          allowBtn.disabled = true;
        } else {
          allowBtn.textContent = 'ALLOW';
          allowBtn.disabled = false;
        }
      }

      outingModal.classList.add('open');
      outingModal.setAttribute('aria-hidden', 'false');
    };

    card.addEventListener('click', handleCardOpen);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCardOpen();
      }
    });
  });

  document.querySelector('#ctModalBackBtn')?.addEventListener('click', closeOutingModal);

  outingModal?.addEventListener('click', (e) => {
    if (e.target === outingModal) {
      closeOutingModal();
    }
  });

  // ALLOW button click handler
  document.querySelector('#ctModalAllowBtn')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const outingId = btn.dataset.outingId;
    if (!outingId) return;

    btn.disabled = true;
    btn.textContent = 'ALLOWING...';

    try {
      const res = await Auth.api(`/api/outings/${outingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: true })
      });
      if (res.success) {
        showToast('Outing request Approved successfully!', 'success');
        btn.textContent = 'ALLOWED';
        btn.disabled = true;
        const badgeEl = document.querySelector('#ctModalBadge');
        if (badgeEl) {
          badgeEl.textContent = 'Approved';
          badgeEl.className = 'ct-modal-badge badge-done';
        }

        // Immediately update matching cards on requests grid
        document.querySelectorAll('[data-outing-card]').forEach(card => {
          if (card.dataset.id === outingId || card.dataset.id === `OUT_${outingId}` || String(card.dataset.id).endsWith(outingId)) {
            card.dataset.status = 'approved';
            card.dataset.statusText = 'Approved';
            const cardBadge = card.querySelector('.ct-badge');
            if (cardBadge) {
              cardBadge.textContent = 'Approved';
              cardBadge.className = 'ct-badge badge-done';
            }
          }
        });

        setTimeout(async () => {
          closeOutingModal();
          await loadPage(role, page);
        }, 500);
      } else {
        btn.disabled = false;
        btn.textContent = 'ALLOW';
        showToast(res.message || 'Failed to update outing status', 'error');
      }
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'ALLOW';
      showToast('Failed to update outing status', 'error');
    }
  });

  // Maintenance Modal handlers
  document.querySelector('[data-action="openMaintenanceForm"]')?.addEventListener('click', () => {
    const composer = document.querySelector('#maintenanceComposer');
    if (composer) {
      composer.hidden = false;
      const recordTime = document.querySelector('#maintenanceRecordTime');
      if (recordTime) {
        recordTime.textContent = new Date().toLocaleString();
      }
    }
  });

  document.querySelectorAll('[data-action="closeMaintenanceForm"], #maintenanceComposer').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.maintenance-dialog') && !e.target.matches('[data-action="closeMaintenanceForm"]')) return;
      const composer = document.querySelector('#maintenanceComposer');
      if (composer) composer.hidden = true;
    });
  });

  // Maintenance choice toggles
  document.querySelectorAll('[data-maintenance-choice]').forEach(button => {
    button.addEventListener('click', () => {
      const field = button.dataset.maintenanceChoice;
      const value = button.dataset.value;
      const input = document.querySelector(`#maintenance${field.charAt(0).toUpperCase() + field.slice(1)}`);
      if (input) input.value = value;
      document.querySelectorAll(`[data-maintenance-choice="${field}"]`).forEach(b => {
        b.classList.toggle('active', b === button);
      });
    });
  });

  // Maintenance Form submit
  const maintenanceForm = document.querySelector('#maintenanceForm');
  if (maintenanceForm) {
    maintenanceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cleaning = document.querySelector('#maintenanceCleaning').value === 'true';
      const moping = document.querySelector('#maintenanceMoping').value === 'true';
      const remarks = document.querySelector('#maintenanceRemarks').value.trim() || 'None';
      const rollInput = document.querySelector('#maintenanceRoll');
      const payload = { cleaning, moping, remarks };
      if (rollInput && rollInput.value.trim()) payload.roll_number = rollInput.value.trim();

      const res = await Auth.api('/api/maintenance', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!res.success) {
        showToast(res.message || 'Failed to log maintenance', 'error');
        return;
      }

      showToast('Maintenance record logged successfully', 'success');
      loadPage(role, 'Maintenance');
    });
  }

  // Outing Form submit
  const outingForm = document.querySelector('#outingForm');
  if (outingForm) {
    outingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const from_date = (document.querySelector('#outingFromDate') || document.querySelector('#outingFrom')).value;
      const to_date = (document.querySelector('#outingToDate') || document.querySelector('#outingTo')).value;
      const parent_ph_no = (document.querySelector('#outingParentPhone') || document.querySelector('#outingPhone')).value.trim();
      const purpose = (document.querySelector('#outingPurpose') || document.querySelector('#outingReason')).value.trim();

      const res = await Auth.api('/api/outings', {
        method: 'POST',
        body: JSON.stringify({ from_date, to_date, parent_ph_no, purpose })
      });

      if (!res.success) {
        showToast(res.message || 'Failed to submit outing request', 'error');
        return;
      }

      showToast('Outing request submitted for caretaker approval', 'success');
      loadPage(role, 'Non Local Outing');
    });
  }

  // Caretaker/Admin update outing status
  document.querySelectorAll('[data-action="updateOuting"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const outingId = btn.dataset.id;
      const status = btn.dataset.status === 'true';
      const res = await Auth.api(`/api/outings/${outingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });

      if (res.success) {
        showToast(`Outing request ${status ? 'Approved' : 'Rejected'}`, 'success');
        loadPage(role, page);
      } else {
        showToast(res.message || 'Failed to update outing', 'error');
      }
    });
  });

  // Dynamic Cascading Dropdowns for Student Room Allocation (Hostel -> Floor -> Room -> Cot)
  const allocHostelSelect = document.querySelector('#allocHostelSelect');
  const allocFloorSelect = document.querySelector('#allocFloorSelect');
  const allocRoomSelect = document.querySelector('#allocRoomSelect');
  const allocCotSelect = document.querySelector('#allocCotSelect');
  const eligibleHostelsJsonEl = document.querySelector('#eligibleHostelsJson') || document.querySelector('#availableRoomsJson');

  function getFloorLabel(f) {
    if (f === 0) return 'Ground Floor';
    if (f === 1) return 'First Floor';
    if (f === 2) return 'Second Floor';
    if (f === 3) return 'Third Floor';
    if (f === 4) return 'Fourth Floor';
    if (f === 5) return 'Fifth Floor';
    if (f === 6) return 'Sixth Floor';
    if (f === 7) return 'Seventh Floor';
    if (f === 8) return 'Eighth Floor';
    if (f === 9) return 'Ninth Floor';
    if (f === 10) return 'Tenth Floor';
    return `Floor ${f}`;
  }

  function getHostelDistribution(hostel) {
    const capacity = Number(hostel.capacity) || 150;
    const seater = Number(hostel.seater) || 2;
    const floors = Number(hostel.floors) || 3;

    // Divide total capacity with seater count to get total no. of rooms
    const totalRooms = Math.floor(capacity / seater);

    // Divide total no. of rooms with total floors to get each floor rooms
    const roomsPerFloor = Math.floor(totalRooms / floors);
    const remainder = totalRooms % floors;

    // Build floor options from Ground Floor (0) to floors - 1
    const floorsData = [];
    for (let f = 0; f < floors; f++) {
      // In case of unevenness the ground floor gets high number of students
      const roomCount = (f === 0) ? (roomsPerFloor + remainder) : roomsPerFloor;
      const floorName = getFloorLabel(f);

      const rooms = [];
      for (let r = 1; r <= roomCount; r++) {
        const roomNum = (f === 0) ? r : (f * 100 + r);
        const roomLabel = (f === 0)
          ? `Room ${String(r).padStart(3, '0')}`
          : `Room ${roomNum}`;
        rooms.push({
          room_number: roomNum,
          room_label: roomLabel,
          floor_number: f,
          floor_name: floorName,
          seater: seater
        });
      }

      floorsData.push({
        floor_index: f,
        floor_name: floorName,
        room_count: roomCount,
        rooms: rooms
      });
    }

    return {
      totalRooms,
      floors,
      seater,
      capacity,
      floorsData
    };
  }

  if (allocHostelSelect && allocFloorSelect && allocRoomSelect && allocCotSelect && eligibleHostelsJsonEl) {
    let eligibleHostels = [];
    try {
      eligibleHostels = JSON.parse(eligibleHostelsJsonEl.textContent);
    } catch (e) {
      eligibleHostels = [];
    }

    // Step 1: When Hostel Block is selected -> populate Floor Numbers (Ground Floor to floors - 1)
    allocHostelSelect.addEventListener('change', () => {
      const selectedHostelName = allocHostelSelect.value;
      allocFloorSelect.innerHTML = '<option value="">-- Choose Floor --</option>';
      allocRoomSelect.innerHTML = '<option value="">-- First select a Floor above --</option>';
      allocCotSelect.innerHTML = '<option value="">-- First select a Room Number above --</option>';
      allocRoomSelect.disabled = true;
      allocCotSelect.disabled = true;

      if (!selectedHostelName) {
        allocFloorSelect.disabled = true;
        return;
      }

      const hostel = eligibleHostels.find(h => h.name === selectedHostelName || (h.hostel_name === selectedHostelName));
      if (!hostel) {
        allocFloorSelect.disabled = true;
        return;
      }

      const dist = getHostelDistribution(hostel);
      dist.floorsData.forEach(fl => {
        const opt = document.createElement('option');
        opt.value = fl.floor_index;
        opt.dataset.floorName = fl.floor_name;
        opt.textContent = `${fl.floor_name} (${fl.room_count} rooms)`;
        allocFloorSelect.appendChild(opt);
      });
      allocFloorSelect.disabled = false;
    });

    // Step 2: When Floor Number is selected -> populate all Room Numbers on that floor
    allocFloorSelect.addEventListener('change', () => {
      const selectedHostelName = allocHostelSelect.value;
      const selectedFloorVal = allocFloorSelect.value;
      allocRoomSelect.innerHTML = '<option value="">-- Choose Room Number --</option>';
      allocCotSelect.innerHTML = '<option value="">-- First select a Room Number above --</option>';
      allocCotSelect.disabled = true;

      if (selectedFloorVal === '') {
        allocRoomSelect.disabled = true;
        return;
      }

      const hostel = eligibleHostels.find(h => h.name === selectedHostelName || (h.hostel_name === selectedHostelName));
      if (!hostel) return;

      const dist = getHostelDistribution(hostel);
      const fIdx = parseInt(selectedFloorVal, 10);
      const fl = dist.floorsData.find(d => d.floor_index === fIdx);

      if (!fl || !fl.rooms.length) {
        allocRoomSelect.innerHTML = '<option value="">No rooms available on this floor</option>';
        allocRoomSelect.disabled = true;
        return;
      }

      fl.rooms.forEach(rm => {
        const opt = document.createElement('option');
        opt.value = rm.room_number;
        opt.dataset.roomLabel = rm.room_label;
        opt.dataset.seater = rm.seater;
        opt.textContent = `${rm.room_label} (${rm.seater}-Seater)`;
        allocRoomSelect.appendChild(opt);
      });
      allocRoomSelect.disabled = false;
    });

    // Step 3: When Room Number is selected -> populate Available Cot Numbers
    allocRoomSelect.addEventListener('change', () => {
      const selectedRoomOpt = allocRoomSelect.selectedOptions[0];
      allocCotSelect.innerHTML = '<option value="">-- Choose Cot Number --</option>';

      if (!allocRoomSelect.value || !selectedRoomOpt) {
        allocCotSelect.disabled = true;
        return;
      }

      const seater = parseInt(selectedRoomOpt.dataset.seater, 10) || 2;
      for (let i = 1; i <= seater; i++) {
        const cotLabel = `Cot ${i}`;
        const opt = document.createElement('option');
        opt.value = cotLabel;
        opt.textContent = `${cotLabel} (Available)`;
        allocCotSelect.appendChild(opt);
      }
      allocCotSelect.disabled = false;
    });
  }

  // Allocate Room Form submit (Multi-input: Hostel, Floor, Room, Cot + PDF Fee Receipt)
  const allocateRoomForm = document.querySelector('#allocateRoomForm');
  if (allocateRoomForm) {
    allocateRoomForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const hostel = document.querySelector('#allocHostelSelect')?.value;
      const floorIdx = document.querySelector('#allocFloorSelect')?.value;
      const floorOpt = document.querySelector('#allocFloorSelect')?.selectedOptions[0];
      const floorName = floorOpt?.dataset?.floorName || getFloorLabel(parseInt(floorIdx, 10));
      const roomNum = document.querySelector('#allocRoomSelect')?.value;
      const roomOpt = document.querySelector('#allocRoomSelect')?.selectedOptions[0];
      const roomLabel = roomOpt?.dataset?.roomLabel || `Room ${roomNum}`;
      const cot = document.querySelector('#allocCotSelect')?.value;

      if (!hostel || floorIdx === '' || !roomNum || !cot) {
        showToast('Please select Hostel Block, Floor, Room Number, and Available Cot Number', 'error');
        return;
      }

      const fileInput = document.querySelector('#feeReceiptPdf');
      if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        showToast('Please upload your SBI Collect Fee Receipt in PDF format (.pdf)', 'error');
        return;
      }

      const file = fileInput.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        showToast('Please upload fee receipt in PDF format only (.pdf)', 'error');
        return;
      }

      const pdfBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

      const res = await Auth.api('/api/rooms/apply-allocation', {
        method: 'POST',
        body: JSON.stringify({
          hostel,
          floor: floorName,
          room: roomLabel,
          cot,
          receiptPdf: pdfBase64,
          receiptName: file.name
        })
      });

      if (!res.success) {
        showToast(res.message || 'Failed to submit allocation', 'error');
        return;
      }

      showToast(`Room allocation submitted for ${hostel} - Floor ${floorName}, ${roomLabel} (${cot})! Awaiting Admin verification.`, 'success');
      loadPage(role, 'Hostel Room Allocation');
    });
  }

  // Student Re-upload Fee Receipt (PDF)
  const reuploadForm = document.querySelector('#reuploadReceiptForm');
  if (reuploadForm) {
    reuploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fileInput = document.querySelector('#reuploadReceiptPdf');
      if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        showToast('Please select a PDF file to upload', 'error');
        return;
      }
      const file = fileInput.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        showToast('Only PDF (.pdf) documents are permitted', 'error');
        return;
      }
      const pdfBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      const res = await Auth.api('/api/rooms/upload-receipt', {
        method: 'POST',
        body: JSON.stringify({ receiptPdf: pdfBase64, receiptName: file.name })
      });
      if (res.success) {
        showToast('PDF Fee Receipt successfully uploaded and updated!', 'success');
        loadPage(role, 'Hostel Room Allocation');
      } else {
        showToast(res.message || 'Failed to upload PDF', 'error');
      }
    });
  }

  // Navigation from Allocation to Vacate Room
  document.querySelector('[data-action="goToVacateRoom"]')?.addEventListener('click', () => {
    loadPage('student', 'Vacating Room');
  });

  // Apply for Hostel Evacuation (Pending Admin Verification)
  const applyEvacForm = document.querySelector('#applyEvacuationForm');
  if (applyEvacForm) {
    applyEvacForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const leaveDate = document.querySelector('#evacLeaveDate').value;
      const reason = document.querySelector('#evacReason').value.trim();
      if (!leaveDate) {
        showToast('Please select expected leaving date', 'error');
        return;
      }
      const res = await Auth.api('/api/rooms/apply-evacuation', {
        method: 'POST',
        body: JSON.stringify({ leave_date: leaveDate, reason })
      });
      if (!res.success) {
        showToast(res.message || 'Failed to submit evacuation', 'error');
        return;
      }
      showToast('Evacuation application submitted! Waiting for Admin verification.', 'success');
      loadPage(role, 'Vacating Room');
    });
  }

  // Direct Vacate Room button fallback
  const vacateHandler = async () => {
    if (!confirm('Are you sure you want to vacate your hostel room?')) return;
    const res = await Auth.api('/api/rooms/vacate', { method: 'POST' });
    if (!res.success) {
      showToast(res.message || 'Failed to vacate room', 'error');
      return;
    }

    Auth.updateSessionUser({ room: null, block: null, block_id: null, room_id: null });
    showToast('Room vacated successfully', 'success');
    showDashboard(role);
    loadPage(role, 'Hostel Room Allocation');
  };

  document.querySelector('[data-action="vacateMyRoom"]')?.addEventListener('click', vacateHandler);
  document.querySelector('#vacatingForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await vacateHandler();
  });

  // Announcement modal handlers (Caretaker/Admin)
  document.querySelector('[data-action="openAnnouncementForm"]')?.addEventListener('click', () => {
    const composer = document.querySelector('#announcementComposer');
    if (composer) {
      composer.hidden = false;
      document.querySelector('#announcementText')?.focus();
    }
  });

  document.querySelectorAll('[data-action="closeAnnouncementForm"], #announcementComposer').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.complaint-dialog') && !e.target.matches('[data-action="closeAnnouncementForm"]')) return;
      const composer = document.querySelector('#announcementComposer');
      if (composer) composer.hidden = true;
    });
  });

  // Post Announcement Form submit
  const annForm = document.querySelector('#announcementForm');
  if (annForm) {
    annForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.querySelector('#announcementTitle')?.value.trim();
      const rawText = document.querySelector('#announcementText').value.trim();
      const text = title ? `${title}\n\n${rawText}` : rawText;
      const checkedBlocks = Array.from(document.querySelectorAll('input[name="annBlock"]:checked')).map(cb => cb.value);
      if (!text) return;

      const res = await Auth.api('/api/announcements', {
        method: 'POST',
        body: JSON.stringify({ announcement: text, block_ids: checkedBlocks })
      });

      if (!res.success) {
        showToast(res.message || 'Failed to broadcast announcement', 'error');
        return;
      }

      showToast('Announcement broadcasted successfully!', 'success');
      loadPage(role, 'Announcements');
    });
  }

  // Admin Status Update Handler (Allocation & Evacuation)
  document.querySelectorAll('[data-action="updateStatus"]').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      const newStatus = sel.value;
      const type = sel.dataset.type; // 'allocation' or 'evacuation'
      const id = sel.dataset.id;
      const roll = sel.dataset.roll;

      // Update badge color immediately
      sel.classList.remove('badge-review', 'badge-verified', 'badge-declined');
      const bClass = newStatus === 'Verified' ? 'badge-verified' : (newStatus === 'Declined' ? 'badge-declined' : 'badge-review');
      sel.classList.add(bClass);

      const endpoint = type === 'allocation' ? '/api/admin/allocations/status' : '/api/admin/evacuations/status';
      const res = await Auth.api(endpoint, {
        method: 'POST',
        body: JSON.stringify({ id, roll, status: newStatus })
      });

      if (res.success) {
        showToast(`Status for Roll ${roll} updated to ${newStatus}`, 'success');
      } else {
        showToast(res.message || 'Failed to update status', 'error');
      }
    });
  });

  // Start Allocation modal handlers (Admin)
  document.querySelectorAll('[data-action="openStartAllocationModal"], #btnChangeAllocDates').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = document.querySelector('#startAllocationModal');
      if (modal) modal.hidden = false;
    });
  });

  document.querySelectorAll('[data-action="closeStartAllocationModal"], #startAllocationModal').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.complaint-dialog') && !e.target.matches('[data-action="closeStartAllocationModal"]')) return;
      const modal = document.querySelector('#startAllocationModal');
      if (modal) modal.hidden = true;
    });
  });

  const allocForm = document.querySelector('#startAllocationForm');
  if (allocForm) {
    allocForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const startDate = document.querySelector('#allocStartDate')?.value;
      const endDate = document.querySelector('#allocEndDate')?.value;
      const active = document.querySelector('#allocActive')?.checked ?? true;

      if (!startDate || !endDate) {
        showToast('Please enter both start and end dates', 'error');
        return;
      }

      const res = await Auth.api('/api/admin/windows/allocation', {
        method: 'POST',
        body: JSON.stringify({ startDate, endDate, active })
      });

      if (res.success) {
        showToast('Room allocation window dates saved successfully!', 'success');
        const modal = document.querySelector('#startAllocationModal');
        if (modal) modal.hidden = true;
        loadPage(role, 'Hostel Room Allocation');
      } else {
        showToast(res.message || 'Failed to save allocation dates', 'error');
      }
    });
  }

  // Start Vacating modal handlers (Admin)
  document.querySelectorAll('[data-action="openStartVacatingModal"], #btnChangeEvacDates').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = document.querySelector('#startVacatingModal');
      if (modal) modal.hidden = false;
    });
  });

  document.querySelectorAll('[data-action="closeStartVacatingModal"], #startVacatingModal').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.complaint-dialog') && !e.target.matches('[data-action="closeStartVacatingModal"]')) return;
      const modal = document.querySelector('#startVacatingModal');
      if (modal) modal.hidden = true;
    });
  });

  const vacatingForm = document.querySelector('#startVacatingForm');
  if (vacatingForm) {
    vacatingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const startDate = document.querySelector('#evacStartDate')?.value;
      const endDate = document.querySelector('#evacEndDate')?.value;
      const active = document.querySelector('#evacActive')?.checked ?? true;

      if (!startDate || !endDate) {
        showToast('Please enter both start and end dates', 'error');
        return;
      }

      const res = await Auth.api('/api/admin/windows/evacuation', {
        method: 'POST',
        body: JSON.stringify({ startDate, endDate, active })
      });

      if (res.success) {
        showToast('Room evacuation window dates saved successfully!', 'success');
        const modal = document.querySelector('#startVacatingModal');
        if (modal) modal.hidden = true;
        loadPage(role, 'Hostel Room Evacuation');
      } else {
        showToast(res.message || 'Failed to save evacuation dates', 'error');
      }
    });
  }

  // PDF Receipt Viewer Handlers (Admin)
  document.querySelectorAll('[data-action="viewPdfReceipt"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const roll = btn.dataset.receiptRoll || '424151';
      const name = btn.dataset.receiptName || 'Sanjay Pal';
      const room = btn.dataset.receiptRoom || '112';
      const hostel = btn.dataset.receiptHostel || 'Sabari';
      const year = btn.dataset.receiptYear || '3';
      const ref = btn.dataset.receiptRef || 'DUK82910488';
      const pdfData = btn.dataset.receiptPdf;

      const modal = document.querySelector('#receiptViewerModal');
      if (modal) {
        document.querySelector('#pdfViewRoll').textContent = roll;
        document.querySelector('#pdfViewName').textContent = name;
        document.querySelector('#pdfViewRoom').textContent = room;
        document.querySelector('#pdfViewHostel').textContent = hostel;
        document.querySelector('#pdfViewYear').textContent = year;
        document.querySelector('#pdfViewRef').textContent = ref;

        const iframeWrap = document.querySelector('#pdfEmbeddedFrameWrap');
        const iframe = document.querySelector('#pdfEmbeddedIframe');
        if (pdfData && iframeWrap && iframe) {
          iframe.src = pdfData;
          iframeWrap.hidden = false;
        } else if (iframeWrap) {
          iframeWrap.hidden = true;
        }

        modal.hidden = false;
      }
    });
  });

  // Download & Print PDF handlers
  const downloadPdfHandler = (roll, name) => {
    // Generate standard downloadable PDF format
    const dummyPdfContent = `%PDF-1.4\n1 0 obj\n<< /Title (NIT Andhra Pradesh Fee Receipt) /Author (Hostel Office) >>\nendobj\n2 0 obj\n<< /Type /Catalog /Pages 3 0 R >>\nendobj\n3 0 obj\n<< /Type /Pages /Kids [4 0 R] /Count 1 >>\nendobj\n4 0 obj\n<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n5 0 obj\n<< /Length 120 >>\nstream\nBT\n/F1 18 Tf\n50 700 Td\n(NIT Andhra Pradesh - Hostel Fee Receipt) Tj\n/F1 12 Tf\n50 660 Td\n(Roll: ${roll || '424151'} - Name: ${name || 'Sanjay Pal'} - Paid: Rs. 24,500) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000079 00000 n \n0000000130 00000 n \n0000000189 00000 n \n0000000278 00000 n \ntrailer\n<< /Size 6 /Root 2 0 R >>\nstartxref\n450\n%%EOF`;
    const blob = new Blob([dummyPdfContent], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Hostel_Fee_Receipt_${roll || '424151'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Fee Receipt PDF downloaded!', 'success');
  };

  document.querySelector('#btnDownloadAdminPdf')?.addEventListener('click', () => {
    const roll = document.querySelector('#pdfViewRoll')?.textContent || '424151';
    const name = document.querySelector('#pdfViewName')?.textContent || 'Sanjay Pal';
    downloadPdfHandler(roll, name);
  });

  document.querySelector('#btnDownloadMyPdf')?.addEventListener('click', () => {
    const session = Auth.getSession();
    downloadPdfHandler(session?.roll, session?.name);
  });

  document.querySelector('#btnPrintReceiptPdf')?.addEventListener('click', () => {
    window.print();
  });

  document.querySelectorAll('[data-action="closeReceiptModal"], #receiptViewerModal').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.complaint-dialog') && !e.target.matches('[data-action="closeReceiptModal"]')) return;
      const modal = document.querySelector('#receiptViewerModal');
      if (modal) modal.hidden = true;
    });
  });

  // Student view my PDF handler
  document.querySelector('[data-action="viewStudentMyPdf"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    const modal = document.querySelector('#studentReceiptModal');
    const container = document.querySelector('#studentPdfContainer');
    const session = Auth.getSession();
    if (modal && container) {
      container.innerHTML = `
        <div class="pdf-challan-paper">
          <div class="pdf-stamp-verified">PAID & VERIFIED</div>
          <div class="pdf-challan-header">
            <h3>National Institute of Technology Andhra Pradesh</h3>
            <p>Hostel Administration & Chief Warden Office • Tadepalligudem - 534101</p>
            <p style="font-weight:700; color:#1e293b; margin-top:4px;">OFFICIAL HOSTEL ADMISSION & FEE RECEIPT (PDF)</p>
          </div>
          <table class="pdf-challan-table">
            <tbody>
              <tr><td class="strong-label">SBI Collect Reference:</td><td><strong style="color:#1ba0f2;">DUK82910488</strong></td></tr>
              <tr><td class="strong-label">Student Roll Number:</td><td>${escapeHtml(session?.roll || '424151')}</td></tr>
              <tr><td class="strong-label">Student Name:</td><td>${escapeHtml(session?.name || 'Sanjay Pal')}</td></tr>
              <tr><td class="strong-label">Hostel & Room:</td><td>${escapeHtml(session?.block || 'Sabari')} - Room ${escapeHtml(session?.room || '112')}</td></tr>
              <tr><td class="strong-label">Amount Paid:</td><td style="color:#16a34a; font-weight:700;">₹ 24,500.00 (Verified)</td></tr>
              <tr><td class="strong-label">Document Type:</td><td>Official PDF Document (.pdf)</td></tr>
            </tbody>
          </table>
        </div>
      `;
      modal.hidden = false;
    }
  });

  document.querySelectorAll('[data-action="closeStudentReceiptModal"], #studentReceiptModal').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.complaint-dialog') && !e.target.matches('[data-action="closeStudentReceiptModal"]')) return;
      const modal = document.querySelector('#studentReceiptModal');
      if (modal) modal.hidden = true;
    });
  });

  // Admin filter dropdowns
  document.querySelectorAll('.admin-pill-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const val = sel.value.toLowerCase();
      if (!val || val === 'all') {
        document.querySelectorAll('.ct-card, .admin-allocation-table tbody tr').forEach(el => el.style.display = '');
        return;
      }
      document.querySelectorAll('.ct-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(val) ? '' : 'none';
      });
      document.querySelectorAll('.admin-allocation-table tbody tr').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(val) ? '' : 'none';
      });
    });
  });

  // ==================== ADMIN: ADD CARETAKER & ASSIGN HOSTEL ====================
  document.querySelector('[data-action="openAddCaretakerModal"]')?.addEventListener('click', () => {
    const modal = document.querySelector('#addCaretakerModal');
    if (modal) {
      document.querySelector('#addCaretakerForm')?.reset();
      modal.hidden = false;
    }
  });

  document.querySelectorAll('[data-action="closeAddCaretakerModal"], #addCaretakerModal').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.complaint-dialog') && !e.target.matches('[data-action="closeAddCaretakerModal"]')) return;
      const modal = document.querySelector('#addCaretakerModal');
      if (modal) modal.hidden = true;
    });
  });

  const addCaretakerForm = document.querySelector('#addCaretakerForm');
  if (addCaretakerForm) {
    addCaretakerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.querySelector('#newCtName')?.value.trim();
      const employee_id = document.querySelector('#newCtEmpId')?.value.trim();
      const hostel_name = document.querySelector('#newCtHostel')?.value;
      const phone_number = document.querySelector('#newCtPhone')?.value.trim();
      const email = document.querySelector('#newCtEmail')?.value.trim();
      const password = document.querySelector('#newCtPassword')?.value;

      if (!name || !employee_id || !hostel_name || !password) {
        showToast('Please fill in all required caretaker fields', 'error');
        return;
      }

      const res = await Auth.api('/api/admin/caretakers', {
        method: 'POST',
        body: JSON.stringify({ name, employee_id, hostel_name, phone_number, email, password })
      });

      if (res.success) {
        showToast(`Caretaker ${name} created and assigned to ${hostel_name}!`, 'success');
        const modal = document.querySelector('#addCaretakerModal');
        if (modal) modal.hidden = true;
        loadPage(role, 'User Management');
      } else {
        showToast(res.message || 'Failed to create caretaker', 'error');
      }
    });
  }

  // Remove Caretaker (Admin User Management)
  document.querySelectorAll('[data-action="deleteCaretaker"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const empId = btn.dataset.id;
      const name = btn.dataset.name || 'this caretaker';
      if (!confirm(`Are you sure you want to remove caretaker "${name}" (${empId})?`)) {
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Removing...';
      try {
        const res = await Auth.api(`/api/admin/caretakers/${encodeURIComponent(empId)}`, {
          method: 'DELETE'
        });
        if (res.success) {
          showToast(res.message || 'Caretaker removed successfully', 'success');
          loadPage(role, 'User Management');
        } else {
          btn.disabled = false;
          btn.textContent = '🗑 Remove';
          showToast(res.message || 'Failed to remove caretaker', 'error');
        }
      } catch (err) {
        btn.disabled = false;
        btn.textContent = '🗑 Remove';
        showToast('Failed to remove caretaker', 'error');
      }
    });
  });

  
  // ==================== ADMIN: EDIT CARETAKER ASSIGNED BLOCK ====================
  document.querySelectorAll('[data-action="openEditCaretakerModal"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const empId = btn.dataset.id || '';
      const name = btn.dataset.name || 'Caretaker';
      const currentHostel = btn.dataset.hostel || '';

      const modal = document.querySelector('#editCaretakerModal');
      const empInput = document.querySelector('#editCtEmpId');
      const nameDisplay = document.querySelector('#editCtNameDisplay');
      const idDisplay = document.querySelector('#editCtEmpIdDisplay');
      const hostelSelect = document.querySelector('#editCtHostel');

      if (empInput) empInput.value = empId;
      if (nameDisplay) nameDisplay.textContent = name;
      if (idDisplay) idDisplay.textContent = empId;

      if (hostelSelect) {
        // Try exact match or partial match
        let matched = false;
        for (let i = 0; i < hostelSelect.options.length; i++) {
          const opt = hostelSelect.options[i];
          if (opt.value && currentHostel && (
            opt.value.toLowerCase() === currentHostel.toLowerCase() ||
            opt.textContent.toLowerCase().includes(currentHostel.toLowerCase()) ||
            currentHostel.toLowerCase().includes(opt.value.toLowerCase())
          )) {
            hostelSelect.selectedIndex = i;
            matched = true;
            break;
          }
        }
        if (!matched) hostelSelect.value = '';
      }

      if (modal) {
        modal.hidden = false;
        modal.style.display = 'flex';
      }
    });
  });

  document.querySelectorAll('[data-action="closeEditCaretakerModal"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = document.querySelector('#editCaretakerModal');
      if (modal) {
        modal.hidden = true;
        modal.style.display = 'none';
      }
    });
  });

  const editCtForm = document.querySelector('#editCaretakerForm');
  if (editCtForm) {
    editCtForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const empId = document.querySelector('#editCtEmpId')?.value;
      const hostelName = document.querySelector('#editCtHostel')?.value;

      if (!empId || !hostelName) {
        showToast('Please select a hostel block to assign', 'error');
        return;
      }

      const submitBtn = editCtForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'UPDATING...';
      }

      try {
        const res = await Auth.api(`/api/admin/caretakers/${encodeURIComponent(empId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hostel_name: hostelName })
        });

        if (res.success) {
          showToast(res.message || 'Assigned hostel block updated successfully!', 'success');
          const modal = document.querySelector('#editCaretakerModal');
          if (modal) {
            modal.hidden = true;
            modal.style.display = 'none';
          }
          await loadPage(role, 'User Management');
        } else {
          showToast(res.message || 'Failed to update assigned block', 'error');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'UPDATE ASSIGNED BLOCK';
          }
        }
      } catch (err) {
        showToast('Failed to update assigned block: ' + (err.message || 'Server error'), 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'UPDATE ASSIGNED BLOCK';
        }
      }
    });
  }

  // ==================== ADMIN: HOSTEL BLOCKS (ADD, EDIT, REMOVE) ====================
  // Open Add Hostel Block Modal
  document.querySelector('[data-action="openAddHostelModal"]')?.addEventListener('click', () => {
    const modal = document.querySelector('#hostelBlockModal');
    if (modal) {
      document.querySelector('#hostelBlockForm')?.reset();
      document.querySelector('#hostelModalMode').value = 'add';
      document.querySelector('#hostelOriginalId').value = '';
      document.querySelector('#hostelModalTitle').textContent = 'Add New Hostel Block';
      document.querySelector('#hostelModalSubmitBtn').textContent = 'SAVE HOSTEL BLOCK';
      // Default: all years selected
      document.querySelectorAll('input[name="modalHostelYear"]').forEach(cb => cb.checked = true);
      modal.hidden = false;
    }
  });

  // Open Edit Hostel Block Modal
  document.querySelectorAll('[data-action="openEditHostelModal"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const modal = document.querySelector('#hostelBlockModal');
      if (modal) {
        document.querySelector('#hostelModalMode').value = 'edit';
        document.querySelector('#hostelOriginalId').value = btn.dataset.id;
        document.querySelector('#modalHostelName').value = btn.dataset.name;
        document.querySelector('#modalHostelGender').value = btn.dataset.gender;
        document.querySelector('#modalHostelFloors').value = btn.dataset.floors;
        document.querySelector('#modalHostelSeater').value = btn.dataset.seater;
        document.querySelector('#modalHostelCapacity').value = btn.dataset.capacity;
        document.querySelector('#hostelModalTitle').textContent = `Edit Hostel Block (${btn.dataset.name})`;
        document.querySelector('#hostelModalSubmitBtn').textContent = 'UPDATE HOSTEL BLOCK';

        // Populate eligibility year checkboxes from dataset
        let years = [];
        try {
          years = JSON.parse(btn.dataset.years || '[]');
        } catch (e) {
          years = [];
        }
        document.querySelectorAll('input[name="modalHostelYear"]').forEach(cb => {
          cb.checked = !years.length || years.includes(parseInt(cb.value, 10));
        });

        modal.hidden = false;
      }
    });
  });

  // Close Hostel Block Modal
  document.querySelectorAll('[data-action="closeHostelBlockModal"], #hostelBlockModal').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.complaint-dialog') && !e.target.matches('[data-action="closeHostelBlockModal"]')) return;
      const modal = document.querySelector('#hostelBlockModal');
      if (modal) modal.hidden = true;
    });
  });

  // Submit Hostel Block Form (Add or Edit)
  const hostelBlockForm = document.querySelector('#hostelBlockForm');
  if (hostelBlockForm) {
    hostelBlockForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const mode = document.querySelector('#hostelModalMode').value;
      const originalId = document.querySelector('#hostelOriginalId').value;
      const name = document.querySelector('#modalHostelName').value.trim();
      const for_gender = document.querySelector('#modalHostelGender').value;
      const floors = document.querySelector('#modalHostelFloors').value;
      const seater = document.querySelector('#modalHostelSeater').value;
      const capacity = document.querySelector('#modalHostelCapacity').value;
      const years = Array.from(document.querySelectorAll('input[name="modalHostelYear"]:checked')).map(cb => parseInt(cb.value, 10));

      if (!years.length) {
        showToast('Please select at least one eligibility year for this hostel', 'error');
        return;
      }

      let res;
      if (mode === 'edit' && originalId) {
        res = await Auth.api(`/api/hostels/${originalId}`, {
          method: 'PUT',
          body: JSON.stringify({ name, for_gender, floors, seater, capacity, years })
        });
      } else {
        res = await Auth.api('/api/hostels', {
          method: 'POST',
          body: JSON.stringify({ name, for_gender, floors, seater, capacity, years })
        });
      }

      if (res.success) {
        showToast(res.message || (mode === 'edit' ? 'Hostel block updated!' : 'Hostel block added!'), 'success');
        const modal = document.querySelector('#hostelBlockModal');
        if (modal) modal.hidden = true;
        loadPage(role, 'Hostel Blocks');
      } else {
        showToast(res.message || 'Failed to save hostel block', 'error');
      }
    });
  }

  // Remove Hostel Block
  document.querySelectorAll('[data-action="deleteHostelBlock"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const blockId = btn.dataset.id;
      const blockName = btn.dataset.name;
      if (!confirm(`Are you sure you want to remove hostel block "${blockName}" (${blockId})?`)) return;

      const res = await Auth.api(`/api/hostels/${blockId}`, {
        method: 'DELETE'
      });

      if (res.success) {
        showToast(`Hostel block "${blockName}" removed successfully`, 'success');
        loadPage(role, 'Hostel Blocks');
      } else {
        showToast(res.message || 'Failed to remove hostel block', 'error');
      }
    });
  });

  // ==================== ADMIN: EDIT CONTACT US ====================
  document.querySelector('[data-action="openEditContactsModal"]')?.addEventListener('click', () => {
    const modal = document.querySelector('#editContactsModal');
    if (modal) modal.hidden = false;
  });

  document.querySelectorAll('[data-action="closeEditContactsModal"], #editContactsModal').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.complaint-dialog') && !e.target.matches('[data-action="closeEditContactsModal"]')) return;
      const modal = document.querySelector('#editContactsModal');
      if (modal) modal.hidden = true;
    });
  });

  const editContactsForm = document.querySelector('#editContactsForm');
  if (editContactsForm) {
    editContactsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const chiefWarden = {
        name: document.querySelector('#cwName')?.value.trim(),
        phone: document.querySelector('#cwPhone')?.value.trim(),
        email: document.querySelector('#cwEmail')?.value.trim(),
        office: document.querySelector('#cwOffice')?.value.trim()
      };
      const hostelOffice = {
        name: document.querySelector('#hoName')?.value.trim(),
        phone: document.querySelector('#hoPhone')?.value.trim(),
        email: document.querySelector('#hoEmail')?.value.trim(),
        hours: document.querySelector('#hoHours')?.value.trim(),
        location: document.querySelector('#hoLocation')?.value.trim()
      };
      const emergency = {
        ambulance: document.querySelector('#emAmbulance')?.value.trim(),
        security: document.querySelector('#emSecurity')?.value.trim(),
        sabari: document.querySelector('#emSabari')?.value.trim(),
        indravathi: document.querySelector('#emIndravathi')?.value.trim()
      };

      const res = await Auth.api('/api/admin/contacts', {
        method: 'PUT',
        body: JSON.stringify({ chiefWarden, hostelOffice, emergency })
      });

      if (res.success) {
        showToast('Contact Us credentials updated successfully!', 'success');
        const modal = document.querySelector('#editContactsModal');
        if (modal) modal.hidden = true;
        loadPage(role, 'Contact Us');
      } else {
        showToast(res.message || 'Failed to update contacts', 'error');
      }
    });
  }
}

// ==================== AUTHENTICATION HANDLERS ====================
async function handleLogin(e) {
  e.preventDefault();
  hideErrors();

  const id = loginId.value.trim();
  const password = document.querySelector('#password').value;

  if (!id || !password) {
    loginError.textContent = 'Please fill in all fields';
    loginError.hidden = false;
    return;
  }

  loginError.hidden = true;
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'LOGGING IN...';

  try {
    const result = await Auth.validateCredentials(id, password, currentRole);

    if (!result.success) {
      loginError.textContent = result.message || 'Login failed';
      loginError.hidden = false;
      return;
    }

    Auth.createSession(result.user);
    showToast(`Welcome back, ${result.user.name}!`, 'success');
    showDashboard(result.user.role);
  } catch (err) {
    loginError.textContent = 'Connection error. Please ensure server is running.';
    loginError.hidden = false;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

async function handleRegister(e) {
  e.preventDefault();
  hideErrors();

  const name = document.querySelector('#regName')?.value.trim();
  const email = document.querySelector('#regEmail').value.trim();
  const year = document.querySelector('#regYear')?.value;
  const gender = document.querySelector('#regGender')?.value;
  const roll = document.querySelector('#regRoll').value.trim();
  const registration = document.querySelector('#regNumber').value.trim();
  const phone = document.querySelector('#regPhone').value.trim();
  const password = document.querySelector('#regPassword').value;
  const confirmPassword = document.querySelector('#regConfirmPassword').value;

  if (!name || !email || !year || !gender || !roll || !registration || !phone || !password || !confirmPassword) {
    registerError.textContent = 'Please fill in all fields';
    registerError.hidden = false;
    return;
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    registerError.textContent = 'Please enter a valid email address';
    registerError.hidden = false;
    return;
  }

  if (password !== confirmPassword) {
    registerError.textContent = 'Passwords do not match';
    registerError.hidden = false;
    return;
  }

  const submitBtn = registerForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'REGISTERING...';

  try {
    const userData = {
      name,
      email,
      year: Number(year),
      gender,
      roll: Number(roll),
      registration: Number(registration),
      phone,
      password
    };

    const result = await Auth.register(userData);

    if (!result.success) {
      registerError.textContent = result.message || 'Registration failed';
      registerError.hidden = false;
      return;
    }

    showToast('Registration successful! You can now log in.', 'success');
    registerForm.reset();
    registerContent.hidden = true;
    loginContent.hidden = false;
  } catch (err) {
    registerError.textContent = 'Connection error. Please try again.';
    registerError.hidden = false;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

function handleLogout() {
  Auth.logout();
  stopSessionTimer();
  showLogin();
  showToast('You have been logged out successfully.', 'info');
}

// ==================== NOTIFICATIONS MANAGEMENT ====================
let lastNotificationIds = new Set();

async function checkNotifications(isInitial = false) {
  const session = Auth.getSession();
  if (!session) return;
  try {
    const res = await Auth.api('/api/notifications');
    if (!res.success) return;
    const notifs = res.notifications || [];
    const unread = notifs.filter(n => !n.read);

    // Update red dot on notification bell
    const dot = document.querySelector('#notificationDot');
    if (dot) {
      dot.style.display = unread.length > 0 ? 'block' : 'none';
    }

    // Check for newly arrived verification notifications
    if (!isInitial) {
      for (const n of notifs) {
        if (!lastNotificationIds.has(n.id) && !n.read) {
          if (n.type === 'allocation' || n.type === 'evacuation' || n.type === 'outing') {
            showToast(`${n.title}\n${n.message}`, 'success');
            // If student is currently viewing that page, reload it immediately to show verified state
            const curActive = document.querySelector('.nav-link.active')?.dataset.page;
            if (curActive === 'Hostel Room Allocation' || curActive === 'Vacating Room' || curActive === 'Non Local Outing') {
              loadPage(session.role, curActive);
            }
          }
        }
      }
    }

    lastNotificationIds = new Set(notifs.map(n => n.id));
  } catch (e) {
    // ignore
  }
}

async function renderNotificationsList() {
  const listEl = document.querySelector('#notifListContainer');
  if (!listEl) return;
  listEl.innerHTML = '<p style="text-align:center; color:#64748b; padding:20px;">Loading notifications...</p>';

  const res = await Auth.api('/api/notifications');
  const notifs = res.notifications || [];
  if (!notifs.length) {
    listEl.innerHTML = `
      <div style="text-align:center; padding:36px 16px; color:#64748b;">
        <span style="font-size:36px; display:block; margin-bottom:10px;">🔔</span>
        <p style="margin:0 0 4px 0; font-weight:700; color:#334155;">No notifications yet</p>
        <small style="color:#94a3b8;">You will receive real-time updates when Admin verifies your room allocation or evacuation.</small>
      </div>
    `;
    return;
  }

  listEl.innerHTML = notifs.map(n => {
    const icon = n.type === 'allocation' ? '🏠' : (n.type === 'evacuation' ? '🚪' : (n.type === 'outing' ? '🚶' : '📢'));
    return `
      <div class="notif-item ${n.read ? '' : 'unread'}" data-id="${escapeHtml(n.id)}">
        <span class="notif-icon">${icon}</span>
        <div class="notif-body">
          <div class="notif-title">${escapeHtml(n.title)}</div>
          <div class="notif-msg">${escapeHtml(n.message)}</div>
          <div class="notif-time">${escapeHtml(n.dateTime || 'Recent')}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ==================== NAVIGATION SETUP ====================
function setupNavigation() {
  // Role selector buttons
  roles.forEach(button => {
    button.addEventListener('click', () => {
      roles.forEach(b => b.classList.toggle('active', b === button));
      currentRole = button.dataset.role;

      const labelMap = {
        student: { label: 'Roll Number / Email', placeholder: 'Roll Number / Email' },
        caretaker: { label: 'Employee ID / Email', placeholder: 'Employee ID / Email' },
        admin: { label: 'Admin Key', placeholder: 'Admin Key' }
      };

      if (idLabel) idLabel.textContent = labelMap[currentRole].label;
      if (loginId) loginId.placeholder = labelMap[currentRole].placeholder;
    });
  });

  // Password toggle
  document.querySelector('.password-toggle')?.addEventListener('click', (e) => {
    const passInput = document.querySelector('#password');
    const isText = passInput.type === 'text';
    passInput.type = isText ? 'password' : 'text';
    e.currentTarget.textContent = isText ? 'Show' : 'Hide';
  });

  // Toggle login vs register views
  document.querySelector('#showRegister')?.addEventListener('click', () => {
    loginContent.hidden = true;
    registerContent.hidden = false;
    hideErrors();
  });

  document.querySelector('#showLogin')?.addEventListener('click', () => {
    registerContent.hidden = true;
    loginContent.hidden = false;
    hideErrors();
  });

  // Notification bell click & modal handlers
  document.querySelector('#notificationBtn')?.addEventListener('click', () => {
    const modal = document.querySelector('#notificationsModal');
    if (modal) {
      modal.hidden = false;
      renderNotificationsList();
    }
  });

  document.querySelectorAll('#closeNotifModal, #closeNotifModalBtn, #notificationsModal').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.notif-modal-dialog') && !e.target.matches('#closeNotifModal, #closeNotifModalBtn')) return;
      const modal = document.querySelector('#notificationsModal');
      if (modal) modal.hidden = true;
    });
  });

  document.querySelector('#markAllNotifRead')?.addEventListener('click', async () => {
    await Auth.api('/api/notifications/mark-all-read', { method: 'POST' });
    checkNotifications(true);
    renderNotificationsList();
    showToast('All notifications marked as read', 'info');
  });

  // Mobile sidebar controls
  document.querySelector('#menuButton')?.addEventListener('click', () => {
    document.querySelector('#sidebar')?.classList.add('open');
  });

  document.querySelector('#closeMenu')?.addEventListener('click', () => {
    document.querySelector('#sidebar')?.classList.remove('open');
  });

  // Navigation link clicks
  document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    link.addEventListener('click', () => {
      const session = Auth.getSession();
      if (session) {
        loadPage(session.role, link.dataset.page);
        document.querySelector('#sidebar')?.classList.remove('open');
      }
    });
  });

  document.querySelector('#logout')?.addEventListener('click', handleLogout);
  document.querySelector('#extendSession')?.addEventListener('click', extendSession);
  document.querySelector('#forceLogout')?.addEventListener('click', handleLogout);
}

// ==================== INITIALIZATION ====================
function init() {
  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);
  setupNavigation();

  // Check if session is already active
  const session = Auth.getSession();
  if (session) {
    showDashboard(session.role);
    showToast(`Welcome back, ${session.name}!`);
    checkNotifications(true);
  }

  // Periodic notifications check every 5 seconds
  setInterval(() => checkNotifications(false), 5000);

  // Update clock every second (DD/MM/YYYY HH:MM:SS)
  updateDate();
  setInterval(updateDate, 1000);
}

document.addEventListener('DOMContentLoaded', init);
