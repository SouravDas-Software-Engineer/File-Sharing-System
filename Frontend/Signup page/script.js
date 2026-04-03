document.addEventListener("DOMContentLoaded", () => {

const signupButton = document.getElementById("signupBtn");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const message = document.getElementById("message");


// ================= SIGNUP FUNCTION =================
signupButton.addEventListener("click", async function () {

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // 1️⃣ Empty Field Check
    if (username === "" || email === "" || password === "" || confirmPassword === "") {
        showMessage("Please fill all fields", "red");
        return;
    }

    // 2️⃣ Email Validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        showMessage("Enter a valid email address", "red");
        return;
    }

    // 3️⃣ Password Length Check
    if (password.length < 6) {
        showMessage("Password must be at least 6 characters", "red");
        return;
    }

    // 4️⃣ Confirm Password Match
    if (password !== confirmPassword) {
        showMessage("Passwords do not match", "red");
        return;
    }

    // ================= API CONNECTION =================
    try {

        const response = await fetch("http://127.0.0.1:8000/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        });

        const data = await response.json();

        // ✅ Signup Success
        
        if (response.ok) {
            showMessage("Signup Successful ✅", "#10b981");
            setTimeout(() => {
        // Redirect them to the actual login page
            window.location.href = "/Frontend/Login page/index.html"; 
            }, 1200);
        } else {
            showMessage(data.detail || "Signup Failed", "red");
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

});