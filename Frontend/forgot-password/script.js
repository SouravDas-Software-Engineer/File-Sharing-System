document.addEventListener("DOMContentLoaded", function () {

    const modeBtn = document.getElementById("modeBtn");
    const sendOtpBtn = document.getElementById("sendOtpBtn");
    const verifyOtpBtn = document.getElementById("verifyOtpBtn");
    const otpSection = document.getElementById("otpSection");
    const otpInput = document.getElementById("otpInput");
    const emailInput = document.getElementById("email");

    let generatedOtp = "";

    /* 🌙 Dark/Light Toggle */
    modeBtn.addEventListener("click", function () {
        document.body.classList.toggle("dark");
        document.body.classList.toggle("light");

        if (document.body.classList.contains("dark")) {
            modeBtn.textContent = "🌙";
        } else {
            modeBtn.textContent = "☀️";
        }
    });

    /* 🔐 Generate OTP */
    function generateOtp() {
        generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log("OTP:", generatedOtp); // Demo only
    }

    /* 📩 Send OTP */
    sendOtpBtn.addEventListener("click", function () {

        if (emailInput.value.trim() === "") {
            alert("Please enter your email.");
            return;
        }

        generateOtp();
        alert("OTP sent! (Check console)");

        otpSection.style.display = "block";
    });

    /* ✅ Verify OTP */
    verifyOtpBtn.addEventListener("click", function () {

        if (otpInput.value === generatedOtp) {
            alert("OTP Verified Successfully ✅");
        } else {
            alert("Invalid OTP ❌");
        }
    });

});