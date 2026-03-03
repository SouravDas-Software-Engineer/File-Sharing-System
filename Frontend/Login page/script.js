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
    else {
        message.textContent = "Login Successful";
        message.style.color = "green";

        // Clear fields
        emailInput.value = "";
        passwordInput.value = "";
    }

});