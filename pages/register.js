
// =====================================
// CAMPUS360 STUDENT REGISTRATION
// MONGODB BACKEND INTEGRATION
// =====================================

const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    // GET STUDENT DETAILS

    const name = document.getElementById("name").value.trim();

    const studentId = document.getElementById("studentId").value.trim();

    const email = document.getElementById("email").value.trim().toLowerCase();

    const department = document.getElementById("department").value;

    const password = document.getElementById("password").value;

    const confirmPassword = document.getElementById("confirmPassword").value;

    const terms = document.getElementById("terms").checked;


    // VALIDATION

    if (!name || !studentId || !email || !department || !password) {
        alert("Please fill all details!");
        return;
    }

    if (password.length < 8) {
        alert("Password must contain at least 8 characters!");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    if (!terms) {
        alert("Please accept Terms & Conditions!");
        return;
    }


    // SEND DATA TO MONGODB BACKEND

    const registerButton = registerForm.querySelector('button[type="submit"]');

    if (registerButton) {
        registerButton.disabled = true;
        registerButton.textContent = "Registering...";
    }

    try {

        const response = await fetch("https://campus360-isvd.onrender.com/api/register", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: name,
                studentId: studentId,
                email: email,
                department: department,
                password: password
            })

        });


        const data = await response.json();


        // CHECK RESPONSE

        if (!response.ok) {

            alert(data.message || "Registration Failed!");

            return;
        }


        // SUCCESS

        alert("Registration Successful! Welcome to CAMPUS360.");

        window.location.href = "login.html";


    } catch (error) {

        console.error("Registration Error:", error);

        alert("Server connection failed! Please start the backend server.");

    } finally {

        if (registerButton) {
            registerButton.disabled = false;
            registerButton.textContent = "REGISTER";
        }

    }

});
