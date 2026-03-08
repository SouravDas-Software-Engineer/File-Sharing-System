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

});