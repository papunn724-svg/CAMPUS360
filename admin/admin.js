
// CAMPUS360 ADMIN DASHBOARD PROTECTION

// CHECK ADMIN LOGIN
if (sessionStorage.getItem("campus360AdminLoggedIn") !== "true") {

    alert("Access Denied! Please Login as Admin.");

    window.location.replace("../pages/admin-login.html");

} else {

    // TOTAL REGISTERED STUDENTS
    const students = JSON.parse(
        localStorage.getItem("campus360Students") || "[]"
    );

    document.getElementById("totalStudents").textContent =
        students.length;


    // TOTAL ASSIGNMENTS
    const assignments = JSON.parse(
        localStorage.getItem("campus360Assignments") || "[]"
    );

    document.getElementById("totalAssignments").textContent =
        assignments.length;


    // TOTAL CAMPUS EVENTS
    const adminEvents = JSON.parse(
        localStorage.getItem("campus360AdminEvents") || "[]"
    );

    document.getElementById("totalEvents").textContent =
        adminEvents.length;


    // ATTENDANCE RECORDS
    let attendanceCount = 0;

    students.forEach(student => {

        const attendance = JSON.parse(
            localStorage.getItem("attendance_" + student.studentId) || "[]"
        );

        attendanceCount += attendance.length;

    });

    document.getElementById("totalAttendance").textContent =
        attendanceCount;
}
// ADMIN LOGOUT FUNCTIONALITY

const adminLogout = document.getElementById("adminLogout");

if (adminLogout) {
    adminLogout.addEventListener("click", function(event) {

        event.preventDefault();

        sessionStorage.removeItem("campus360AdminLoggedIn");
        sessionStorage.removeItem("campus360AdminToken");

        alert("Admin Logout Successful!");

        window.location.replace("../pages/admin-login.html");

    });
}