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

  // Load notifications from localStorage
  function loadNotifications() {
    const notifications = JSON.parse(localStorage.getItem('fileShareNotifications') || '[]');
    renderNotifications(notifications);
  }

  function renderNotifications(notifications) {
    if (!notificationList) return;

    if (notifications.length === 0) {
      notificationList.innerHTML = '<div class="notification-empty">No notifications</div>';
      return;
    }

    notificationList.innerHTML = notifications.map(n => `
      <div class="notification-item" data-id="${n.id}">
        <div class="notification-icon ${n.type}"><i class="fa-solid fa-${getNotificationIcon(n.type)}"></i></div>
        <div class="notification-content">
          <div class="notification-title">${n.title}</div>
          <div class="notification-description">${n.description}</div>
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

  function addNotification(notification) {
    const notifications = JSON.parse(localStorage.getItem('fileShareNotifications') || '[]');
    notifications.unshift({
      id: Date.now(),
      ...notification
    });
    // Keep only last 10 notifications
    localStorage.setItem('fileShareNotifications', JSON.stringify(notifications.slice(0, 10)));
    renderNotifications(notifications);
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
    clearNotifications.addEventListener('click', (e) => {
      e.stopPropagation();
      localStorage.setItem('fileShareNotifications', '[]');
      renderNotifications([]);
    });
  }

  // Add demo notifications if none exist
  function initDemoNotifications() {
    const notifications = JSON.parse(localStorage.getItem('fileShareNotifications') || '[]');
    if (notifications.length === 0) {
      const demoNotifications = [
        { title: 'File Uploaded', description: 'report.pdf uploaded successfully', time: 'Just now', type: 'upload' },
        { title: 'File Shared', description: 'You shared photo.jpg with john@example.com', time: '5 min ago', type: 'share' },
        { title: 'Download Complete', description: 'video.mp4 downloaded successfully', time: '1 hour ago', type: 'download' }
      ];
      localStorage.setItem('fileShareNotifications', JSON.stringify(demoNotifications));
      renderNotifications(demoNotifications);
    }
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

    for (let i = 0; i < files.length; i++) {
      formData.append('files[]', files[i]);
    }

    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      formData.append('email', userEmail);
    }

    uploadFiles(formData, files.length);
  }

  function uploadFiles(formData, fileCount) {
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
            type: 'success',
            duration: 3000
          });

          addNotification({
            title: 'Files Uploaded',
            description: `${fileCount} file${fileCount > 1 ? 's' : ''} uploaded successfully`,
            time: 'Just now',
            type: 'upload'
          });

          fileInput.value = '';

          setTimeout(() => {
            uploadProgress.style.display = 'none';
          }, 1500);

          loadRecentFiles();
        } catch (e) {
          showToast({
            title: 'Upload Error',
            message: 'Failed to parse server response',
            type: 'error'
          });
        }
      } else {
        showToast({
          title: 'Upload Failed',
          message: 'Server error occurred during upload',
          type: 'error'
        });
      }
    });

    xhr.addEventListener('error', () => {
      showToast({
        title: 'Upload Error',
        message: 'Network error during upload',
        type: 'error'
      });
    });

    xhr.addEventListener('abort', () => {
      showToast({
        title: 'Upload Cancelled',
        message: 'Upload was cancelled',
        type: 'warning'
      });
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

  // Load stats with skeleton loader
  function loadStats() {
    const statsContainer = document.getElementById('stats-container');
    if (!statsContainer) return;

    showSkeletonLoader(statsContainer, 'stats');

    // Simulate API call - replace with actual API call in production
    setTimeout(() => {
      statsContainer.innerHTML = `
        <div class="card"><div class="card-icon blue"><i class="fa-solid fa-file-lines"></i></div><div class="card-info"><p>Files Uploaded</p><h3>128</h3></div></div>
        <div class="card"><div class="card-icon green"><i class="fa-solid fa-database"></i></div><div class="card-info"><p>Storage Used</p><h3>6.8GB</h3></div></div>
        <div class="card"><div class="card-icon light-blue"><i class="fa-solid fa-link"></i></div><div class="card-info"><p>Shared Links</p><h3>24</h3></div></div>
        <div class="card"><div class="card-icon purple"><i class="fa-solid fa-download"></i></div><div class="card-info"><p>Total Downloads</p><h3>542</h3></div></div>
      `;
    }, 800);
  }

  // Load recent files with skeleton loader
  function loadRecentFiles() {
    const recentFilesContainer = document.getElementById('recent-files-container');
    if (!recentFilesContainer) return;

    showSkeletonLoader(recentFilesContainer, 'recent-files');

    // Simulate API call - replace with actual API call in production
    setTimeout(() => {
      recentFilesContainer.innerHTML = `
        <table>
          <thead><tr><th>File Name</th><th>Size</th><th>Uploaded</th><th>Actions</th></tr></thead>
          <tbody>
            <tr><td><i class="fa-solid fa-file-pdf" style="color: #ff4747;"></i> report.pdf</td><td>2.5 MB</td><td>Today</td><td><button class="action-btn"><i class="fa-solid fa-download"></i></button> <button class="action-btn"><i class="fa-solid fa-link"></i></button> <button class="action-btn"><i class="fa-solid fa-trash"></i></button></td></tr>
            <tr><td><i class="fa-solid fa-file-video" style="color: #2b5cff;"></i> video.mp4</td><td>1.8 GB</td><td>Yesterday</td><td><button class="action-btn"><i class="fa-solid fa-download"></i></button> <button class="action-btn"><i class="fa-solid fa-link"></i></button> <button class="action-btn"><i class="fa-solid fa-trash"></i></button></td></tr>
            <tr><td><i class="fa-solid fa-file-image" style="color: #10b981;"></i> photo.jpg</td><td>1.2 MB</td><td>Today</td><td><button class="action-btn"><i class="fa-solid fa-download"></i></button> <button class="action-btn"><i class="fa-solid fa-link"></i></button> <button class="action-btn"><i class="fa-solid fa-trash"></i></button></td></tr>
            <tr><td><i class="fa-solid fa-file-code" style="color: #6366f1;"></i> script.js</td><td>45 KB</td><td>Today</td><td><button class="action-btn"><i class="fa-solid fa-download"></i></button> <button class="action-btn"><i class="fa-solid fa-link"></i></button> <button class="action-btn"><i class="fa-solid fa-trash"></i></button></td></tr>
          </tbody>
        </table>
      `;
    }, 800);
  }

  // Initialize dashboard data
  function initializeDashboard() {
    loadStats();
    loadRecentFiles();
    loadNotifications();
    initDemoNotifications();
  }

  // Auto-initialize on dashboard page
  if (document.getElementById('stats-container') || document.getElementById('recent-files-container')) {
    initializeDashboard();
  }

});