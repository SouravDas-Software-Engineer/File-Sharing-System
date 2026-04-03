document.addEventListener("DOMContentLoaded", function () {
    const modeBtn = document.getElementById("modeBtn");
    const sendOtpBtn = document.getElementById("sendOtpBtn");
    const verifyOtpBtn = document.getElementById("verifyOtpBtn");
    const otpSection = document.getElementById("otpSection");
    const otpInput = document.getElementById("otpInput");
    const emailInput = document.getElementById("email");

    const API_BASE_URL = "http://127.0.0.1:8000";

  // ================= THEME MEMORY LOGIC =================
  const savedTheme = localStorage.getItem("fileShareTheme") || "dark";
  
  if (savedTheme === "dark") {
      document.body.classList.add("dark-mode");
      if(modeBtn) modeBtn.textContent = "🌙";
  } else {
      document.body.classList.remove("dark-mode");
      if(modeBtn) modeBtn.textContent = "☀️";
  }

  if(modeBtn) {
      modeBtn.addEventListener("click", function () {
          document.body.classList.toggle("dark-mode");
          if (document.body.classList.contains("dark-mode")) {
              modeBtn.textContent = "🌙";
              localStorage.setItem("fileShareTheme", "dark");
          } else {
              modeBtn.textContent = "☀️";
              localStorage.setItem("fileShareTheme", "light");
          }
      });
  }

    sendOtpBtn.addEventListener("click", async function () {
        const email = emailInput.value.trim();
        if (email === "") {
            alert("Please enter your email.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email })
            });

            if (response.ok) {
                alert("OTP sent to your email!");
                otpSection.style.display = "block";
                emailInput.disabled = true; 
            } else {
                const data = await response.json();
                alert("Error: " + data.detail);
            }
        } catch (error) {
            alert("Failed to connect to the server.");
        }
    });

    verifyOtpBtn.addEventListener("click", async function () {
        const email = emailInput.value.trim();
        const otp = otpInput.value.trim();

        if (otp === "") {
            alert("Please enter the OTP.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email, otp: otp })
            });

          
            if (response.ok) {
                alert("OTP Verified Successfully ✅");
                // Update this line to point to your new folder and index file
                window.location.href = `change password/index.html?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`;
            } else {
                alert("Invalid OTP ❌");
            }
        } catch (error) {
            alert("Failed to connect to the server.");
        }
    });
});