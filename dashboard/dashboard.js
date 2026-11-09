
// CAMPUS360 STUDENT DASHBOARD

// CHECK LOGIN SESSION
const currentStudent = sessionStorage.getItem(
    "campus360CurrentStudent"
);

if (!currentStudent) {

    alert("Please login first!");

    window.location.replace("../pages/login.html");

} else {

    const student = JSON.parse(currentStudent);

    // DISPLAY STUDENT NAME
    document.getElementById("studentName").textContent =
        student.name;

    document.getElementById("welcomeName").textContent =
        student.name;

    // DISPLAY STUDENT PROFILE
    document.getElementById("profileName").textContent =
        student.name;

    document.getElementById("profileId").textContent =
        student.studentId;

    document.getElementById("profileEmail").textContent =
        student.email;

    document.getElementById("profileDepartment").textContent =
        student.department;

    // STUDENT LOGOUT
    const logoutButton = document.getElementById("logoutBtn");

    if (logoutButton) {

        logoutButton.addEventListener("click", function() {

            const confirmLogout = confirm(
                "Are you sure you want to logout?"
            );

            if (confirmLogout) {

                sessionStorage.removeItem(
                    "campus360CurrentStudent"
                );

                window.location.replace("../pages/login.html");

            }

        });

    }

}
