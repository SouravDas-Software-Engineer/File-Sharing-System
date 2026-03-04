// Get Elements
const loginButton = document.getElementById("loginBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const message = document.getElementById("message");


// ================= LOGIN FUNCTION =================
loginButton.addEventListener("click", async function () {

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // ✅ 1. Empty Field Check
    if (email === "" || password === "") {
        showMessage("Please fill all fields", "red");
        return;
    }

    // ✅ 2. Email Validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        showMessage("Enter a valid email address", "red");
        return;
    }

    // ✅ 3. Password Validation
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

        // ✅ Login Success
        if (response.ok) {

            showMessage("Login Successful ✅", "#10b981");

            // Save JWT Token (if backend sends it)
            if (data.access_token) {
                localStorage.setItem("token", data.access_token);
            }

            // Redirect after login
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1000);

        } else {
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


// ================= DARK / LIGHT MODE =================
function toggleMode() {
    document.body.classList.toggle("dark");
    document.body.classList.toggle("light");
}


// ================= DEFAULT MODE =================
document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("dark");
});