// ==========================================
// CAMPUS360 ADMIN STUDENT MANAGEMENT
// MONGODB INTEGRATION
// ==========================================

// ADMIN SESSION CHECK

if (sessionStorage.getItem("campus360AdminLoggedIn") !== "true") {

    alert("Access Denied! Please Login as Admin.");

    window.location.replace("../pages/admin-login.html");

} else {

    // GET HTML ELEMENTS

    const studentTable = document.getElementById("studentTable");
    const studentCount = document.getElementById("studentCount");
    const searchInput = document.getElementById("searchStudent");
    const emptyMessage = document.getElementById("emptyMessage");

    // STUDENT DATA

    let students = [];

    // ======================================
    // FETCH STUDENTS FROM MONGODB
    // ======================================

    async function loadStudents() {

        studentTable.innerHTML = `
            <tr>
                <td colspan="6">Loading students...</td>
            </tr>
        `;

        try {

            const response = await fetch(
                "http://localhost:5000/api/admin/students"
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load students!");
            }

            students = data.students || [];

            displayStudents(students);

        } catch (error) {

            console.error("Student Loading Error:", error);

            studentTable.innerHTML = "";

            emptyMessage.textContent =
                "Unable to load students. Please check backend server.";

            emptyMessage.style.display = "block";

        }

    }

    // ======================================
    // DISPLAY STUDENTS
    // ======================================

    function displayStudents(data) {

        studentTable.innerHTML = "";

        studentCount.textContent = students.length;

        if (data.length === 0) {

            emptyMessage.textContent = "No students found.";

            emptyMessage.style.display = "block";

            return;

        }

        emptyMessage.style.display = "none";

        data.forEach((student, index) => {

            const row = document.createElement("tr");

            const values = [
                index + 1,
                student.name,
                student.studentId,
                student.email,
                student.department
            ];

            values.forEach(value => {

                const cell = document.createElement("td");

                cell.textContent = value || "-";

                row.appendChild(cell);

            });

            // DELETE BUTTON

            const actionCell = document.createElement("td");

            const deleteButton = document.createElement("button");

            deleteButton.textContent = "Delete";

            deleteButton.className = "delete-btn";

            deleteButton.addEventListener("click", () => {

                deleteStudent(student.studentId);

            });

            actionCell.appendChild(deleteButton);

            row.appendChild(actionCell);

            studentTable.appendChild(row);

        });

    }

    // ======================================
    // SEARCH STUDENTS
    // ======================================

    searchInput.addEventListener("input", function() {

        const query = this.value.trim().toLowerCase();

        const filteredStudents = students.filter(student => {

            return (
                student.name.toLowerCase().includes(query) ||
                student.studentId.toLowerCase().includes(query) ||
                student.email.toLowerCase().includes(query) ||
                student.department.toLowerCase().includes(query)
            );

        });

        displayStudents(filteredStudents);

    });

    // ======================================
    // DELETE STUDENT FROM MONGODB
    // ======================================

    async function deleteStudent(studentId) {

        const confirmDelete = confirm(
            "Are you sure you want to delete this student?"
        );

        if (!confirmDelete) return;

        try {

            const response = await fetch(
                `http://localhost:5000/api/admin/students/${encodeURIComponent(studentId)}`,
                {
                    method: "DELETE"
                }
            );

            const data = await response.json();

            if (!response.ok) {

                alert(data.message || "Student deletion failed!");

                return;

            }

            alert("Student deleted successfully!");

            // REFRESH STUDENT LIST

            await loadStudents();

        } catch (error) {

            console.error("Delete Student Error:", error);

            alert("Server connection failed!");

        }

    }

    // ======================================
    // INITIALIZE STUDENT MANAGEMENT
    // ======================================

    loadStudents();

}