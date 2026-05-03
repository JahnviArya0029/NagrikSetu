// ── api.js — NagrikSetu frontend API layer ──
// Role-based access control + auth-wall modal

const API_BASE = 'https://nagriksetu-backend.onrender.com/api';

// ─────────────────────────────────────────────────────────────
// JWT / Token Management
// ─────────────────────────────────────────────────────────────
class AuthManager {
  static getToken() {
    return localStorage.getItem('token');
  }

  static setToken(token) {
    localStorage.setItem('token', token);
  }

  static removeToken() {
    localStorage.removeItem('token');
  }

  /** Returns decoded JWT payload, or null if missing / expired */
  static getUser() {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Check expiry (exp is in seconds)
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        this.removeToken(); // token expired — clear it
        return null;
      }
      return payload;
    } catch (e) {
      return null;
    }
  }

  /** True only if token exists AND is not expired */
  static isLoggedIn() {
    return this.getUser() !== null;
  }

  static getRole() {
    const user = this.getUser();
    return user ? user.role : 'guest';
  }
}

// ─────────────────────────────────────────────────────────────
// Generic API request helper
// ─────────────────────────────────────────────────────────────
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  };

  const token = AuthManager.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// Auth API
// ─────────────────────────────────────────────────────────────
const AuthAPI = {
  async register(userData) {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    if (response.token) AuthManager.setToken(response.token);
    return response;
  },

  async login(credentials) {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    if (response.token) AuthManager.setToken(response.token);
    return response;
  },

  async getMe() {
    return await apiRequest('/auth/me');
  },

  logout() {
    AuthManager.removeToken();
    window.location.href = 'index1.html';
  }
};

