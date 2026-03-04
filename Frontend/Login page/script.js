const loginButton = document.getElementById("loginBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const message = document.getElementById("message");

// Login Button Click
loginButton.addEventListener("click", async function () {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // 1️⃣ Check empty fields
    if (email === "" || password === "") {
        showMessage("Please fill all fields", "red");
        return;
    }

    // 2️⃣ Professional Email Validation (Regex)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        showMessage("Enter a valid email address", "red");
        return;
    }

    // 3️⃣ Password length validation
    if (password.length < 6) {
        showMessage("Password must be at least 6 characters", "red");
        return;
    }

    // 4️⃣ If validation passes → Call Backend
    try {
        const response = await fetch("http://127.0.0.1:8000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage("Login Successful!", "#10b981");
            // Future redirect:
            // window.location.href = "dashboard.html";
        } else {
            showMessage(data.detail || "Login Failed", "red");
        }

    } catch (error) {
        showMessage("Server connection failed", "red");
    }
});

// Message Function
function showMessage(text, color) {
    message.textContent = text;
    message.style.color = color;
    message.style.marginTop = "15px";
    message.style.fontWeight = "bold";
}

// Dark/Light Mode Toggle
function toggleMode() {
    document.body.classList.toggle("dark");
    document.body.classList.toggle("light");
}

// Default Mode on Load
document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("dark");
});