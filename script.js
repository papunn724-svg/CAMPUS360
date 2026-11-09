// EXPLORE CAMPUS
function exploreCampus() {
    document.getElementById("features").scrollIntoView({
        behavior: "smooth"
    });
}

// LOGIN
function openLogin() {
    window.location.href = "pages/login.html";
}

// REGISTRATION
function openRegister() {
    window.location.href = "pages/register.html";
}

// WATCH DEMO
function watchDemo() {
    alert("Welcome to CAMPUS360! Demo Coming Soon.");
}

console.log("CAMPUS360 Successfully Loaded!");