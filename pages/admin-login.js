// CAMPUS360 ADMIN LOGIN

const adminLoginForm = document.getElementById("adminLoginForm");

adminLoginForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;

    // DEMO ADMIN CREDENTIALS
    const adminEmail = "admin@campus360.com";
    const adminPassword = "Admin@123";

    if (email === adminEmail && password === adminPassword) {

        sessionStorage.setItem("campus360AdminLoggedIn", "true");

        alert("Admin Login Successful!");

        window.location.href = "../admin/admin.html";

    } else {

        document.getElementById("loginMessage").textContent =
            "Invalid Admin Email or Password!";

    }

});