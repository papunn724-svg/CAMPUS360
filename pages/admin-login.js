
// ==========================================
// CAMPUS360 ADMIN LOGIN
// BACKEND AUTHENTICATION
// ==========================================

const adminLoginForm = document.getElementById("adminLoginForm");

if (adminLoginForm) {

    adminLoginForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const email = document.getElementById("adminEmail").value.trim();

        const password = document.getElementById("adminPassword").value;

        const loginMessage = document.getElementById("loginMessage");

        loginMessage.textContent = "";

        if (!email || !password) {

            loginMessage.textContent = "Please enter email and password!";

            return;
        }

        const submitButton = adminLoginForm.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        if (submitButton) submitButton.disabled = true;

        try {

            const response = await fetch(
                "https://campus360-lsvd.onrender.com/api/admin/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message || "Admin Login Failed!"
                );
            }

            if (!data.token) {

                throw new Error(
                    "Server did not return an admin token."
                );
            }

            // SAVE ADMIN JWT TOKEN
            sessionStorage.setItem(
                "campus360AdminToken",
                data.token
            );

            sessionStorage.setItem(
                "campus360AdminLoggedIn",
                "true"
            );

            alert("Admin Login Successful!");

            window.location.href = "../admin/admin.html";

        } catch (error) {

            console.error("Admin Login Error:", error);

            loginMessage.textContent =
                error.message || "Server connection failed!";

        } finally {

            if (submitButton) submitButton.disabled = false;
        }

    });
}
