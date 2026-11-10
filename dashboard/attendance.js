// CAMPUS360 STUDENT ATTENDANCE — official records from the backend

const student = JSON.parse(
    sessionStorage.getItem("campus360CurrentStudent") || "null"
);

if (!student || !sessionStorage.getItem("campus360StudentToken")) {
    alert("Please login first!");
    window.location.replace("../pages/login.html");
} else {
    const API_URL = window.CAMPUS360_API_ORIGIN + "/api/student/attendance";
    const historyList = document.getElementById("historyList");

    function showHistory(records) {
        historyList.innerHTML = "";

        if (!records.length) {
            historyList.textContent = "No attendance records have been published yet.";
            return;
        }

        records.forEach(record => {
            const item = document.createElement("div");
            item.className = "history-item";

            const date = document.createElement("span");
            date.textContent = new Date(record.date + "T00:00:00").toLocaleDateString();

            const status = document.createElement("span");
            status.textContent = record.status;
            status.className = record.status === "Present" ? "present-status" : "absent-status";

            item.append(date, status);
            historyList.appendChild(item);
        });
    }

    function updateAttendance(records) {
        const total = records.length;
        const present = records.filter(record => record.status === "Present").length;
        const absent = records.filter(record => record.status === "Absent").length;
        const percentage = total ? Math.round((present / total) * 100) : 0;

        document.getElementById("totalClasses").textContent = total;
        document.getElementById("presentClasses").textContent = present;
        document.getElementById("absentClasses").textContent = absent;
        document.getElementById("percentage").textContent = percentage + "%";
        document.getElementById("progressBar").style.width = percentage + "%";

        const message = document.getElementById("attendanceMessage");
        if (!total) {
            message.textContent = "Your official attendance records will appear here once published.";
        } else if (percentage < 75) {
            message.textContent = "Your attendance is below 75%. Please check with your faculty.";
        } else {
            message.textContent = "Your attendance is currently satisfactory.";
        }

        showHistory(records);
    }

    async function loadAttendance() {
        historyList.textContent = "Loading attendance...";
        try {
            const response = await fetch(API_URL);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load attendance.");
            }

            updateAttendance(data.attendance || []);
        } catch (error) {
            console.error("Attendance Load Error:", error);
            historyList.textContent = error.message || "Unable to load attendance. Please try again.";
            document.getElementById("attendanceMessage").textContent =
                "Attendance data could not be loaded.";
        }
    }

    loadAttendance();
}
