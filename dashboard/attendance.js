// CAMPUS360 ATTENDANCE SYSTEM

const currentStudent = JSON.parse(
    sessionStorage.getItem("campus360CurrentStudent") || "null"
);

if (!currentStudent) {

    alert("Please login first!");

    window.location.href = "../pages/login.html";

} else {

    const storageKey =
        "attendance_" + currentStudent.studentId;

    let records = JSON.parse(
        localStorage.getItem(storageKey) || "[]"
    );

    function updateAttendance() {

        const total = records.length;

        const present = records.filter(
            record => record.status === "Present"
        ).length;

        const absent = total - present;

        const percentage = total === 0
            ? 0
            : Math.round((present / total) * 100);

        document.getElementById("totalClasses").textContent = total;

        document.getElementById("presentClasses").textContent = present;

        document.getElementById("absentClasses").textContent = absent;

        document.getElementById("percentage").textContent =
            percentage + "%";

        document.getElementById("progressBar").style.width =
            percentage + "%";

        const message = document.getElementById("attendanceMessage");

        if (total === 0) {
            message.textContent = "No classes recorded yet.";
        } else if (percentage < 75) {
            message.textContent =
                "Warning! Your attendance is below 75%.";
        } else {
            message.textContent =
                "Great! Your attendance is satisfactory.";
        }

        showHistory();
    }


    // SHOW ATTENDANCE HISTORY

    function showHistory() {

        const historyList =
            document.getElementById("historyList");

        historyList.innerHTML = "";

        if (records.length === 0) {
            historyList.textContent =
                "No attendance records yet.";
            return;
        }

        records.slice().reverse().forEach(record => {

            const item = document.createElement("div");

            item.className = "history-item";

            const date = document.createElement("span");
            date.textContent = record.date;

            const status = document.createElement("span");

            status.textContent = record.status;

            status.className =
                record.status === "Present"
                ? "present-status"
                : "absent-status";

            item.append(date, status);

            historyList.appendChild(item);

        });
    }


    // MARK ATTENDANCE

    function markAttendance(status) {

        const today = new Date().toLocaleDateString("en-CA");

        const alreadyMarked = records.some(
            record => record.date === today
        );

        if (alreadyMarked) {
            alert("Attendance already marked for today!");
            return;
        }

        records.push({
            date: today,
            status: status
        });

        localStorage.setItem(
            storageKey,
            JSON.stringify(records)
        );

        updateAttendance();

        alert("Today's attendance marked: " + status);
    }


    document.getElementById("presentBtn")
        .addEventListener("click", function() {
            markAttendance("Present");
        });

    document.getElementById("absentBtn")
        .addEventListener("click", function() {
            markAttendance("Absent");
        });


    updateAttendance();

}