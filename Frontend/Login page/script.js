document.addEventListener("DOMContentLoaded", () => {

    const loginButton = document.getElementById("loginBtn");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const message = document.getElementById("message");

    // ================= LOGIN FUNCTION =================
    loginButton.addEventListener("click", async function () {

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // 1. Empty Field Check
        if (email === "" || password === "") {
            showMessage("Please fill all fields", "red");
            return;
        }

        // 2. Email Validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            showMessage("Enter a valid email address", "red");
            return;
        }

        // 3. Password Validation
        if (password.length < 6) {
            showMessage("Password must be at least 6 characters", "red");
            return;
        }

        // ================= API CONNECTION =================
        try {
            const response = await fetch("http://127.0.0.1:8000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            // Login Success
            if (response.ok && data.status === "success") {
                showMessage("Login Successful ✅", "#10b981");

                // Cache all profile data from the login response
                localStorage.setItem('username',       data.username      || '');
                localStorage.setItem('userEmail',      email);
                localStorage.setItem('userBio',        data.bio           || '');
                localStorage.setItem('userJoined',     data.joined_date   || '');
                localStorage.setItem('userTotalFiles', data.total_files   ?? 0);
                localStorage.setItem('userFilesSent',  data.files_sent    ?? 0);
                localStorage.setItem('userFilesRecv',  data.files_received ?? 0);
                localStorage.setItem('userStorageMB',  data.storage_used_mb ?? 0);
                if (data.profile_pic_url) {
                    localStorage.setItem('profilePicUrl', data.profile_pic_url);
                }

                // Redirect immediately (no extra timeout needed)
                window.location.href = '../Dashboard/index.html';
            } else {
                // Show specific error from backend if available
                showMessage(data.detail || "Login Failed", "red");
            }

        } catch (error) {
            console.error("Error:", error);
            showMessage("Server connection failed ❌", "red");
        }
    });

    // ================= MESSAGE FUNCTION =================
    function showMessage(text, color) {
        message.textContent = text;
        message.style.color = color;
        message.style.marginTop = "15px";
        message.style.fontWeight = "bold";
    }

   // ================= THEME MEMORY LOGIC =================
  const modeBtn = document.getElementById("modeBtn");
  
  // 1. Check memory for a saved theme (default to dark if none exists)
  const savedTheme = localStorage.getItem("fileShareTheme") || "dark";
  
  // 2. Apply the saved theme immediately on load
  if (savedTheme === "dark") {
      document.body.classList.add("dark-mode");
      if(modeBtn) modeBtn.textContent = "🌙";
  } else {
      document.body.classList.remove("dark-mode");
      if(modeBtn) modeBtn.textContent = "☀️";
  }

  // 3. Toggle button clicks update the screen AND the memory
  if(modeBtn) {
      modeBtn.addEventListener("click", function () {
          document.body.classList.toggle("dark-mode");

          if (document.body.classList.contains("dark-mode")) {
              modeBtn.textContent = "🌙";
              localStorage.setItem("fileShareTheme", "dark"); // Save to memory
          } else {
              modeBtn.textContent = "☀️";
              localStorage.setItem("fileShareTheme", "light"); // Save to memory
          }
      });
  }
}); 