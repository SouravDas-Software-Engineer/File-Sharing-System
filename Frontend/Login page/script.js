const loginButton = document.getElementById("loginBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const message = document.getElementById("message");

loginButton.addEventListener("click", function() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if(email === "" || password === "") {
        showMessage("Please fill all fields", "red");
    }
    else if(!email.includes("@")) {
        showMessage("Enter valid email", "red");
    }
    else if(password.length < 6) {
        showMessage("Password must be at least 6 characters", "red");
    }
    else {
        showMessage("Login Successful", "#10b981");
    }
});

function showMessage(text, color) {
    message.textContent = text;
    message.style.color = color;
    message.style.marginTop = "15px";
    message.style.fontWeight = "bold";
}

// Dark/Light Mode Logic
function toggleMode() {
    const body = document.body;
    if (body.classList.contains("dark")) {
        body.classList.replace("dark", "light");
    } else {
        body.classList.replace("light", "dark");
    }
}

// Set default mode on load
document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("dark");
});