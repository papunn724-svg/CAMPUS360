// CHECK ADMIN SESSION
if (sessionStorage.getItem("campus360AdminLoggedIn") !== "true") {

    alert("Access Denied! Please Login as Admin.");
    window.location.replace("../pages/admin-login.html");

} else {

    // ELEMENTS
    const table = document.getElementById("assignmentTable");
    const searchInput = document.getElementById("searchAssignment");
    const emptyMessage = document.getElementById("emptyMessage");

    const assignmentForm = document.getElementById("assignmentForm");

    const titleInput = document.getElementById("assignmentTitle");
    const subjectInput = document.getElementById("assignmentSubject");
    const descriptionInput = document.getElementById("assignmentDescription");
    const dueDateInput = document.getElementById("assignmentDueDate");
    const marksInput = document.getElementById("assignmentMarks");

    const API_URL = "http://localhost:5000/api/admin/assignments";

    let assignments = [];
    let editingId = null;


    // LOAD ASSIGNMENTS
    async function loadAssignments() {

        try {

            const response = await fetch(API_URL);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message);
            }

            assignments = result.assignments || [];

            displayAssignments(assignments);

        } catch (error) {

            console.error(error);
            alert("Unable to load assignments!");

        }
    }


    // GET ASSIGNMENT STATUS
    function getAssignmentStatus(dueDate) {

        const today = new Date();
        const localToday =
            today.getFullYear() + "-" +
            String(today.getMonth() + 1).padStart(2, "0") + "-" +
            String(today.getDate()).padStart(2, "0");

        if (dueDate < localToday) return "Overdue";
        if (dueDate === localToday) return "Due Today";

        return "Active";
    }


    // DISPLAY ASSIGNMENTS
    function displayAssignments(data) {

        table.innerHTML = "";

        emptyMessage.style.display =
            data.length === 0 ? "block" : "none";

        data.forEach((assignment, index) => {

            const row = document.createElement("tr");

            function addCell(value) {

                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);

            }

            addCell(index + 1);
            addCell("All Students");
            addCell(assignment.title);
            addCell(getAssignmentStatus(assignment.dueDate));

            // ACTION CELL
            const actionCell = document.createElement("td");

            // EDIT BUTTON
            const editButton = document.createElement("button");

            editButton.type = "button";
            editButton.textContent = "Edit";

            editButton.addEventListener("click", function() {

                editAssignment(assignment);

            });


            // DELETE BUTTON
            const deleteButton = document.createElement("button");

            deleteButton.type = "button";
            deleteButton.textContent = "Delete";

            deleteButton.addEventListener("click", function() {

                deleteAssignment(assignment._id);

            });


            actionCell.appendChild(editButton);
            actionCell.appendChild(deleteButton);

            row.appendChild(actionCell);

            table.appendChild(row);

        });

    }


    // ADD OR UPDATE ASSIGNMENT
    assignmentForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const assignmentData = {

            title: titleInput.value.trim(),
            subject: subjectInput.value.trim(),
            description: descriptionInput.value.trim(),
            dueDate: dueDateInput.value,
            totalMarks: Number(marksInput.value)

        };


        if (
            !assignmentData.title ||
            !assignmentData.subject ||
            !assignmentData.description ||
            !assignmentData.dueDate ||
            !Number.isFinite(assignmentData.totalMarks) ||
            assignmentData.totalMarks < 1
        ) {

            alert("Please fill all assignment details correctly!");
            return;

        }


        try {

            const url = editingId
                ? `${API_URL}/${editingId}`
                : API_URL;

            const method = editingId ? "PUT" : "POST";

            const response = await fetch(url, {

                method: method,

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(assignmentData)

            });


            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Save failed!");
            }

            alert(result.message);

            resetForm();

            await loadAssignments();

        } catch (error) {

            console.error(error);
            alert(error.message || "Unable to save assignment!");

        }

    });


    // EDIT ASSIGNMENT
    function editAssignment(assignment) {
        console.log("EDIT CLICKED:", assignment);

        editingId = assignment._id;

        titleInput.value = assignment.title;
        subjectInput.value = assignment.subject;
        descriptionInput.value = assignment.description;
        dueDateInput.value = assignment.dueDate;
        marksInput.value = assignment.totalMarks;

        assignmentForm.querySelector(
            'button[type="submit"]'
        ).textContent = "Update Assignment";

        assignmentForm.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }


    // DELETE ASSIGNMENT
    async function deleteAssignment(id) {

        const confirmDelete = confirm(
            "Are you sure you want to delete this assignment?"
        );

        if (!confirmDelete) return;

        try {

            const response = await fetch(`${API_URL}/${id}`, {
                method: "DELETE"
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Delete failed!");
            }

            alert(result.message);

            await loadAssignments();

        } catch (error) {

            console.error(error);
            alert(error.message || "Unable to delete assignment!");

        }

    }


    // RESET FORM
    function resetForm() {

        assignmentForm.reset();

        editingId = null;

        assignmentForm.querySelector(
            'button[type="submit"]'
        ).textContent = "Add Assignment";

    }


    // SEARCH
    searchInput.addEventListener("input", function() {

        const query = this.value.toLowerCase().trim();

        const filtered = assignments.filter(assignment => {

            return (
                assignment.title.toLowerCase().includes(query) ||
                assignment.subject.toLowerCase().includes(query)
            );

        });

        displayAssignments(filtered);

    });


    // INITIAL LOAD
    loadAssignments();

}