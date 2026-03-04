document.addEventListener("DOMContentLoaded", function () {
    const modeBtn = document.getElementById("modeBtn");
    const resetBtn = document.getElementById("resetBtn");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");

    const API_BASE_URL = "http://127.0.0.1:8000";

    // Grab the email and OTP from the URL that script.js passed over
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const otp = urlParams.get('otp');

    // If someone tries to access this page directly without an OTP, send them back
    if (!email || !otp) {
        alert("Unauthorized access. Please verify your email first.");
        window.location.href = "index.html"; 
    }

    modeBtn.addEventListener("click", function () {
        document.body.classList.toggle("dark");
        document.body.classList.toggle("light");
        modeBtn.textContent = document.body.classList.contains("dark") ? "🌙" : "☀️";
    });

    resetBtn.addEventListener("click", async function () {
        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        if (newPassword === "" || confirmPassword === "") {
            alert("Please fill in both password fields.");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    email: email, 
                    otp: otp, 
                    new_password: newPassword 
                })
            });

            if (response.ok) {
                alert("Password changed successfully! You can now log in.");
                window.location.href = "/Frontend/Login page/index.html"; 
            } else {
                const data = await response.json();
                alert("Error: " + data.detail);
            }
        } catch (error) {
            alert("Failed to connect to the server.");
        }
    });
});