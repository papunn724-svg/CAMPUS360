
// CAMPUS360 BACKEND LOGIN

const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

// SHOW / HIDE PASSWORD
togglePassword.addEventListener("click", function () {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        this.textContent = "Hide";
    } else {
        passwordInput.type = "password";
        this.textContent = "Show";
    }
});

// LOGIN SYSTEM
document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!email || !password) {
        alert("Please enter email and password!");
        return;
    }

    try {
        const response = await fetch("https://campus360-lsvd.onrender.com/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Login failed!");
            return;
        }

        // SAVE LOGIN SESSION
        sessionStorage.setItem(
            "campus360CurrentStudent",
            JSON.stringify(data.student)
        );

        alert("Login Successful! Welcome " + data.student.name);

        window.location.href = "../dashboard/dashboard.html";

    } catch (error) {
        console.error("Login Error:", error);
        alert("Server connection failed! Please start the backend server.");
    }
});