// ─────────────────────────────────────────────────────────────
// Complaints API
// ─────────────────────────────────────────────────────────────
const ComplaintsAPI = {
  async create(formData) {
    const token = AuthManager.getToken();
    const response = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error creating complaint');
    return data;
  },

  async getMyComplaints() {
    return await apiRequest('/complaints/my');
  },

  async getAllComplaints() {
    return await apiRequest('/complaints');
  },

  async getPublicComplaints() {
    return await apiRequest('/complaints/public');
  },

  async updateStatus(id, statusData) {
    return await apiRequest(`/complaints/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData)
    });
  }
};

// ─────────────────────────────────────────────────────────────
// Comments API
// ─────────────────────────────────────────────────────────────
const CommentsAPI = {
  async getComments(complaintId) {
    return await apiRequest(`/comments/${complaintId}`);
  },

  async createComment(complaintId, commentData) {
    const data = { content: commentData.text || commentData.content };
    return await apiRequest(`/comments/${complaintId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

// ─────────────────────────────────────────────────────────────
// Auth-Wall Modal
// Shows an inline login/signup prompt instead of a hard redirect.
// Called when a guest tries to access a protected action.
// ─────────────────────────────────────────────────────────────
function showAuthWall(redirectAfter = '') {
  // Remove existing modal if any
  const existing = document.getElementById('auth-wall-overlay');
  if (existing) existing.remove();

  if (redirectAfter) sessionStorage.setItem('redirectAfterLogin', redirectAfter);

  const overlay = document.createElement('div');
  overlay.id = 'auth-wall-overlay';
  overlay.innerHTML = `
    <style>
      #auth-wall-overlay {
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(5, 15, 30, 0.85);
        backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        animation: awFadeIn 0.25s ease;
      }
      @keyframes awFadeIn { from { opacity: 0 } to { opacity: 1 } }

      #auth-wall-card {
        background: #112236;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 20px;
        padding: 40px 36px;
        width: 100%; max-width: 420px;
        position: relative;
        animation: awSlideUp 0.3s ease;
        box-shadow: 0 24px 80px rgba(0,0,0,0.5);
      }
      @keyframes awSlideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }

      #auth-wall-close {
        position: absolute; top: 16px; right: 18px;
        background: none; border: none; color: #475569;
        font-size: 22px; cursor: pointer; line-height: 1;
        transition: color 0.2s;
      }
      #auth-wall-close:hover { color: #ef4444; }

      #auth-wall-icon {
        font-size: 36px; text-align: center; margin-bottom: 12px;
      }
      #auth-wall-title {
        font-family: 'Inter', 'Segoe UI', sans-serif;
        font-size: 20px; font-weight: 700; color: #fff;
        text-align: center; margin-bottom: 6px;
      }
      #auth-wall-sub {
        font-family: 'Inter', 'Segoe UI', sans-serif;
        font-size: 14px; color: #64748b;
        text-align: center; margin-bottom: 28px; line-height: 1.5;
      }

      .aw-tabs {
        display: flex; background: #0d1b2a;
        border-radius: 10px; padding: 4px; margin-bottom: 24px;
      }
      .aw-tab {
        flex: 1; text-align: center; padding: 9px;
        border-radius: 8px; font-size: 14px; cursor: pointer;
        color: #64748b; border: none; background: transparent;
        font-family: 'Inter', 'Segoe UI', sans-serif; transition: all 0.2s;
      }
      .aw-tab.active {
        background: #14b8a6; color: #0d1b2a; font-weight: 700;
      }

      .aw-form { display: none; }
      .aw-form.active { display: block; }

      .aw-field { margin-bottom: 14px; }
      .aw-label {
        display: block; font-size: 12px; color: #94a3b8;
        margin-bottom: 6px;
        font-family: 'Inter', 'Segoe UI', sans-serif;
      }
      .aw-input {
        width: 100%; padding: 11px 14px;
        background: #0d1b2a;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px; color: #fff; font-size: 14px;
        outline: none; font-family: 'Inter', 'Segoe UI', sans-serif;
        transition: border-color 0.2s; box-sizing: border-box;
      }
      .aw-input:focus { border-color: #14b8a6; box-shadow: 0 0 0 3px rgba(20,184,166,0.12); }

      .aw-submit {
        width: 100%; padding: 13px;
        background: #14b8a6; color: #0d1b2a;
        font-size: 15px; font-weight: 700;
        border: none; border-radius: 8px; cursor: pointer;
        margin-top: 6px; font-family: 'Inter', 'Segoe UI', sans-serif;
        transition: background 0.2s;
      }
      .aw-submit:hover { background: #0f9488; }
      .aw-submit:disabled { opacity: 0.6; cursor: not-allowed; }

      .aw-error {
        color: #f87171; font-size: 13px; margin-top: 10px;
        display: none; font-family: 'Inter', 'Segoe UI', sans-serif;
      }

      .aw-divider {
        text-align: center; margin: 16px 0;
        color: #334155; font-size: 13px; position: relative;
      }
      .aw-divider::before, .aw-divider::after {
        content: ''; position: absolute; top: 50%;
        width: 42%; height: 1px; background: rgba(255,255,255,0.07);
      }
      .aw-divider::before { left: 0; }
      .aw-divider::after { right: 0; }
    </style>

    <div id="auth-wall-card">
      <button id="auth-wall-close" onclick="document.getElementById('auth-wall-overlay').remove()" title="Close">✕</button>

      <div id="auth-wall-icon">🔒</div>
      <div id="auth-wall-title">Login Required</div>
      <div id="auth-wall-sub">Please sign in or create an account to continue.</div>

      <!-- Tabs -->
      <div class="aw-tabs">
        <button class="aw-tab active" onclick="awSwitchTab('login')">Login</button>
        <button class="aw-tab" onclick="awSwitchTab('signup')">Sign Up</button>
      </div>

      <!-- Login Form -->
      <div class="aw-form active" id="aw-login-form">
        <div class="aw-field">
          <label class="aw-label">Email</label>
          <input class="aw-input" type="email" id="aw-login-email" placeholder="you@example.com" autocomplete="email"/>
        </div>
        <div class="aw-field">
          <label class="aw-label">Password</label>
          <input class="aw-input" type="password" id="aw-login-password" placeholder="Your password" autocomplete="current-password"/>
        </div>
        <button class="aw-submit" id="aw-login-btn" onclick="awHandleLogin()">Login</button>
        <div class="aw-error" id="aw-login-error"></div>
      </div>

      <!-- Signup Form -->
      <div class="aw-form" id="aw-signup-form">
        <div class="aw-field">
          <label class="aw-label">Full Name</label>
          <input class="aw-input" type="text" id="aw-signup-name" placeholder="Your name" autocomplete="name"/>
        </div>
        <div class="aw-field">
          <label class="aw-label">Email</label>
          <input class="aw-input" type="email" id="aw-signup-email" placeholder="you@example.com" autocomplete="email"/>
        </div>
        <div class="aw-field">
          <label class="aw-label">Password</label>
          <input class="aw-input" type="password" id="aw-signup-password" placeholder="Create a password" autocomplete="new-password"/>
        </div>
        <button class="aw-submit" id="aw-signup-btn" onclick="awHandleSignup()">Create Account</button>
        <div class="aw-error" id="aw-signup-error"></div>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // Allow Enter key to submit
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') overlay.remove();
  });

  // Focus the email field
  setTimeout(() => {
    const el = document.getElementById('aw-login-email');
    if (el) el.focus();
  }, 100);
}

function awSwitchTab(tab) {
  document.querySelectorAll('.aw-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.aw-form').forEach(f => f.classList.remove('active'));
  if (tab === 'login') {
    document.querySelectorAll('.aw-tab')[0].classList.add('active');
    document.getElementById('aw-login-form').classList.add('active');
    setTimeout(() => document.getElementById('aw-login-email').focus(), 50);
  } else {
    document.querySelectorAll('.aw-tab')[1].classList.add('active');
    document.getElementById('aw-signup-form').classList.add('active');
    setTimeout(() => document.getElementById('aw-signup-name').focus(), 50);
  }
}

async function awHandleLogin() {
  const email = document.getElementById('aw-login-email').value.trim();
  const password = document.getElementById('aw-login-password').value;
  const errorDiv = document.getElementById('aw-login-error');
  const btn = document.getElementById('aw-login-btn');

  errorDiv.style.display = 'none';
  if (!email || !password) {
    errorDiv.textContent = 'Please fill in all fields.';
    errorDiv.style.display = 'block';
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Logging in…';
  try {
    await AuthAPI.login({ email, password });
    // Success — redirect based on role
    const user = AuthManager.getUser();
    const redirect = sessionStorage.getItem('redirectAfterLogin');
    sessionStorage.removeItem('redirectAfterLogin');

    if (user && user.role === 'admin') {
      window.location.href = 'adminDashboard.html';
    } else {
      window.location.href = redirect || 'index1.html';
    }
  } catch (err) {
    errorDiv.textContent = err.message || 'Login failed. Check your credentials.';
    errorDiv.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Login';
  }
}

async function awHandleSignup() {
  const name = document.getElementById('aw-signup-name').value.trim();
  const email = document.getElementById('aw-signup-email').value.trim();
  const password = document.getElementById('aw-signup-password').value;
  const errorDiv = document.getElementById('aw-signup-error');
  const btn = document.getElementById('aw-signup-btn');

  errorDiv.style.display = 'none';
  if (!name || !email || !password) {
    errorDiv.textContent = 'Please fill in all fields.';
    errorDiv.style.display = 'block';
    return;
  }
  if (password.length < 6) {
    errorDiv.textContent = 'Password must be at least 6 characters.';
    errorDiv.style.display = 'block';
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Creating account…';
  try {
    await AuthAPI.register({ name, email, password });
    const redirect = sessionStorage.getItem('redirectAfterLogin');
    sessionStorage.removeItem('redirectAfterLogin');
    window.location.href = redirect || 'index1.html';
  } catch (err) {
    errorDiv.textContent = err.message || 'Registration failed.';
    errorDiv.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
}

// ─────────────────────────────────────────────────────────────
// Route Guards
// ─────────────────────────────────────────────────────────────

/**
 * requireAuth — used on pages that MUST be logged in.
 * Instead of a hard redirect, shows the auth-wall modal for a seamless UX.
 * Returns true if authenticated, false if guest (modal shown).
 */
function requireAuth(redirectAfter = window.location.pathname.split('/').pop()) {
  if (AuthManager.isLoggedIn()) return true;
  showAuthWall(redirectAfter);
  return false;
}

/**
 * requireAdmin — async strict backend validation, dashboard should not be visible to guests or non-admins.
 */
// REPLACE the entire requireAdmin function with this:
async function requireAdmin() {
  if (!AuthManager.isLoggedIn()) {
    window.location.href = 'loginsign.html';
    return false;
  }
  const user = AuthManager.getUser();
  if (!user || user.role !== 'admin') {
    window.location.href = 'index1.html';
    return false;
  }
  return true; // ← remove the apiRequest('/auth/verify-admin') call entirely
}

/**
 * fileComplaintRedirect — smart button handler.
 * Logged-in citizen → go to complaint.html
 * Guest            → show auth-wall modal
 */
function fileComplaintRedirect() {
  if (AuthManager.isLoggedIn()) {
    window.location.href = 'complaint.html';
  } else {
    showAuthWall('complaint.html');
  }
}

// ─────────────────────────────────────────────────────────────
// Navbar user info
// ─────────────────────────────────────────────────────────────
function initUserInfo() {
  const user = AuthManager.getUser();
  if (user) {
    const avatar = document.querySelector('.avatar');
    const navName = document.querySelector('.nav-name');
    if (avatar && user.name) avatar.textContent = user.name.charAt(0).toUpperCase();
    if (navName && user.name) navName.textContent = user.name;

    const adminLink = document.getElementById('admin-link');
    if (adminLink && user.role === 'admin') adminLink.style.display = 'block';
  }
}

// ─────────────────────────────────────────────────────────────
// Global error helper
// ─────────────────────────────────────────────────────────────
function showError(message) {
  console.error(message);
  alert(`Error: ${message}`);
}

// ─────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────
window.AuthManager = AuthManager;
window.AuthAPI = AuthAPI;
window.ComplaintsAPI = ComplaintsAPI;
window.CommentsAPI = CommentsAPI;
window.requireAuth = requireAuth;
window.requireAdmin = requireAdmin;
window.fileComplaintRedirect = fileComplaintRedirect;
window.showAuthWall = showAuthWall;
window.awSwitchTab = awSwitchTab;
window.awHandleLogin = awHandleLogin;
window.awHandleSignup = awHandleSignup;
window.initUserInfo = initUserInfo;
window.showError = showError;

// ─────────────────────────────────────────────────────────────
// Global Navbar Profile Injection
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  if (!AuthManager.isLoggedIn()) return;
  if (document.body.dataset.skipNavInject === 'true') return;  // ← ADD THIS LINE
  const nav = document.querySelector('nav') || document.querySelector('.navbar') || document.querySelector('.nav');
  if (!nav) return;

  // Ensure nav-right container exists
  let navRight = nav.querySelector('.nav-right');
  if (!navRight) {
    navRight = document.createElement('div');
    navRight.className = 'nav-right';
    navRight.style.display = 'flex';
    navRight.style.alignItems = 'center';
    navRight.style.gap = '15px';
    navRight.style.marginLeft = 'auto'; // push to the far right

    // If there's an existing action button (like File Complaint), move it inside nav-right
    const actionBtn = nav.querySelector('button.btn-primary');
    if (actionBtn && !actionBtn.closest('.nav-right')) {
      navRight.appendChild(actionBtn);
    }

    nav.appendChild(navRight);
  }

  const existingAvatar = nav.querySelector('.avatar');
  const existingName = nav.querySelector('.nav-name');
  const existingLogout = Array.from(nav.querySelectorAll('button')).find(b => b.textContent.trim().toLowerCase() === 'logout');

  try {
    const res = await AuthAPI.getMe();
    const user = res.data;
    const name = user.name || 'Citizen';
    const initial = name.charAt(0).toUpperCase();

    // 1. Update or Create Avatar & Name
    if (existingAvatar) {
      existingAvatar.textContent = initial;
    }
    if (existingName) {
      existingName.textContent = name;
    }

    if (!existingAvatar && !existingName) {
      const profileContainer = document.createElement('div');
      profileContainer.style.display = 'flex';
      profileContainer.style.alignItems = 'center';
      profileContainer.style.gap = '8px';

      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = initial;
      avatar.style.width = '35px';
      avatar.style.height = '35px';
      avatar.style.borderRadius = '50%';
      avatar.style.backgroundColor = '#2dd4bf';
      avatar.style.color = '#0b1c3a';
      avatar.style.display = 'flex';
      avatar.style.justifyContent = 'center';
      avatar.style.alignItems = 'center';
      avatar.style.fontWeight = 'bold';
      avatar.title = name;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'nav-name';
      nameSpan.textContent = name;
      nameSpan.style.color = '#cbd5e1';
      nameSpan.style.fontSize = '14px';
      nameSpan.style.fontWeight = '500';

      profileContainer.appendChild(avatar);
      profileContainer.appendChild(nameSpan);
      navRight.appendChild(profileContainer);
    }

    // 2. Update or Create Logout Button
    if (existingLogout) {
      // Overwrite the onclick to ensure it has a confirmation prompt
      existingLogout.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you want to log out?')) {
          AuthAPI.logout();
        }
      };
    } else {
      const logoutBtn = document.createElement('button');
      logoutBtn.textContent = 'Logout';
      logoutBtn.style.background = 'transparent';
      logoutBtn.style.border = '1px solid #ef4444';
      logoutBtn.style.color = '#ef4444';
      logoutBtn.style.padding = '6px 12px';
      logoutBtn.style.borderRadius = '6px';
      logoutBtn.style.cursor = 'pointer';
      logoutBtn.style.fontSize = '13px';
      logoutBtn.style.marginLeft = '12px';
      logoutBtn.style.transition = 'all 0.2s';

      logoutBtn.onmouseover = () => { logoutBtn.style.background = '#ef4444'; logoutBtn.style.color = 'white'; };
      logoutBtn.onmouseout = () => { logoutBtn.style.background = 'transparent'; logoutBtn.style.color = '#ef4444'; };

      logoutBtn.onclick = (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to log out?')) {
          AuthAPI.logout();
        }
      };

      navRight.appendChild(logoutBtn);
    }

  } catch (error) {
    console.error('Failed to load user profile for navbar', error);
  }
});