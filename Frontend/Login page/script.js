let loginButton = document.getElementById("loginBtn");
let emailInput = document.getElementById("email");
let passwordInput = document.getElementById("password");
let message = document.getElementById("message");

loginButton.addEventListener("click", function() {

    let email = emailInput.value;
    let password = passwordInput.value;

    if(email === "" || password === "") {
        message.textContent = "Please fill all fields";
        message.style.color = "red";
    }
    else if(!email.includes("@")) {
        message.textContent = "Enter valid email";
        message.style.color = "red";
    }
    else if(password.length < 6) {
        message.textContent = "Password must be at least 6 characters";
        message.style.color = "red";
    }
    else {
        message.textContent = "Login Successful";
        message.style.color = "green";
    }
});
// Start in dark mode
document.body.classList.add("dark");

function toggleMode() {
    if (document.body.classList.contains("dark")) {
        document.body.classList.remove("dark");
        document.body.classList.add("light");
    } else {
        document.body.classList.remove("light");
        document.body.classList.add("dark");
    }
}
// Start in dark mode
document.body.classList.add("dark");

function toggleMode() {
    if (document.body.classList.contains("dark")) {
        document.body.classList.remove("dark");
        document.body.classList.add("light");
    } else {
        document.body.classList.remove("light");
        document.body.classList.add("dark");
    }
}
// Start in dark mode
document.body.classList.add("dark");

function toggleMode() {
    if (document.body.classList.contains("dark")) {
        document.body.classList.remove("dark");
        document.body.classList.add("light");
    } else {
        document.body.classList.remove("light");
        document.body.classList.add("dark");
    }
}

document.body.classList.add("dark");

function toggleMode() {
    if (document.body.classList.contains("dark")) {
        document.body.classList.remove("dark");
        document.body.classList.add("light");
    } else {
        document.body.classList.remove("light");
        document.body.classList.add("dark");
    }
}
