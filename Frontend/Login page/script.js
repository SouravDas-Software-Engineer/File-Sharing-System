// Select elements
let loginButton = document.getElementById("loginBtn");
let emailInput = document.getElementById("email");
let passwordInput = document.getElementById("password");

// Add click event
loginButton.addEventListener("click", function() {

    let email = emailInput.value;
    let password = passwordInput.value;

    if(email === "" || password === "") {
        alert("Please fill all fields");
    } else {
        alert("Login Successful");
    }

});