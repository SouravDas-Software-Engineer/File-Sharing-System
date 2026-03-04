const loginButton = document.getElementById("loginBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const message = document.getElementById("message");

loginButton.addEventListener("click", async function() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Basic client-side check
    if(email === "" || password === "") {
        showMessage("Please fill all fields", "red");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:8000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, password: password })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage("Login Successful!", "#10b981");
            // Redirect to dashboard in the future:
            // window.location.href = "/dashboard.html";
        } else {
            showMessage(data.detail || "Login Failed", "red");
        }
    } catch (error) {
        showMessage("Server connection failed", "red");
    }
});

function showMessage(text, color) {
    message.textContent = text;
    message.style.color = color;
    message.style.marginTop = "15px";
    message.style.fontWeight = "bold";
}

function toggleMode() {
    document.body.classList.toggle("dark");
    document.body.classList.toggle("light");
}

document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("dark");
});
const response = await fetch("http://127.0.0.1:8000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email, password: password })
});

const data = await response.json();