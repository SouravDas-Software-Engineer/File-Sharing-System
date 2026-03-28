document.addEventListener('DOMContentLoaded', () => {
  
  // ================= THEME MEMORY LOGIC =================
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;
  const icon = themeToggle ? themeToggle.querySelector('i') : null;

  // 1. Check the exact same memory slot used by the Login Page
  const savedTheme = localStorage.getItem('fileShareTheme') || 'dark';

  // 2. Apply the saved theme to the dashboard
  if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    if (icon) icon.classList.replace('fa-moon', 'fa-sun');
  } else {
    body.classList.remove('dark-mode');
    if (icon) icon.classList.replace('fa-sun', 'fa-moon');
  }

  // 3. Update memory when toggled from the dashboard
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
  const storedUsername = localStorage.getItem('username');
  
  if (displayUsername && storedUsername) {
    displayUsername.textContent = storedUsername;
  }

  // ================= PROFILE DROPDOWN LOGIC =================
  const profileBtn = document.getElementById('profile-btn');
  const profileDropdown = document.getElementById('profile-dropdown');

  if (profileBtn && profileDropdown) {
    profileBtn.addEventListener('click', (e) => {
      // Prevent the click from immediately bubbling to the document
      e.stopPropagation(); 
      profileDropdown.classList.toggle('show');
    });

    // Close the dropdown if you click anywhere else on the page
    document.addEventListener('click', (e) => {
      if (!profileBtn.contains(e.target)) {
        profileDropdown.classList.remove('show');
      }
    });
  }

  // ================= LOGOUT LOGIC =================
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Clear user data
      localStorage.removeItem('username');
      // Step back one folder, then enter the Login page folder
      window.location.href = '../Login page/index.html'; 
    });
  }
// ================= SETTINGS PAGE LOGIC =================
  const userEmail = localStorage.getItem('userEmail');
  
  // If the email is missing, force them to log in again to set it
  if (!userEmail && window.location.pathname.includes('settings.html')) {
      window.location.href = '../Login page/index.html';
  }

  const API_URL = "http://127.0.0.1:8000";
  // Change Password
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

      try {
        const response = await fetch(`${API_URL}/change-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail,
            current_password: currentPassword,
            new_password: newPassword
          })
        });

        const data = await response.json();

        if (response.ok) {
          msgBox.textContent = "Password updated successfully! An email confirmation was sent.";
          msgBox.style.display = "block";
          msgBox.style.backgroundColor = "#dcfce7";
          msgBox.style.color = "#166534";
          document.getElementById('current-password').value = '';
          document.getElementById('new-password').value = '';
        } else {
          msgBox.textContent = data.detail || "Failed to update password.";
          msgBox.style.display = "block";
          msgBox.style.backgroundColor = "#fee2e2";
          msgBox.style.color = "#ef4444";
        }
      } catch (error) {
        msgBox.textContent = "Network error. Please try again.";
        msgBox.style.display = "block";
      }
      updatePassBtn.textContent = "Update Password";
    });
  }

  // Delete Account
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
        const response = await fetch(`${API_URL}/request-delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail })
        });

        if (response.ok) {
          deleteModal.classList.add('active');
        } else {
          deleteMsg.textContent = "Failed to initiate deletion. Try again.";
          deleteMsg.style.display = "block";
        }
      } catch (error) {
        deleteMsg.textContent = "Network error. Please try again.";
        deleteMsg.style.display = "block";
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
        const response = await fetch(`${API_URL}/confirm-delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail, otp: otp })
        });

        const data = await response.json();

        if (response.ok) {
          // Clear local storage and send to login
          localStorage.removeItem('username');
          localStorage.removeItem('userEmail');
          window.location.href = '../Login page/index.html';
        } else {
          modalErrorMsg.textContent = data.detail || "Invalid OTP.";
          modalErrorMsg.style.display = "block";
        }
      } catch (error) {
        modalErrorMsg.textContent = "Network error. Please try again.";
        modalErrorMsg.style.display = "block";
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
    // Populate existing data when opening the modal
    openEditBtn.addEventListener('click', () => {
      document.getElementById('edit-username-input').value = localStorage.getItem('username') || '';
      // If you store bio in localstorage later, retrieve it here
      
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

      if (!email) {
        window.location.href = '../Login page/index.html';
        return;
      }

      saveProfileBtn.textContent = "Saving...";
      saveProfileBtn.disabled = true;

      // Use FormData to handle the mix of text and the image file
      const formData = new FormData();
      formData.append('email', email);
      formData.append('username', newUsername);
      formData.append('bio', newBio);
      
      if (picFile) {
        formData.append('profile_pic', picFile);
      }

      try {
        const response = await fetch(`${API_URL}/update-profile`, {
          method: 'POST',
          body: formData 
          // Note: Do not set 'Content-Type' manually when using FormData. 
          // The browser sets it automatically to 'multipart/form-data'.
        });

        const data = await response.json();

        if (response.ok) {
          // Update the UI
          document.getElementById('profile-username-display').textContent = data.username;
          if (data.bio) document.getElementById('profile-bio-display').textContent = data.bio;
          
          // Update local storage
          localStorage.setItem('username', data.username);
          
          // Close modal
          editProfileModal.classList.remove('active');
          editModalMsg.style.display = 'none';
        } else {
          editModalMsg.textContent = data.detail || "Failed to save profile.";
          editModalMsg.style.display = 'block';
          editModalMsg.style.color = '#ef4444';
        }
      } catch (error) {
        editModalMsg.textContent = "Network error. Please try again.";
        editModalMsg.style.display = 'block';
        editModalMsg.style.color = '#ef4444';
      }

      saveProfileBtn.textContent = "Save Changes";
      saveProfileBtn.disabled = false;
    });
  }
});