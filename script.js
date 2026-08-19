/**
 * Main Application Script
 * Implements FR-01 to FR-06: Complete authentication and role-based system
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
const sessionTimer = document.querySelector('#sessionTimer');
const timerText = document.querySelector('#timerText');
const sessionModal = document.querySelector('#sessionModal');
const modalTimer = document.querySelector('#modalTimer');
const loadingSpinner = document.querySelector('#loadingSpinner');

// ==================== SESSION MANAGEMENT ====================
let sessionInterval = null;
let remainingTime = 0;

function startSessionTimer() {
  updateTimerDisplay();
  sessionInterval = setInterval(updateTimerDisplay, 1000);
}

function updateTimerDisplay() {
  const session = Auth.getSession();
  if (!session) {
    stopSessionTimer();
    return;
  }

  remainingTime = Math.max(0, session.expiresAt - Date.now());
  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);
  
  timerText.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Show warning modal when less than 5 minutes remain
  if (remainingTime <= 5 * 60 * 1000 && remainingTime > 0) {
    modalTimer.textContent = timerText.textContent;
    sessionModal.hidden = false;
  }

  // Auto-logout when session expires
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
  sessionModal.hidden = true;
  showToast('Session extended for 30 minutes');
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'info') {
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  window.setTimeout(() => toast.className = 'toast', 3000);
}

// ==================== VIEW MANAGEMENT ====================
function showDashboard(role) {
  authView.hidden = true;
  dashboardView.hidden = false;
  authView.style.display = 'none';
  dashboardView.style.display = 'flex';

  // Show role-specific navigation
  document.querySelectorAll('.main-nav').forEach(nav => nav.hidden = true);
  document.getElementById(`${role}Nav`).hidden = false;

  // Update profile
  const session = Auth.getSession();
  if (session) {
    document.querySelector('#profileName').textContent = session.name;
    document.querySelector('#profileId').textContent = session.userId;
    document.querySelector('#profileRole').textContent = session.role.charAt(0).toUpperCase() + session.role.slice(1);
  }

  // Load default page
  const defaultPage = Auth.getDefaultPage(role);
  loadPage(role, defaultPage);

  // Start session timer
  startSessionTimer();

  // Update date
  updateDate();
}

function showLogin() {
  stopSessionTimer();
  sessionModal.hidden = true;
  dashboardView.hidden = true;
  authView.hidden = false;
  dashboardView.style.display = 'none';
  authView.style.display = 'grid';
  loginForm.reset();
  registerForm.reset();
  hideErrors();
}

function hideErrors() {
  loginError.hidden = true;
  registerError.hidden = true;
  registerSuccess.hidden = true;
}

function updateDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.querySelector('#topbarDate').textContent = now.toLocaleDateString('en-US', options).toUpperCase();
}

// ==================== PAGE LOADING ====================
function loadPage(role, page) {
  if (!Auth.checkAccess(role, page)) {
    showToast('Access denied to this page', 'error');
    return;
  }

  const pageContent = document.querySelector('#pageContent');
  
  // Show loading state
  pageContent.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading...</p></div>';
  
  // Simulate loading delay for better UX
  setTimeout(() => {
    pageContent.innerHTML = getPageContent(role, page);
    document.querySelector('#pageTitle').textContent = page;
    
    // Add event listeners to the new content
    addPageEventListeners(page);
  }, 200);
}

function addPageEventListeners(page) {
  // Handle form submissions
  const complaintForm = document.querySelector('#complaintForm');
  if (complaintForm) {
    complaintForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Complaint submitted successfully');
      complaintForm.reset();
    });
  }

  const maintenanceForm = document.querySelector('#maintenanceForm');
  if (maintenanceForm) {
    maintenanceForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Maintenance request submitted');
      maintenanceForm.reset();
    });
  }

  const outingForm = document.querySelector('#outingForm');
  if (outingForm) {
    outingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Outing request submitted for approval');
      outingForm.reset();
    });
  }

  const inspectionForm = document.querySelector('#inspectionForm');
  if (inspectionForm) {
    inspectionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Inspection recorded successfully');
      inspectionForm.reset();
    });
  }

  // Add click handlers for navigation within pages
  document.querySelectorAll('.action[data-page], .panel-title button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const session = Auth.getSession();
      if (session) {
        loadPage(session.role, btn.dataset.page);
        updateActiveNav(btn.dataset.page);
      }
    });
  });
}

function updateActiveNav(page) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });
}

// ==================== AUTHENTICATION HANDLERS ====================
let currentRole = 'student';

function handleLogin(e) {
  e.preventDefault();
  hideErrors();

  const id = loginId.value.trim();
  const password = document.querySelector('#password').value;

  // Validate inputs
  if (!id || !password) {
    loginError.textContent = 'Please fill in all fields';
    loginError.hidden = false;
    return;
  }

  // FR-02: Credential validation
  const result = Auth.validateCredentials(id, password, currentRole);
  
  if (!result.success) {
    loginError.textContent = result.message;
    loginError.hidden = false;
    return;
  }

  // FR-03: Role identification (confirmed by selection)
  const role = result.user.role;
  
  // FR-04: Create session with role info
  const session = Auth.createSession(result.user);
  
  // FR-05: Session is now active
  showToast(`Welcome back, ${result.user.name}!`);
  
  showDashboard(role);
}

function handleRegister(e) {
  e.preventDefault();
  hideErrors();

  const role = document.querySelector('#regRole').value;
  const name = document.querySelector('#regName').value.trim();
  const id = document.querySelector('#regId').value.trim();
  const email = document.querySelector('#regEmail').value.trim();
  const phone = document.querySelector('#regPhone').value.trim();
  const password = document.querySelector('#regPassword').value;
  const confirmPassword = document.querySelector('#regConfirmPassword').value;

  // Validate all fields
  if (!role || !name || !id || !email || !phone || !password || !confirmPassword) {
    registerError.textContent = 'Please fill in all fields';
    registerError.hidden = false;
    return;
  }

  // Validate password match
  if (password !== confirmPassword) {
    registerError.textContent = 'Passwords do not match';
    registerError.hidden = false;
    return;
  }

  // FR-01: User registration with validation
  const userData = {
    name,
    email,
    phone,
    password,
    createdAt: Date.now()
  };

  // Set the correct ID field based on role
  if (role === 'student') {
    userData.hostel_id = id;
    userData.roll = id;
  } else {
    userData.hostel_id = id;
  }

  const result = Auth.register(userData, role);
  
  if (!result.success) {
    registerError.textContent = result.message;
    registerError.hidden = false;
    return;
  }

  registerSuccess.textContent = 'Account created successfully! You can now login.';
  registerSuccess.hidden = false;
  registerForm.reset();
  
  // Switch to login after 2 seconds
  setTimeout(() => {
    registerContent.hidden = true;
    loginContent.hidden = false;
    hideErrors();
  }, 2000);
}

function handleLogout() {
  // FR-06: Clear session
  Auth.logout();
  stopSessionTimer();
  sessionModal.hidden = true;
  showLogin();
  showToast('You have been logged out successfully.');
}

// ==================== NAVIGATION ====================
function setupNavigation() {
  // Role switching
  roles.forEach(button => {
    button.addEventListener('click', () => {
      roles.forEach(item => item.classList.toggle('active', item === button));
      currentRole = button.dataset.role;
      
      // Update label based on role
      const labelMap = {
        student: { label: 'Student ID', placeholder: 'e.g., STU001' },
        caretaker: { label: 'Caretaker ID', placeholder: 'e.g., CARE001' },
        admin: { label: 'Admin Key', placeholder: 'e.g., admin001' }
      };
      
      idLabel.textContent = labelMap[currentRole].label;
      loginId.placeholder = labelMap[currentRole].placeholder;
    });
  });

  // Password toggle
  document.querySelector('.password-toggle').addEventListener('click', (event) => {
    const password = document.querySelector('#password');
    const visible = password.type === 'text';
    password.type = visible ? 'password' : 'text';
    event.currentTarget.textContent = visible ? '◉' : '◌';
  });

  // Show register
  document.querySelector('#showRegister').addEventListener('click', () => {
    loginContent.hidden = true;
    registerContent.hidden = false;
    hideErrors();
  });

  // Show login
  document.querySelector('#showLogin').addEventListener('click', () => {
    registerContent.hidden = true;
    loginContent.hidden = false;
    hideErrors();
  });

  // Sidebar navigation
  document.querySelector('#menuButton').addEventListener('click', () => {
    document.querySelector('#sidebar').classList.add('open');
  });

  document.querySelector('#closeMenu').addEventListener('click', () => {
    document.querySelector('#sidebar').classList.remove('open');
  });

  // Nav links
  document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    link.addEventListener('click', () => {
      const session = Auth.getSession();
      if (session) {
        loadPage(session.role, link.dataset.page);
        updateActiveNav(link.dataset.page);
        document.querySelector('#sidebar').classList.remove('open');
      }
    });
  });

  // Logout button
  document.querySelector('#logout').addEventListener('click', handleLogout);

  // Session modal buttons
  document.querySelector('#extendSession').addEventListener('click', extendSession);
  document.querySelector('#forceLogout').addEventListener('click', handleLogout);
}

// ==================== INITIALIZATION ====================
function init() {
  // Setup all event listeners
  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);
  setupNavigation();

  // Check for existing session
  const session = Auth.getSession();
  if (session) {
    // FR-05: Restore active session
    showDashboard(session.role);
    showToast(`Welcome back, ${session.name}!`);
  }
}

// Run initialization when DOM is ready
document.addEventListener('DOMContentLoaded', init);
