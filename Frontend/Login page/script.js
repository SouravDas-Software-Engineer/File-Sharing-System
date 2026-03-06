document.addEventListener("DOMContentLoaded", () => {

const loginButton = document.getElementById("loginBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const message = document.getElementById("message");


// ================= LOGIN FUNCTION =================
loginButton.addEventListener("click", async function () {

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // 1️⃣ Empty Field Check
    if (email === "" || password === "") {
        showMessage("Please fill all fields", "red");
        return;
    }

    // 2️⃣ Email Validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        showMessage("Enter a valid email address", "red");
        return;
    }

    // 3️⃣ Password Validation
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

            if (data.access_token) {
                localStorage.setItem("token", data.access_token);
            }

            setTimeout(() => {
                window.location.href = "/Frontend/Dashboard/index.html";
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


// ================= DEFAULT MODE =================
document.body.classList.add("dark");

});