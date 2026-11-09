// ADMIN LOGIN CHECK
if (sessionStorage.getItem("campus360AdminLoggedIn") !== "true") {
    alert("Access Denied! Please Login as Admin.");
    window.location.replace("../pages/admin-login.html");
} else {

    const table = document.getElementById("attendanceTable");
    const searchInput = document.getElementById("searchStudent");
    const emptyMessage = document.getElementById("emptyMessage");

    const totalStudentsElement = document.getElementById("totalStudents");
    const presentTodayElement = document.getElementById("presentToday");
    const absentTodayElement = document.getElementById("absentToday");

    const dateInput = document.getElementById("attendanceDate");

    let students = [];
    let attendanceRecords = [];

    // GET LOCAL DATE
    function getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    dateInput.value = getTodayDate();

    // LOAD STUDENTS AND ATTENDANCE
    async function loadAttendance() {
        try {
            const [studentsResponse, attendanceResponse] = await Promise.all([
                fetch("http://localhost:5000/api/admin/students"),
                fetch("http://localhost:5000/api/admin/attendance")
            ]);

            if (!studentsResponse.ok || !attendanceResponse.ok) {
                throw new Error("Failed to load attendance data.");
            }

            const studentsData = await studentsResponse.json();
            const attendanceData = await attendanceResponse.json();

            students = studentsData.students || [];
            attendanceRecords = attendanceData.attendance || [];

            displayAttendance();

        } catch (error) {
            console.error("Attendance Error:", error);
            alert("Unable to load attendance. Check your backend server.");
        }
    }

    // DISPLAY ATTENDANCE
    function displayAttendance() {

        table.innerHTML = "";

        const selectedDate = dateInput.value;

        const searchText = searchInput.value.toLowerCase().trim();

        const filteredStudents = students.filter(student => {
            return (
                (student.name || "").toLowerCase().includes(searchText) ||
                (student.studentId || "").toLowerCase().includes(searchText)
            );
        });

        totalStudentsElement.textContent = students.length;

        let presentCount = 0;
        let absentCount = 0;

        students.forEach(student => {
            const todayRecord = attendanceRecords.find(record =>
                record.studentId === student.studentId &&
                record.date === selectedDate
            );

            if (todayRecord?.status === "Present") presentCount++;
            if (todayRecord?.status === "Absent") absentCount++;
        });

        presentTodayElement.textContent = presentCount;
        absentTodayElement.textContent = absentCount;

        emptyMessage.style.display =
            filteredStudents.length === 0 ? "block" : "none";

        filteredStudents.forEach((student, index) => {

            const studentRecords = attendanceRecords.filter(record =>
                record.studentId === student.studentId
            );

            const totalPresent = studentRecords.filter(record =>
                record.status === "Present"
            ).length;

            const totalAbsent = studentRecords.filter(record =>
                record.status === "Absent"
            ).length;

            const totalDays = totalPresent + totalAbsent;

            const percentage = totalDays > 0
                ? ((totalPresent / totalDays) * 100).toFixed(1)
                : "0.0";

            const currentRecord = studentRecords.find(record =>
                record.date === selectedDate
            );

            const currentStatus = currentRecord
                ? currentRecord.status
                : "Not Marked";

            const row = document.createElement("tr");

            function addCell(value) {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            }

            addCell(index + 1);
            addCell(student.name || "N/A");
            addCell(student.studentId || "N/A");
            addCell(totalPresent);
            addCell(totalAbsent);
            addCell(percentage + "%");

            // ATTENDANCE BUTTONS
            const actionCell = document.createElement("td");

            const statusText = document.createElement("div");
            statusText.textContent = "Status: " + currentStatus;
            statusText.style.marginBottom = "8px";

            const presentButton = document.createElement("button");
            presentButton.textContent = "Present";
            presentButton.className = "present-btn";

            const absentButton = document.createElement("button");
            absentButton.textContent = "Absent";
            absentButton.className = "absent-btn";

            presentButton.disabled = currentStatus === "Present";
            absentButton.disabled = currentStatus === "Absent";

            presentButton.addEventListener("click", () => {
                markAttendance(student.studentId, "Present");
            });

            absentButton.addEventListener("click", () => {
                markAttendance(student.studentId, "Absent");
            });

            actionCell.appendChild(statusText);
            actionCell.appendChild(presentButton);
            actionCell.appendChild(absentButton);

            row.appendChild(actionCell);
            table.appendChild(row);
        });
    }

    // MARK OR UPDATE ATTENDANCE
    async function markAttendance(studentId, status) {

        const selectedDate = dateInput.value;

        if (!selectedDate) {
            alert("Please select an attendance date.");
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/admin/attendance",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        studentId: studentId,
                        date: selectedDate,
                        status: status
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Attendance could not be saved.");
            }

            alert(status + " attendance saved successfully!");

            await loadAttendance();

        } catch (error) {
            console.error("Mark Attendance Error:", error);
            alert(error.message || "Unable to save attendance.");
        }
    }

    // SEARCH STUDENT
    searchInput.addEventListener("input", displayAttendance);

    // CHANGE DATE
    dateInput.addEventListener("change", displayAttendance);

    // INITIAL LOAD
    loadAttendance();
}