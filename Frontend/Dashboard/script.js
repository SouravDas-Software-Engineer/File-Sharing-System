document.addEventListener('DOMContentLoaded', () => {

  const API_URL = "http://127.0.0.1:8000";
  const dashboardContainer = document.querySelector('.dashboard');

  // ================= TOAST NOTIFICATION SYSTEM =================
  const toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);

  function showToast({ title, message, type = 'info', duration = 3000, progress = false }) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    if (progress) toast.classList.add('progress');

    toast.innerHTML = `
      <div class="toast-icon ${type}"><i class="fa-solid fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation' : 'info-circle'}"></i></div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
        ${progress ? '<div class="progress-bar"><div class="progress-fill"></div></div>' : ''}
      </div>
    `;

    toastContainer.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('slideIn'));

    if (progress) {
      const progressFill = toast.querySelector('.progress-fill');
      let width = 0;
      const interval = setInterval(() => {
        width += 10;
        progressFill.style.width = width + '%';
        if (width >= 100) clearInterval(interval);
      }, duration / 10);
    }

    setTimeout(() => {
      toast.classList.add('slideOut');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ================= MOBILE SIDEBAR TOGGLE =================
  const hamburgerMenu = document.getElementById('hamburger-menu');
  const sidebar = document.querySelector('.sidebar');

  if (hamburgerMenu && sidebar) {
    // Create backdrop if it doesn't exist
    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
    }

    hamburgerMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('active');
      backdrop.classList.toggle('active');
    });

    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('active');
      backdrop.classList.remove('active');
    });

    // Close sidebar when clicking a menu item
    sidebar.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        sidebar.classList.remove('active');
        backdrop.classList.remove('active');
      });
    });
  }

  // ================= PAGE TRANSITION LOGIC =================
  const pageLinks = document.querySelectorAll('.sidebar a, .profile-dropdown a');

  if (dashboardContainer) {
    pageLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const targetUrl = link.getAttribute('href');

        if (!targetUrl || targetUrl === '#' || link.id === 'logout-btn' || link.id === 'topbar-logout-btn') {
            return;
        }

        e.preventDefault();
        dashboardContainer.classList.add('fade-out');

        setTimeout(() => {
          window.location.href = targetUrl;
        }, 300);
      });
    });
  }

  // ================= THEME MEMORY LOGIC =================
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;
  const icon = themeToggle ? themeToggle.querySelector('i') : null;
  const savedTheme = localStorage.getItem('fileShareTheme') || 'dark';

  if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    if (icon) icon.classList.replace('fa-moon', 'fa-sun');
  } else {
    body.classList.remove('dark-mode');
    if (icon) icon.classList.replace('fa-sun', 'fa-moon');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      body.classList.toggle('dark-mode');

      if (body.classList.contains('dark-mode')) {
        if (icon) icon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('fileShareTheme', 'dark');
      } else {
        if (icon) icon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('fileShareTheme', 'light');
      }
    });
  }

  // ================= USERNAME DISPLAY LOGIC =================
  const displayUsername = document.getElementById('display-username');
  const profilePageName = document.getElementById('profile-page-name');
  const storedUsername = localStorage.getItem('username');

  if (displayUsername && storedUsername) displayUsername.textContent = storedUsername;
  if (profilePageName && storedUsername) profilePageName.textContent = storedUsername;

  // ================= PROFILE DROPDOWN LOGIC =================
  const profileBtn = document.getElementById('profile-btn');
  const profileDropdown = document.getElementById('profile-dropdown');

  if (profileBtn && profileDropdown) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!profileBtn.contains(e.target)) {
        profileDropdown.classList.remove('show');
      }
    });
  }

  // ================= NOTIFICATION DROPDOWN =================
  const notificationBell = document.getElementById('notification-bell');
  const notificationDropdown = document.getElementById('notification-dropdown');
  const notificationList = document.getElementById('notification-list');
  const notificationEmpty = document.getElementById('notification-empty');
  const clearNotifications = document.getElementById('clear-notifications');

  // Load notifications from Backend API
  async function loadNotifications() {
    const email = localStorage.getItem('userEmail');
    if (!email) return;
    try {
      const res = await fetch(`${API_URL}/notifications?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        renderNotifications(data.notifications || []);
      }
    } catch (e) { console.error('Failed to load notifications', e); }
  }

  function renderNotifications(notifications) {
    if (!notificationList) return;

    if (notifications.length === 0) {
      notificationList.innerHTML = '<div class="notification-empty">No notifications</div>';
      if (notificationBell) {
        const badge = notificationBell.querySelector('.badge');
        if (badge) badge.style.display = 'none';
      }
      return;
    }

    notificationList.innerHTML = notifications.map(n => `
      <div class="notification-item" data-id="${n.id}">
        <div class="notification-icon ${n.type}"><i class="fa-solid fa-${getNotificationIcon(n.type)}"></i></div>
        <div class="notification-content">
          <div class="notification-title">${n.title}</div>
          <div class="notification-description">${n.message}</div>
          <div class="notification-time">${n.time}</div>
        </div>
      </div>
    `).join('');

    // Update badge count
    const badge = notificationBell?.querySelector('.badge');
    if (badge) {
      badge.textContent = notifications.length;
      badge.style.display = notifications.length > 0 ? 'block' : 'none';
    }
  }

  function getNotificationIcon(type) {
    const icons = {
      upload: 'cloud-arrow-up',
      share: 'share-nodes',
      download: 'download',
      system: 'gear'
    };
    return icons[type] || 'bell';
  }

  if (notificationBell && notificationDropdown) {
    notificationBell.addEventListener('click', (e) => {
      e.stopPropagation();
      notificationDropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!notificationBell.contains(e.target)) {
        notificationDropdown.classList.remove('active');
      }
    });
  }

  if (clearNotifications) {
    clearNotifications.addEventListener('click', async (e) => {
      e.stopPropagation();
      const email = localStorage.getItem('userEmail');
      if (email) {
        try {
          await fetch(`${API_URL}/notifications/read?email=${encodeURIComponent(email)}`, { method: 'PUT' });
          renderNotifications([]);
        } catch (err) { console.error(err); }
      }
    });
  }

  // Backwards compatibility for dashboard init
  function initDemoNotifications() {
    // Left empty as we no longer use demo notifications
  }

  // ================= LOGOUT LOGIC =================
  const logoutBtn = document.getElementById('logout-btn');
  const topbarLogoutBtn = document.getElementById('topbar-logout-btn');

  function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('username');
    localStorage.removeItem('userEmail');

    if (dashboardContainer) {
        dashboardContainer.classList.add('fade-out');
    }

    setTimeout(() => {
        window.location.href = '../Login page/index.html';
    }, 300);
  }

  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  if (topbarLogoutBtn) topbarLogoutBtn.addEventListener('click', handleLogout);

  // ================= SETTINGS PAGE LOGIC =================
  const userEmail = localStorage.getItem('userEmail');

  // Enhanced API error handling wrapper
  async function apiFetch(url, options = {}) {
    try {
      const response = await fetch(`${API_URL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        let errorMessage = 'An error occurred';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  // Change Password Flow
  const updatePassBtn = document.getElementById('update-password-btn');
  if (updatePassBtn) {
    updatePassBtn.addEventListener('click', async () => {
      const currentPassword = document.getElementById('current-password').value;
      const newPassword = document.getElementById('new-password').value;
      const msgBox = document.getElementById('password-msg');

      if (!currentPassword || !newPassword) {
        msgBox.textContent = "Please fill in both fields.";
        msgBox.style.display = "block";
        msgBox.style.backgroundColor = "#fee2e2";
        msgBox.style.color = "#ef4444";
        return;
      }

      updatePassBtn.textContent = "Updating...";
      msgBox.style.display = "none";

      try {
        const response = await apiFetch('/change-password', {
          method: 'POST',
          body: JSON.stringify({
            email: userEmail,
            current_password: currentPassword,
            new_password: newPassword
          })
        });

        msgBox.textContent = "Password updated successfully!";
        msgBox.style.display = "block";
        msgBox.style.backgroundColor = "#dcfce7";
        msgBox.style.color = "#166534";
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';

        showToast({ title: 'Success', message: 'Password updated successfully', type: 'success' });
      } catch (error) {
        msgBox.textContent = error.message || "Failed to update password.";
        msgBox.style.display = "block";
        msgBox.style.backgroundColor = "#fee2e2";
        msgBox.style.color = "#ef4444";
        showToast({ title: 'Error', message: error.message, type: 'error' });
      }
      updatePassBtn.textContent = "Update Password";
    });
  }

  // Delete Account Flow
  const triggerDeleteBtn = document.getElementById('trigger-delete-btn');
  const deleteModal = document.getElementById('delete-modal');
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  const deleteMsg = document.getElementById('delete-msg');
  const modalErrorMsg = document.getElementById('modal-error-msg');

  if (triggerDeleteBtn) {
    triggerDeleteBtn.addEventListener('click', async () => {
      triggerDeleteBtn.textContent = "Sending OTP...";
      triggerDeleteBtn.disabled = true;

      try {
        const response = await apiFetch('/request-delete', {
          method: 'POST',
          body: JSON.stringify({ email: userEmail })
        });

        if (response.ok || response.detail) {
          deleteModal.classList.add('active');
          showToast({ title: 'OTP Sent', message: 'Check your email for the verification code', type: 'info' });
        } else {
          deleteMsg.textContent = "Failed to initiate deletion. Try again.";
          deleteMsg.style.display = "block";
        }
      } catch (error) {
        deleteMsg.textContent = "Network error. Please try again.";
        deleteMsg.style.display = "block";
        showToast({ title: 'Error', message: 'Network error. Please try again.', type: 'error' });
      }
      triggerDeleteBtn.textContent = "Delete Account";
      triggerDeleteBtn.disabled = false;
    });

    cancelDeleteBtn.addEventListener('click', () => {
      deleteModal.classList.remove('active');
      document.getElementById('delete-otp-input').value = '';
      modalErrorMsg.style.display = "none";
    });

    confirmDeleteBtn.addEventListener('click', async () => {
      const otp = document.getElementById('delete-otp-input').value;

      if (!otp) {
        modalErrorMsg.textContent = "Please enter the OTP.";
        modalErrorMsg.style.display = "block";
        return;
      }

      confirmDeleteBtn.textContent = "Verifying...";

      try {
        const response = await apiFetch('/confirm-delete', {
          method: 'POST',
          body: JSON.stringify({ email: userEmail, otp: otp })
        });

        localStorage.removeItem('username');
        localStorage.removeItem('userEmail');
        showToast({ title: 'Account Deleted', message: 'Your account has been deleted', type: 'success' });
        setTimeout(() => {
          window.location.href = '../Login page/index.html';
        }, 1500);
      } catch (error) {
        modalErrorMsg.textContent = error.message || "Invalid OTP.";
        modalErrorMsg.style.display = "block";
        showToast({ title: 'Error', message: error.message, type: 'error' });
      }
      confirmDeleteBtn.textContent = "Verify and Delete";
    });
  }

  // ================= PROFILE PAGE LOGIC =================
  const openEditBtn = document.getElementById('open-edit-modal-btn');
  const editProfileModal = document.getElementById('edit-profile-modal');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const saveProfileBtn = document.getElementById('save-profile-btn');
  const editModalMsg = document.getElementById('edit-modal-msg');

  if (openEditBtn && editProfileModal) {
    openEditBtn.addEventListener('click', () => {
      document.getElementById('edit-username-input').value = localStorage.getItem('username') || '';
      editProfileModal.classList.add('active');
    });

    cancelEditBtn.addEventListener('click', () => {
      editProfileModal.classList.remove('active');
      editModalMsg.style.display = 'none';
      document.getElementById('edit-pic-input').value = '';
    });

    saveProfileBtn.addEventListener('click', async () => {
      const email = localStorage.getItem('userEmail');
      const newUsername = document.getElementById('edit-username-input').value;
      const newBio = document.getElementById('edit-bio-input').value;
      const picFile = document.getElementById('edit-pic-input').files[0];

      saveProfileBtn.textContent = "Saving...";
      saveProfileBtn.disabled = true;

      const formData = new FormData();
      if (email) formData.append('email', email);
      formData.append('username', newUsername);
      formData.append('bio', newBio);

      if (picFile) {
        formData.append('profile_pic', picFile);
      }

      try {
        const response = await fetch(`${API_URL}/update-profile`, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (response.ok) {
          document.getElementById('profile-page-name').textContent = data.username || newUsername;
          if (document.getElementById('display-username')) {
              document.getElementById('display-username').textContent = data.username || newUsername;
          }
          if (data.bio) document.getElementById('profile-bio-display').textContent = data.bio;

          localStorage.setItem('username', data.username || newUsername);

          editProfileModal.classList.remove('active');
          editModalMsg.style.display = 'none';
          showToast({ title: 'Success', message: 'Profile updated successfully', type: 'success' });
        } else {
          editModalMsg.textContent = data.detail || "Failed to save profile.";
          editModalMsg.style.display = 'block';
          editModalMsg.style.color = '#ef4444';
        }
      } catch (error) {
        editModalMsg.textContent = "Network error. Please try again.";
        editModalMsg.style.display = 'block';
        editModalMsg.style.color = '#ef4444';
        showToast({ title: 'Error', message: 'Network error. Please try again.', type: 'error' });
      }

      saveProfileBtn.textContent = "Save Changes";
      saveProfileBtn.disabled = false;
    });
  }

  // ================= DRAG AND DROP UPLOAD =================
  const uploadDropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('file-input');
  const browseBtn = document.getElementById('browse-btn');
  const uploadProgress = document.getElementById('upload-progress');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');

  if (uploadDropzone) {
    browseBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    uploadDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadDropzone.classList.add('dragover');
    });

    uploadDropzone.addEventListener('dragleave', () => {
      uploadDropzone.classList.remove('dragover');
    });

    uploadDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadDropzone.classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    });
  }

  function handleFiles(files) {
    if (!files || files.length === 0) return;

    uploadProgress.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = '0%';

    const formData = new FormData();

    // Backend expects the key 'files' (not 'files[]')
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) formData.append('email', userEmail);

    uploadFiles(formData, files);
  }

  function uploadFiles(formData, files) {
    const fileCount = files.length;
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        progressFill.style.width = percent + '%';
        progressText.textContent = percent + '%';
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200 || xhr.status === 201) {
        try {
          const response = JSON.parse(xhr.responseText);
          showToast({
            title: 'Upload Successful',
            message: `Uploaded ${fileCount} file${fileCount > 1 ? 's' : ''} successfully`,
            type: 'success', duration: 3000
          });

          // Backend automatically logs the upload event through user.py, loadNotifications will pull it.
          loadNotifications();

          // Show success file list below dropzone
          const successList = document.getElementById('upload-success-list');
          if (successList) {
            for (let i = 0; i < files.length; i++) {
              const f = files[i];
              const sizeMb = f.size / (1024 * 1024);
              const sizeStr = sizeMb >= 1 ? `${sizeMb.toFixed(1)} MB` : `${(f.size/1024).toFixed(0)} KB`;
              const item = document.createElement('div');
              item.className = 'upload-success-item';
              item.innerHTML = `
                <i class="fa-solid fa-circle-check"></i>
                <span>${f.name}</span>
                <span class="file-size">${sizeStr}</span>
              `;
              successList.appendChild(item);
            }
          }

          fileInput.value = '';
          setTimeout(() => { uploadProgress.style.display = 'none'; }, 1500);

          // Refresh real data after upload
          loadRecentFiles();
          loadUserProfile();
        } catch (e) {
          showToast({ title: 'Upload Error', message: 'Failed to parse server response', type: 'error' });
        }
      } else {
        showToast({ title: 'Upload Failed', message: 'Server error occurred during upload', type: 'error' });
        uploadProgress.style.display = 'none';
      }
    });

    xhr.addEventListener('error', () => {
      showToast({ title: 'Upload Error', message: 'Network error during upload', type: 'error' });
      uploadProgress.style.display = 'none';
    });

    xhr.open('POST', `${API_URL}/upload`);
    xhr.send(formData);
  }

  // ================= SKELETON LOADERS & DATA FETCHING =================
  function showSkeletonLoader(container, type) {
    if (!container) return;
    container.innerHTML = '';

    if (type === 'stats') {
      for (let i = 0; i < 4; i++) {
        const skeletonCard = document.createElement('div');
        skeletonCard.className = 'card';
        skeletonCard.innerHTML = `
          <div class="card-icon skeleton-circle"></div>
          <div class="card-info">
            <div class="skeleton-text-lg" style="width: 80%;"></div>
            <div class="skeleton-text" style="width: 60%;"></div>
          </div>
        `;
        container.appendChild(skeletonCard);
      }
    } else if (type === 'recent-files') {
      const skeletonTable = document.createElement('table');
      skeletonTable.style.width = '100%';
      skeletonTable.style.borderCollapse = 'collapse';

      const skeletonTbody = document.createElement('tbody');

      for (let i = 0; i < 3; i++) {
        const skeletonRow = document.createElement('tr');
        skeletonRow.innerHTML = `
          <td><div class="skeleton-circle"></div></td>
          <td><div class="skeleton-text" style="width: 70%;"></div></td>
          <td><div class="skeleton-text" style="width: 50%;"></div></td>
          <td>
            <div class="skeleton-rect" style="width: 30px; display: inline-block;"></div>
            <div class="skeleton-rect" style="width: 30px; display: inline-block;"></div>
            <div class="skeleton-rect" style="width: 30px; display: inline-block;"></div>
          </td>
        `;
        skeletonTbody.appendChild(skeletonRow);
      }

      skeletonTable.appendChild(skeletonTbody);
      container.appendChild(skeletonTable);
    }
  }

  // ================= LOAD USER PROFILE FROM API =================
  // Fetches /profile for the logged-in user and updates:
  //  1. localStorage cache (all keys)
  //  2. Any profile UI fields present on the current page
  async function loadUserProfile() {
    const email = localStorage.getItem('userEmail');
    if (!email) return;

    try {
      const response = await fetch(`${API_URL}/profile?email=${encodeURIComponent(email)}`);
      if (!response.ok) return;
      const data = await response.json();

      // ---- Update localStorage cache ----
      if (data.username)       localStorage.setItem('username',       data.username);
      if (data.bio != null)    localStorage.setItem('userBio',        data.bio);
      if (data.joined_date)    localStorage.setItem('userJoined',     data.joined_date);
      localStorage.setItem('userTotalFiles', data.total_files    ?? 0);
      localStorage.setItem('userFilesSent',  data.files_sent     ?? 0);
      localStorage.setItem('userFilesRecv',  data.files_received ?? 0);
      localStorage.setItem('userStorageMB',  data.storage_used_mb ?? 0);
      if (data.profile_pic_url) localStorage.setItem('profilePicUrl', data.profile_pic_url);

      // ---- Topbar username (all pages) ----
      const duEl = document.getElementById('display-username');
      if (duEl) duEl.textContent = data.username;

      // ---- Profile page specific fields ----
      const nameEl    = document.getElementById('profile-page-name');
      const emailEl   = document.getElementById('profile-email-display');
      const bioEl     = document.getElementById('profile-bio-display');
      const joinedEl  = document.getElementById('profile-joined-tag');
      const picEl     = document.getElementById('profile-img-display');

      if (nameEl)   nameEl.textContent   = data.username;
      if (emailEl)  emailEl.textContent  = data.email;
      if (bioEl && data.bio)    bioEl.textContent    = data.bio;
      if (joinedEl && data.joined_date) joinedEl.textContent = `Joined ${data.joined_date}`;
      if (picEl && data.profile_pic_url) {
        picEl.src = `${API_URL}${data.profile_pic_url}`;
      }

      // ---- Stat cards  (profile page) ----
      const elTotalFiles = document.getElementById('stat-total-files');
      const elSent       = document.getElementById('stat-files-sent');
      const elRecv       = document.getElementById('stat-files-received');
      const elStorage    = document.getElementById('stat-storage-used');

      if (elTotalFiles) elTotalFiles.textContent = data.total_files ?? 0;
      if (elSent)       elSent.textContent       = data.files_sent  ?? 0;
      if (elRecv)       elRecv.textContent       = data.files_received ?? 0;
      if (elStorage) {
        const mb = data.storage_used_mb ?? 0;
        elStorage.textContent = mb >= 1024
          ? `${(mb / 1024).toFixed(1)} GB`
          : `${mb.toFixed(1)} MB`;
      }

      // ---- Dashboard stat cards (index.html) ----
      const elDashFiles    = document.getElementById('dash-stat-files');
      const elDashStorage  = document.getElementById('dash-stat-storage');
      const elDashSent     = document.getElementById('dash-stat-sent');
      const elDashReceived = document.getElementById('dash-stat-received');

      if (elDashFiles)    elDashFiles.textContent    = data.total_files ?? 0;
      if (elDashSent)     elDashSent.textContent      = data.files_sent ?? 0;
      if (elDashReceived) elDashReceived.textContent  = data.files_received ?? 0;
      if (elDashStorage) {
        const mb = data.storage_used_mb ?? 0;
        elDashStorage.textContent = mb >= 1024
          ? `${(mb / 1024).toFixed(1)} GB`
          : `${mb.toFixed(1)} MB`;
      }

      // ---- Refresh storage bars (index.html + profile.html) ----
      const mb = data.storage_used_mb ?? 0;
      const QUOTA = 1024;
      const pct = Math.min((mb / QUOTA) * 100, 100).toFixed(1);
      const mbStr = mb >= 1024 ? `${(mb/1024).toFixed(2)} GB of 1 GB` : `${mb.toFixed(1)} MB of 1 GB`;

      ['dash-storage-fill', 'storage-fill'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.style.width = pct + '%'; if (parseFloat(pct) >= 80) el.classList.add('warn', 'warning'); }
      });
      ['dash-storage-text', 'storage-text'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = mbStr; });
      ['dash-storage-pct', 'storage-pct'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = pct + '%'; });

    } catch (err) {
      console.warn('Profile sync failed, using cached data.', err);
    }

    // ---- Load activity chart + feed from /activity (profile page only) ----
    if (document.getElementById('chart-bars') || document.getElementById('activity-feed')) {
      try {
        const actRes  = await fetch(`${API_URL}/activity?email=${encodeURIComponent(localStorage.getItem('userEmail'))}`);
        if (actRes.ok) {
          const actData = await actRes.json();
          // Store chart data globally so the toggle buttons can re-render
          window._activityChart = actData.chart;
          renderActivityChart(actData.chart, window._chartMode || 'receive');
          renderActivityFeed(actData.events);
        }
      } catch { /* use demo data already rendered */ }
    }

  }

  // ================= LOAD STATS (reads localStorage cache, then live API) =================
  function loadStats() {
    const statsContainer = document.getElementById('stats-container');
    if (!statsContainer) return;

    const totalFiles = localStorage.getItem('userTotalFiles') ?? 0;
    const filesSent  = localStorage.getItem('userFilesSent')  ?? 0;
    const filesRecv  = localStorage.getItem('userFilesRecv')  ?? 0;
    const rawMb      = parseFloat(localStorage.getItem('userStorageMB') || '0');
    const storage    = rawMb >= 1024 ? `${(rawMb/1024).toFixed(1)} GB` : `${rawMb.toFixed(1)} MB`;

    statsContainer.innerHTML = `
      <div class="card glass-panel">
        <div class="card-icon blue"><i class="fa-solid fa-file-lines"></i></div>
        <div class="card-info"><p>Files Uploaded</p><h3 id="dash-stat-files">${totalFiles}</h3></div>
      </div>
      <div class="card glass-panel">
        <div class="card-icon green"><i class="fa-solid fa-database"></i></div>
        <div class="card-info"><p>Storage Used</p><h3 id="dash-stat-storage">${storage}</h3></div>
      </div>
      <div class="card glass-panel">
        <div class="card-icon light-blue"><i class="fa-solid fa-paper-plane"></i></div>
        <div class="card-info"><p>Files Sent</p><h3 id="dash-stat-sent">${filesSent}</h3></div>
      </div>
      <div class="card glass-panel">
        <div class="card-icon purple"><i class="fa-solid fa-download"></i></div>
        <div class="card-info"><p>Files Received</p><h3 id="dash-stat-received">${filesRecv}</h3></div>
      </div>
    `;
  }

  // ================= LOAD RECENT FILES FROM API =================
  async function loadRecentFiles() {
    const container = document.getElementById('recent-files-container');
    if (!container) return;

    const email = localStorage.getItem('userEmail');
    if (!email) { container.innerHTML = '<p style="padding:20px;color:var(--text-muted);">Please log in to view files.</p>'; return; }

    showSkeletonLoader(container, 'recent-files');

    try {
      const res  = await fetch(`${API_URL}/files?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      const files = (data.files || []).slice(0, 8); // show 8 most recent

      if (!files.length) {
        container.innerHTML = '<p style="padding:20px;color:var(--text-muted);">No files uploaded yet. Try uploading one above!</p>';
        return;
      }

      const TYPE_ICONS = {
        pdf:'fa-file-pdf', image:'fa-file-image', video:'fa-file-video',
        audio:'fa-file-audio', archive:'fa-file-zipper', code:'fa-file-code',
        doc:'fa-file-word', spreadsheet:'fa-file-excel', slides:'fa-file-powerpoint',
        text:'fa-file-lines', file:'fa-file'
      };
      const TYPE_COLORS = {
        pdf:'#ef4444', image:'#22c55e', video:'#3b82f6', audio:'#a855f7',
        archive:'#f59e0b', code:'#6366f1', doc:'#3b82f6', spreadsheet:'#22c55e',
        slides:'#f97316', text:'#94a3b8', file:'#94a3b8'
      };

      container.innerHTML = `
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr>
            <th style="text-align:left;padding:12px 16px;font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);border-bottom:1px solid var(--border-glass);">Name</th>
            <th style="text-align:left;padding:12px 16px;font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);border-bottom:1px solid var(--border-glass);">Type</th>
            <th style="text-align:left;padding:12px 16px;font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);border-bottom:1px solid var(--border-glass);">Size</th>
            <th style="text-align:left;padding:12px 16px;font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);border-bottom:1px solid var(--border-glass);">Date</th>
          </tr></thead>
          <tbody>
            ${files.map(f => `
              <tr style="transition:background .15s;" onmouseover="this.style.background='rgba(255,255,255,.04)'" onmouseout="this.style.background='transparent'">
                <td style="padding:13px 16px;">
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:34px;height:34px;border-radius:8px;background:${TYPE_COLORS[f.type] || '#94a3b8'}22;border:1px solid var(--border-glass);display:flex;align-items:center;justify-content:center;color:${TYPE_COLORS[f.type] || '#94a3b8'};font-size:14px;">
                      <i class="fa-solid ${TYPE_ICONS[f.type] || 'fa-file'}"></i>
                    </div>
                    <span style="font-size:13.5px;font-weight:600;color:var(--text-main);">${f.name}</span>
                  </div>
                </td>
                <td style="padding:13px 16px;font-size:13px;color:var(--text-muted);">${f.type.charAt(0).toUpperCase()+f.type.slice(1)}</td>
                <td style="padding:13px 16px;font-size:13px;color:var(--text-muted);">${f.size}</td>
                <td style="padding:13px 16px;font-size:13px;color:var(--text-muted);">${f.uploaded_at}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch {
      container.innerHTML = '<p style="padding:20px;color:var(--text-muted);">Could not load files. Is the server running?</p>';
    }
  }

  // Initialize dashboard data
  function initializeDashboard() {
    loadStats();          // render cached values instantly
    loadRecentFiles();
    loadNotifications();
    initDemoNotifications();
    loadUserProfile();    // then sync live from API and update everything
  }

  // Auto-initialize on dashboard page
  if (document.getElementById('stats-container') || document.getElementById('recent-files-container')) {
    initializeDashboard();
  }

  // Also sync profile data on any page (topbar username, profile page fields)
  if (!document.getElementById('stats-container')) {
    loadUserProfile();
  }

});

// ================= GLOBAL FILE ACTIONS =================
window.downloadFile = async function(id, name) {
  const email = localStorage.getItem('userEmail');
  if (email) {
    try {
      await fetch(`http://127.0.0.1:8000/track/download/${id}?email=${encodeURIComponent(email)}`, { method: 'POST' });
    } catch (e) { console.error('Failed to track download', e); }
  }
  
  const a = document.createElement('a');
  a.href = `http://127.0.0.1:8000/uploads/files/${id}`;
  a.download = name;
  a.click();
};

window.shareFile = async function(id) {
  const email = localStorage.getItem('userEmail');
  
  // Dynamically build the frontend public link
  const currentUrl = window.location.href;
  const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/'));
  const url = `${baseUrl}/download.html?id=${id}`;
  
  try {
    await navigator.clipboard.writeText(url);
    if (email) {
      await fetch(`http://127.0.0.1:8000/track/share/${id}?email=${encodeURIComponent(email)}`, { method: 'POST' });
    }
    const tc = document.querySelector('.toast-container');
    if (tc) {
      const toast = document.createElement('div');
      toast.className = 'toast success slideIn';
      toast.innerHTML = `<div class="toast-icon success"><i class="fa-solid fa-check-circle"></i></div><div class="toast-content"><div class="toast-title">Link Copied</div><div class="toast-message">Share link copied to clipboard!</div></div>`;
      tc.appendChild(toast);
      setTimeout(() => { toast.classList.replace('slideIn', 'slideOut'); setTimeout(() => toast.remove(), 300); }, 3000);
    } else {
      alert('Share link copied to clipboard!');
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};

window.deleteFile = async function(id, name, btn) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  const email = localStorage.getItem('userEmail');
  btn.disabled = true;
  try {
    const res = await fetch(`http://127.0.0.1:8000/files/${id}?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
    if (res.ok) {
      const row = btn.closest('tr');
      row.style.opacity = '0';
      row.style.transition = 'opacity 0.3s ease';
      setTimeout(() => row.remove(), 300);
    } else {
      btn.disabled = false;
    }
  } catch { 
    btn.disabled = false; 
  }
};