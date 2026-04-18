document.addEventListener('DOMContentLoaded', () => {

  const API_URL = "http://127.0.0.1:8000";
  const dashboardContainer = document.querySelector('.dashboard');
  
  // ================= GUEST ROLE CHECK =================
  const isGuest = localStorage.getItem('isGuest') === 'true';

  // ================= GUEST UPGRADE MODAL =================
  const guestUpgradeModal = document.getElementById('guest-upgrade-modal');
  const closeGuestUpgradeBtn = document.getElementById('close-guest-upgrade-modal');
  const dismissUpgradeBtn = document.getElementById('dismiss-upgrade-btn');
  
  if (guestUpgradeModal) {
      const closeUpgradeModal = () => guestUpgradeModal.classList.remove('active');
      if (closeGuestUpgradeBtn) closeGuestUpgradeBtn.addEventListener('click', closeUpgradeModal);
      if (dismissUpgradeBtn) dismissUpgradeBtn.addEventListener('click', closeUpgradeModal);
  }

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

        if (!targetUrl || targetUrl === '#' || link.id === 'logout-btn' || link.id === 'topbar-logout-btn' || link.id === 'sidebar-logout-btn') {
            return;
        }

        e.preventDefault();
        dashboardContainer.classList.add('fade-out');

        // Slightly faster transition for perceived performance
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 250); 
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
  
  const displayNameWelcome = document.getElementById('display-name');
  if (displayNameWelcome && storedUsername) displayNameWelcome.textContent = `Welcome, ${storedUsername}`;

  const guestBadge = document.getElementById('guest-badge');
  if (guestBadge && isGuest) {
      guestBadge.style.display = 'inline-block';
  }

  const openFriendsBtn = document.getElementById('open-friends-btn');
  if (isGuest && openFriendsBtn) {
      openFriendsBtn.style.display = 'none';
  }

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
        const notifications = data.notifications || [];
        if (isGuest) {
            notifications.unshift({
                type: 'system',
                title: 'Limited Guest Mode',
                message: 'Create a full account to save files, get a permanent username, and add friends! <br><a href="../Signup page/index.html" style="display:inline-block; margin-top:8px; color:#4facfe; font-weight:bold; text-decoration:underline;">Sign Up Now</a>',
                time: 'Just now'
            });
        }
        renderNotifications(notifications);
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
  const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');

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
  if (sidebarLogoutBtn) sidebarLogoutBtn.addEventListener('click', handleLogout);

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
  const openEditBtn2 = document.getElementById('open-edit-modal-btn-2');
  const editProfileModal = document.getElementById('edit-profile-modal');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const saveProfileBtn = document.getElementById('save-profile-btn');
  const editModalMsg = document.getElementById('edit-modal-msg');

  if ((openEditBtn || openEditBtn2) && editProfileModal) {
    const handleOpenModal = () => {
      document.getElementById('edit-username-input').value = localStorage.getItem('username') || '';
      const bioInput = document.getElementById('edit-bio-input');
      if (bioInput) bioInput.value = localStorage.getItem('userBio') || '';
      editProfileModal.classList.add('active');
    };

    if (openEditBtn) openEditBtn.addEventListener('click', handleOpenModal);
    if (openEditBtn2) openEditBtn2.addEventListener('click', handleOpenModal);

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
          if (data.bio) {
              document.getElementById('profile-bio-display').textContent = data.bio;
              localStorage.setItem('userBio', data.bio);
          }
          if (data.profile_pic_url) {
              const picUrl = `${API_URL}${data.profile_pic_url}`;
              document.getElementById('profile-img-display').src = picUrl;
              localStorage.setItem('profilePicUrl', data.profile_pic_url);
              // Clear the local base64 preview if it exists
              localStorage.removeItem('profilePic');
          }

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

  // ================= UPLOAD MODAL LOGIC =================
  const sendFilesBtn = document.getElementById('send-files-btn');
  const uploadModal = document.getElementById('upload-modal');
  const closeUploadModal = document.getElementById('close-upload-modal');

  if (sendFilesBtn && uploadModal && closeUploadModal) {
    sendFilesBtn.addEventListener('click', (e) => {
      e.preventDefault();
      uploadModal.classList.add('active');
    });

    const closeModal = () => {
      // Don't close while an upload is in progress
      const prog = document.getElementById('upload-progress');
      if (prog && prog.style.display === 'block') return;
      uploadModal.classList.remove('active');
      const successList = document.getElementById('upload-success-list');
      if (successList) successList.innerHTML = '';
      const uploadProgress = document.getElementById('upload-progress');
      if (uploadProgress) uploadProgress.style.display = 'none';
    };

    closeUploadModal.addEventListener('click', closeModal);

    uploadModal.addEventListener('click', (e) => {
      if (e.target === uploadModal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && uploadModal.classList.contains('active')) {
        closeModal();
      }
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
    browseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    // Stop all clicks inside upload-actions from bubbling to dropzone
    const uploadActionsDiv = document.getElementById('upload-actions');
    if (uploadActionsDiv) {
      uploadActionsDiv.addEventListener('click', (e) => e.stopPropagation());
    }

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

  window.pendingUploadData = null;
  let pendingUploadData = null;

  function handleFiles(files) {
    if (!files || files.length === 0) return;

    // Show files list early
    const successList = document.getElementById('upload-success-list');
    if (successList) {
      successList.innerHTML = '';
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const sizeMb = f.size / (1024 * 1024);
        const sizeStr = sizeMb >= 1 ? `${sizeMb.toFixed(1)} MB` : `${(f.size/1024).toFixed(0)} KB`;
        const item = document.createElement('div');
        item.className = 'upload-success-item';
        item.innerHTML = `
          <i class="fa-solid fa-file" style="color: var(--text-muted); opacity: 0.6;"></i>
          <span>${f.name}</span>
          <span class="file-size">${sizeStr}</span>
        `;
        successList.appendChild(item);
      }
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) formData.append('email', userEmail);

    pendingUploadData = { formData, files };
    window.pendingUploadData = pendingUploadData;
    
    // Show upload and P2P actions
    const uploadActions = document.getElementById('upload-actions');
    const bBtn = document.getElementById('browse-btn');
    
    // Also show the target username select for P2P
    const p2pTargetSelect = document.getElementById('p2p-target-username');
    const p2pTargetInput = document.getElementById('p2p-target-guest');
    
    if (isGuest) {
        if (p2pTargetSelect) p2pTargetSelect.style.display = 'none';
        if (p2pTargetInput) p2pTargetInput.style.display = 'block';
    } else {
        if (p2pTargetInput) p2pTargetInput.style.display = 'none';
        if (p2pTargetSelect) p2pTargetSelect.style.display = 'block';
    }

    if (uploadActions) {
      uploadActions.style.display = 'flex';
      if (bBtn) bBtn.style.display = 'none';
    }
  }

  // Handle the manual Send button click
  const startUploadBtn = document.getElementById('start-upload-btn');
  const startP2pBtn = document.getElementById('start-p2p-btn');
  const startOfflineBtn = document.getElementById('start-offline-btn');
  const uploadActions = document.getElementById('upload-actions');
  const sendBox = document.getElementById('send-box');

  // Hide cloud upload & send-box for guests
  if (isGuest && startUploadBtn) startUploadBtn.style.display = 'none';
  if (isGuest && sendBox) sendBox.style.display = 'none';

  // ================= SEND BOX TAB SWITCHING =================
  const sendTabs = document.querySelectorAll('.send-tab');
  const sendPanels = document.querySelectorAll('.send-tab-content');

  sendTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const target = tab.dataset.tab;
      sendTabs.forEach(t => t.classList.remove('active'));
      sendPanels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.getElementById(`send-panel-${target}`);
      if (panel) panel.classList.add('active');
    });
  });

  // ================= LIVE USER SEARCH =================
  let searchSelectedUser = null; // { username, email, profile_pic }
  let searchTimeout = null;
  const searchInput = document.getElementById('offline-recipient-username');
  const searchResults = document.getElementById('live-search-results');
  const selectedCard = document.getElementById('selected-user-card');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      e.stopPropagation();
      const q = searchInput.value.trim();
      if (q.length < 1) {
        if (searchResults) searchResults.style.display = 'none';
        return;
      }
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => liveSearchUsers(q), 300);
    });

    searchInput.addEventListener('click', (e) => e.stopPropagation());
  }

  async function liveSearchUsers(query) {
    const email = localStorage.getItem('userEmail');
    if (!email) return;
    try {
      const res = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}&email=${encodeURIComponent(email)}`);
      if (!res.ok) return;
      const data = await res.json();
      const users = data.results || [];

      if (!searchResults) return;

      if (users.length === 0) {
        searchResults.innerHTML = '<div class="live-search-empty">No users found</div>';
        searchResults.style.display = 'block';
        return;
      }

      searchResults.innerHTML = users.map(u => {
        const pic = u.profile_pic
          ? `<img src="${API_URL}/${u.profile_pic}" alt="${u.username}" />`
          : `<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&background=4facfe&color=fff&size=30" alt="${u.username}" />`;
        return `
          <div class="live-search-item" data-username="${u.username}" data-email="${u.email}" data-pic="${u.profile_pic || ''}">
            ${pic}
            <div>
              <div class="live-search-name">${u.username}</div>
              <div class="live-search-email">${u.email}</div>
            </div>
          </div>`;
      }).join('');

      searchResults.style.display = 'block';

      // Click handler for each result
      searchResults.querySelectorAll('.live-search-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          searchSelectedUser = {
            username: item.dataset.username,
            email: item.dataset.email,
            profile_pic: item.dataset.pic,
          };
          showSelectedUser(searchSelectedUser);
          searchResults.style.display = 'none';
          searchInput.value = '';
        });
      });

    } catch (e) {
      console.error('Live search failed', e);
    }
  }

  function showSelectedUser(user) {
    if (!selectedCard) return;
    const pic = user.profile_pic
      ? `<img src="${API_URL}/${user.profile_pic}" alt="${user.username}" />`
      : `<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=4facfe&color=fff&size=32" alt="${user.username}" />`;
    selectedCard.innerHTML = `
      ${pic}
      <div class="selected-user-info">
        <div class="selected-user-name">${user.username}</div>
        <div class="selected-user-email">${user.email}</div>
      </div>
      <button class="selected-user-clear" title="Clear"><i class="fa-solid fa-xmark"></i></button>`;
    selectedCard.style.display = 'flex';

    selectedCard.querySelector('.selected-user-clear').addEventListener('click', (e) => {
      e.stopPropagation();
      searchSelectedUser = null;
      selectedCard.style.display = 'none';
    });
  }

  // ================= GET TARGET USERNAME (from active tab) =================
  function getTargetUsername() {
    const activeTab = document.querySelector('.send-tab.active');
    if (!activeTab) return null;

    if (activeTab.dataset.tab === 'friends') {
      // Friends tab
      if (isGuest) {
        const guestInput = document.getElementById('p2p-target-guest');
        return guestInput ? guestInput.value.trim() : null;
      }
      const select = document.getElementById('p2p-target-username');
      return select ? select.value.trim() : null;
    } else {
      // Search tab → use selected user card
      if (searchSelectedUser) {
        return searchSelectedUser.username;
      }
      return null;
    }
  }

  // ================= CLOUD UPLOAD =================
  if (startUploadBtn && !isGuest) {
    startUploadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (pendingUploadData) {
        uploadFiles(pendingUploadData.formData, pendingUploadData.files);
        if (uploadActions) uploadActions.style.display = 'none';
        const bBtn = document.getElementById('browse-btn');
        if (bBtn) bBtn.style.display = 'flex';
        pendingUploadData = null;
        window.pendingUploadData = null;
      }
    });
  }

  // ================= P2P SEND =================
  if (startP2pBtn) {
    startP2pBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!pendingUploadData) return;

      const target = getTargetUsername();
      if (!target) {
        showToast({title: 'Error', message: 'Select a user to send to', type: 'error'});
        return;
      }

      if (window.startP2PTransfer) {
        window.startP2PTransfer(target, pendingUploadData.files);
      } else {
        showToast({title: 'Error', message: 'WebRTC system not initialized', type: 'error'});
      }

      if (uploadActions) uploadActions.style.display = 'none';
      const bBtn = document.getElementById('browse-btn');
      if (bBtn) bBtn.style.display = 'flex';
      pendingUploadData = null;
      window.pendingUploadData = null;
    });
  }

  // ================= OFFLINE CHUNKED TRANSFER =================
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB
  const MAX_TRANSFER_SIZE = 100 * 1024 * 1024; // 100 MB

  async function uploadChunkedTransfer(file, recipientUsername) {
    if (file.size > MAX_TRANSFER_SIZE) {
      showToast({
        title: 'File Too Large',
        message: `Max offline transfer size is 100 MB. Use P2P for larger files.`,
        type: 'error', duration: 5000
      });
      return;
    }

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const senderEmail = localStorage.getItem('userEmail');

    // Show progress
    const uploadProgress = document.getElementById('upload-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    if (uploadProgress) uploadProgress.style.display = 'block';
    if (progressFill) progressFill.style.width = '0%';
    if (progressText) progressText.textContent = 'Initializing...';

    try {
      console.log('[Transfer] Step 1: Init', { file: file.name, recipientUsername, totalChunks });
      // Step 1: Init transfer
      const initRes = await fetch(`${API_URL}/transfer/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_email: senderEmail,
          recipient_username: recipientUsername,
          filename: file.name,
          file_size: file.size,
          total_chunks: totalChunks,
        })
      });

      if (!initRes.ok) {
        const err = await initRes.json();
        throw new Error(err.detail || 'Failed to initialize transfer');
      }

      const { transfer_id } = await initRes.json();
      console.log('[Transfer] Step 1 OK, transfer_id:', transfer_id);
      if (progressText) progressText.textContent = 'Uploading...';

      // Step 2: Upload chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const chunk = file.slice(start, start + CHUNK_SIZE);

        const form = new FormData();
        form.append('sender_email', senderEmail);
        form.append('chunk_index', i);
        form.append('chunk', chunk, `chunk_${i}`);

        console.log(`[Transfer] Uploading chunk ${i + 1}/${totalChunks}`);
        const chunkRes = await fetch(`${API_URL}/transfer/chunk/${transfer_id}`, {
          method: 'POST',
          body: form,
        });

        if (!chunkRes.ok) {
          const err = await chunkRes.json();
          throw new Error(err.detail || `Chunk ${i} upload failed`);
        }
        console.log(`[Transfer] Chunk ${i + 1} OK`);

        const pct = Math.round(((i + 1) / totalChunks) * 100);
        if (progressFill) progressFill.style.width = pct + '%';
        if (progressText) progressText.textContent = `Uploading... ${pct}%`;
      }

      // Step 3: Complete
      console.log('[Transfer] Step 3: Complete');
      if (progressText) progressText.textContent = 'Assembling...';
      const completeRes = await fetch(
        `${API_URL}/transfer/complete/${transfer_id}?email=${encodeURIComponent(senderEmail)}`,
        { method: 'POST' }
      );

      if (!completeRes.ok) {
        const err = await completeRes.json();
        throw new Error(err.detail || 'Failed to complete transfer');
      }

      console.log('[Transfer] Complete OK!');
      if (progressText) progressText.textContent = 'Sent successfully!';
      showToast({
        title: 'File Sent!',
        message: `"${file.name}" will be delivered to ${recipientUsername} when they log in.`,
        type: 'success', duration: 5000
      });

      loadNotifications();
      loadUserProfile();

      setTimeout(() => {
        if (uploadProgress) uploadProgress.style.display = 'none';
      }, 2000);

    } catch (error) {
      console.error('[Transfer] Error:', error);
      const msg = error?.message || String(error) || 'Unknown error';
      showToast({ title: 'Transfer Failed', message: msg, type: 'error', duration: 8000 });
      if (uploadProgress) uploadProgress.style.display = 'none';
    }
  }

  // Send Server button handler
  if (startOfflineBtn && !isGuest) {
    startOfflineBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!pendingUploadData) return;

      const target = getTargetUsername();
      if (!target) {
        showToast({ title: 'Error', message: 'Select a user first (from Friends or Search)', type: 'error' });
        return;
      }

      const file = pendingUploadData.files[0];
      uploadChunkedTransfer(file, target);

      if (uploadActions) uploadActions.style.display = 'none';
      const bBtn = document.getElementById('browse-btn');
      if (bBtn) bBtn.style.display = 'flex';
      pendingUploadData = null;
      window.pendingUploadData = null;
    });
  }

  // ================= INCOMING TRANSFERS INBOX =================
  async function loadIncomingTransfers() {
    const email = localStorage.getItem('userEmail');
    if (!email || isGuest) return;

    try {
      const res = await fetch(`${API_URL}/transfer/incoming?email=${encodeURIComponent(email)}`);
      if (!res.ok) return;
      const data = await res.json();
      const transfers = data.transfers || [];

      // Update inbox badge
      const inboxBadge = document.getElementById('inbox-badge');
      if (inboxBadge) {
        if (transfers.length > 0) {
          inboxBadge.textContent = transfers.length;
          inboxBadge.style.display = 'flex';
        } else {
          inboxBadge.style.display = 'none';
        }
      }

      // Render list
      const listEl = document.getElementById('transfer-inbox-list');
      if (!listEl) return;

      if (transfers.length === 0) {
        listEl.innerHTML = `
          <div class="transfer-inbox-empty">
            <i class="fa-solid fa-box-open"></i>
            <p>No pending transfers.<br>Files sent to you will appear here.</p>
          </div>`;
        return;
      }

      listEl.innerHTML = transfers.map(t => `
        <div class="transfer-item-card" data-transfer-id="${t.id}">
          <div class="transfer-item-icon">
            <i class="fa-solid fa-file-arrow-down"></i>
          </div>
          <div class="transfer-item-info">
            <div class="transfer-item-name" title="${t.filename}">${t.filename}</div>
            <div class="transfer-item-meta">
              <span>From <strong>${t.sender_username}</strong></span>
              <span class="separator"></span>
              <span>${t.size_str}</span>
              <span class="separator"></span>
              <span>${t.sent_at}</span>
            </div>
          </div>
          <div class="transfer-item-actions">
            <button class="transfer-accept-btn" title="Accept & Download" onclick="acceptTransfer('${t.id}', this)">
              <i class="fa-solid fa-check"></i>
            </button>
            <button class="transfer-decline-btn" title="Decline" onclick="declineTransfer('${t.id}', this)">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>`).join('');

    } catch (e) {
      console.error('Failed to load incoming transfers', e);
    }
  }

  // Receive button → open inbox
  const receiveFilesBtn = document.getElementById('receive-files-btn');
  const transferInboxModal = document.getElementById('transfer-inbox-modal');
  const closeTransferInbox = document.getElementById('close-transfer-inbox');

  if (receiveFilesBtn && transferInboxModal) {
    receiveFilesBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (isGuest) {
        showToast({ title: 'Guest Mode', message: 'Create a full account to receive offline transfers.', type: 'info' });
        return;
      }
      loadIncomingTransfers();
      transferInboxModal.classList.add('active');
    });
  }

  if (closeTransferInbox && transferInboxModal) {
    closeTransferInbox.addEventListener('click', () => transferInboxModal.classList.remove('active'));
    transferInboxModal.addEventListener('click', (e) => {
      if (e.target === transferInboxModal) transferInboxModal.classList.remove('active');
    });
  }

  // Expose globally
  window.loadIncomingTransfers = loadIncomingTransfers;

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
          window._activityChart = actData.chart;
          renderActivityChart(actData.chart, window._chartMode || 'receive');
          renderActivityFeed(actData.events);
        } else {
          // No accurate data from API — user requested no dummy data/blank chart
          renderActivityChart({receive:{sun:0,mon:0,tue:0,wed:0,thu:0,fri:0,sat:0}, send:{sun:0,mon:0,tue:0,wed:0,thu:0,fri:0,sat:0}}, 'receive');
          renderActivityFeed([]);
        }
      } catch { 
        renderActivityChart({receive:{sun:0,mon:0,tue:0,wed:0,thu:0,fri:0,sat:0}, send:{sun:0,mon:0,tue:0,wed:0,thu:0,fri:0,sat:0}}, 'receive');
        renderActivityFeed([]);
      }
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
    initFriendships();
    loadIncomingTransfers(); // check for offline transfers
  }

  // Auto-initialize on any page that has dashboard elements
  if (document.getElementById('stats-container') || document.getElementById('recent-files-container')) {
    initializeDashboard();
  } else {
    // For non-dashboard pages, still load user profile and notifications for the topbar
    loadUserProfile();
    loadNotifications();
    initFriendships();
  }

  // ================= FRIENDSHIP SYSTEM LOGIC =================
  function initFriendships() {
    const friendBar = document.getElementById('friend-bar');
    const openBtn = document.getElementById('open-friends-btn');
    const closeBtn = document.getElementById('close-friends-btn');
    const addTrigger = document.getElementById('add-friend-trigger-btn');
    const addModal = document.getElementById('add-friend-modal');
    const closeAddModal = document.getElementById('close-add-friend-modal');
    const searchInput = document.getElementById('friend-search-input');
    const confirmSearchBtn = document.getElementById('confirm-search-user-btn');

    if (!friendBar) return;

    // Toggle Sidebar
    openBtn.addEventListener('click', () => {
      friendBar.classList.add('open');
      loadFriendList();
    });
    closeBtn.addEventListener('click', () => friendBar.classList.remove('open'));

    // Modal Handle
    if (addTrigger) {
      addTrigger.addEventListener('click', () => {
        addModal.classList.add('active');
        document.getElementById('search-result-container').innerHTML = '';
        document.getElementById('add-friend-username-input').value = '';
      });
    }
    if (closeAddModal) closeAddModal.addEventListener('click', () => addModal.classList.remove('active'));

    // Search Friends (Local filter)
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.friend-card').forEach(card => {
          const name = card.querySelector('.friend-name').innerText.toLowerCase();
          card.style.display = name.includes(term) ? 'flex' : 'none';
        });
      });
    }

    // Search New User (Backend)
    if (confirmSearchBtn) {
      confirmSearchBtn.addEventListener('click', searchNewFriend);
    }
    
    // Initial fetch
    loadFriendList();
  }

  async function loadFriendList() {
    const email = localStorage.getItem('userEmail');
    const container = document.getElementById('friend-list-content');
    const badge = document.getElementById('friend-request-badge');
    if (!email || !container) return;

    try {
      const res = await fetch(`${API_URL}/friends?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      
      const { accepted, incoming, outgoing } = data;
      
      if (badge) {
        if (incoming.length > 0) {
          badge.innerText = incoming.length;
          badge.style.display = 'block';
        } else {
          badge.style.display = 'none';
        }
      }

      let html = '';

      // Incoming Pending Section
      if (incoming.length > 0) {
        html += `<div class="friend-section-title">Friend Requests (${incoming.length})</div>`;
        incoming.forEach(p => {
          html += `
            <div class="friend-card">
              <div class="friend-avatar">${(p.username || 'U').charAt(0).toUpperCase()}</div>
              <div class="friend-info">
                <div class="friend-name">${p.username}</div>
                <div class="friend-status-text">Wants to be friends</div>
              </div>
              <div class="friend-actions">
                <div class="friend-action-btn accept" onclick="respondRequest('${p.email}', 'accept')" title="Accept"><i class="fa-solid fa-check"></i></div>
                <div class="friend-action-btn decline" onclick="respondRequest('${p.email}', 'decline')" title="Decline"><i class="fa-solid fa-xmark"></i></div>
              </div>
            </div>
          `;
        });
      }

      // Outgoing Pending Section
      if (outgoing.length > 0) {
        html += `<div class="friend-section-title">Sent Requests (${outgoing.length})</div>`;
        outgoing.forEach(p => {
          html += `
            <div class="friend-card" style="opacity: 0.8;">
              <div class="friend-avatar">${(p.username || 'U').charAt(0).toUpperCase()}</div>
              <div class="friend-info">
                <div class="friend-name">${p.username}</div>
                <div class="friend-status-text">Waiting for response...</div>
              </div>
            </div>
          `;
        });
      }

      // Online Section
      const online = accepted.filter(f => f.online);
      html += `<div class="friend-section-title">Online — ${online.length}</div>`;
      online.forEach(f => {
        html += `
          <div class="friend-card">
            <div class="friend-avatar">
              ${f.profile_pic ? `<img src="${API_URL}${f.profile_pic}" style="width:100%;height:100%;border-radius:inherit;object-fit:cover;">` : (f.username || 'U').charAt(0).toUpperCase()}
              <span class="status-dot online"></span>
            </div>
            <div class="friend-info">
              <div class="friend-name">${f.username}</div>
              <div class="friend-status-text">Active Now</div>
            </div>
          </div>
        `;
      });

      // Offline Section
      const offline = accepted.filter(f => !f.online);
      html += `<div class="friend-section-title">Offline — ${offline.length}</div>`;
      offline.forEach(f => {
        html += `
          <div class="friend-card">
            <div class="friend-avatar">
              ${f.profile_pic ? `<img src="${API_URL}${f.profile_pic}" style="width:100%;height:100%;border-radius:inherit;object-fit:cover;filter:grayscale(1);">` : (f.username || 'U').charAt(0).toUpperCase()}
              <span class="status-dot offline"></span>
            </div>
            <div class="friend-info">
              <div class="friend-name">${f.username}</div>
              <div class="friend-status-text">Offline</div>
            </div>
          </div>
        `;
      });

      if (accepted.length === 0 && incoming.length === 0 && outgoing.length === 0) {
        html = `<div style="text-align:center; padding:40px 20px; color:var(--text-muted);">
          <i class="fa-solid fa-user-group" style="font-size:30px; margin-bottom:15px; opacity:0.3;"></i>
          <p style="font-size:13px;">No friends yet. Click "Add New Friend" to start growing your circle!</p>
        </div>`;
      }

      container.innerHTML = html;
      
      // Update upload modal if it exists
      renderSuggestedFriends(accepted);

    } catch (e) {
      console.error("Error loading friends:", e);
    }
  }

  async function searchNewFriend() {
    const username = document.getElementById('add-friend-username-input').value.trim();
    const resultContainer = document.getElementById('search-result-container');
    const currentEmail = localStorage.getItem('userEmail');
    if (!username) return;

    resultContainer.innerHTML = '<p style="font-size:13px; color:var(--text-muted);">Searching...</p>';

    try {
      const res = await fetch(`${API_URL}/friends/search?username=${encodeURIComponent(username)}&current_email=${encodeURIComponent(currentEmail)}`);
      if (!res.ok) {
        resultContainer.innerHTML = '<p style="font-size:13px; color:#ef4444;">User not found.</p>';
        return;
      }
      const user = await res.json();
      
      let actionHtml = '';
      if (user.status === 'none') {
        actionHtml = `<button class="browse-btn" onclick="sendReq('${user.username}')" style="padding:6px 12px; font-size:12px;">Add Friend</button>`;
      } else if (user.status === 'outgoing') {
        actionHtml = `<span style="font-size:12px; color:var(--text-muted);">Request Sent</span>`;
      } else if (user.status === 'accepted') {
        actionHtml = `<span style="font-size:12px; color:#22c55e;">Already Friends</span>`;
      } else if (user.status === 'self') {
        actionHtml = `<span style="font-size:12px; color:var(--text-muted);">(You)</span>`;
      }

      resultContainer.innerHTML = `
        <div class="friend-card" style="background:rgba(0,0,0,0.03); border:1px solid var(--border-glass); margin-top:10px; cursor:default;">
          <div class="friend-avatar">${user.username.charAt(0).toUpperCase()}</div>
          <div class="friend-info">
            <div class="friend-name">${user.username}</div>
          </div>
          ${actionHtml}
        </div>
      `;
    } catch (e) {
      resultContainer.innerHTML = '<p style="font-size:13px; color:#ef4444;">Error searching user.</p>';
    }
  }

  window.sendReq = async function(username) {
    const email = localStorage.getItem('userEmail');
    try {
      const res = await fetch(`${API_URL}/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, target_username: username })
      });
      if (res.ok) {
        showToast({ title: "Request Sent", message: `Friend request sent to ${username}`, type: "success" });
        searchNewFriend(); // Refresh result
        loadFriendList();
      }
    } catch (e) { console.error(e); }
  };

  window.respondRequest = async function(senderEmail, action) {
    const email = localStorage.getItem('userEmail');
    try {
      const res = await fetch(`${API_URL}/friends/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sender_email: senderEmail, action })
      });
      if (res.ok) {
        showToast({ title: "Friend Added", message: `You are now friends!`, type: "success" });
        loadFriendList();
      }
    } catch (e) { console.error(e); }
  };

  function renderSuggestedFriends(friends) {
    const p2pSelect = document.getElementById('p2p-target-username');
    if (p2pSelect) {
      if (friends.length === 0) {
        p2pSelect.innerHTML = '<option value="">No friends added yet</option>';
      } else {
        p2pSelect.innerHTML = '<option value="">Select a Friend...</option>' + 
          friends.map(f => `<option value="${f.username}">${f.username}</option>`).join('');
      }
    }
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

// ================= GLOBAL TRANSFER ACTIONS =================
window.acceptTransfer = async function(transferId, btn) {
  const email = localStorage.getItem('userEmail');
  if (!email) return;
  
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
  
  try {
    // Accept the transfer
    const res = await fetch(`http://127.0.0.1:8000/transfer/accept/${transferId}?email=${encodeURIComponent(email)}`, {
      method: 'POST'
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to accept transfer');
    }
    
    const data = await res.json();
    
    // Trigger file download
    const downloadUrl = `http://127.0.0.1:8000/transfer/download/${transferId}?email=${encodeURIComponent(email)}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = data.filename || 'received_file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Animate card removal
    const card = btn.closest('.transfer-item-card');
    if (card) {
      card.style.transition = 'all 0.3s ease';
      card.style.opacity = '0';
      card.style.transform = 'translateX(30px)';
      setTimeout(() => card.remove(), 300);
    }
    
    // Show toast
    const tc = document.querySelector('.toast-container');
    if (tc) {
      const toast = document.createElement('div');
      toast.className = 'toast success slideIn';
      toast.innerHTML = `<div class="toast-icon success"><i class="fa-solid fa-check-circle"></i></div><div class="toast-content"><div class="toast-title">File Received!</div><div class="toast-message">${data.filename} downloaded successfully</div></div>`;
      tc.appendChild(toast);
      setTimeout(() => { toast.classList.replace('slideIn', 'slideOut'); setTimeout(() => toast.remove(), 300); }, 3000);
    }
    
    // Refresh badge
    if (window.loadIncomingTransfers) {
      setTimeout(() => window.loadIncomingTransfers(), 500);
    }
    
  } catch (error) {
    const tc = document.querySelector('.toast-container');
    if (tc) {
      const toast = document.createElement('div');
      toast.className = 'toast error slideIn';
      toast.innerHTML = `<div class="toast-icon error"><i class="fa-solid fa-exclamation-triangle"></i></div><div class="toast-content"><div class="toast-title">Error</div><div class="toast-message">${error.message}</div></div>`;
      tc.appendChild(toast);
      setTimeout(() => { toast.classList.replace('slideIn', 'slideOut'); setTimeout(() => toast.remove(), 300); }, 3000);
    }
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-check"></i>';
  }
};

window.declineTransfer = async function(transferId, btn) {
  if (!confirm('Decline this transfer? The file will be permanently deleted.')) return;
  
  const email = localStorage.getItem('userEmail');
  if (!email) return;
  
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
  
  try {
    const res = await fetch(`http://127.0.0.1:8000/transfer/decline/${transferId}?email=${encodeURIComponent(email)}`, {
      method: 'POST'
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to decline transfer');
    }
    
    // Animate card removal
    const card = btn.closest('.transfer-item-card');
    if (card) {
      card.style.transition = 'all 0.3s ease';
      card.style.opacity = '0';
      card.style.transform = 'translateX(-30px)';
      setTimeout(() => card.remove(), 300);
    }
    
    // Refresh badge
    if (window.loadIncomingTransfers) {
      setTimeout(() => window.loadIncomingTransfers(), 500);
    }
    
  } catch (error) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  }
};
