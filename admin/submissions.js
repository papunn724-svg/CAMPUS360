
// CHECK ADMIN SESSION
if (sessionStorage.getItem("campus360AdminLoggedIn") !== "true") {

    alert("Access Denied! Please Login as Admin.");
    window.location.replace("../pages/admin-login.html");

} else {

    const table = document.getElementById("submissionTable");
    const searchInput = document.getElementById("searchSubmission");
    const emptyMessage = document.getElementById("emptyMessage");

    const API_URL = "https://campus360-lsvd.onrender.com/api/admin/submissions";

    let submissions = [];


    // LOAD SUBMISSIONS
    async function loadSubmissions() {

        try {

            const response = await fetch(API_URL);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message);
            }

            submissions = result.submissions || [];

            displaySubmissions(submissions);

        } catch (error) {

            console.error("Submission Error:", error);

            alert("Unable to load student submissions!");

        }
    }


    // DISPLAY SUBMISSIONS
    function displaySubmissions(data) {

        table.innerHTML = "";

        emptyMessage.style.display =
            data.length === 0 ? "block" : "none";

        data.forEach((submission, index) => {

            const row = document.createElement("tr");

            function addCell(value) {

                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);

                return cell;
            }


            // BASIC DETAILS
            addCell(index + 1);
            addCell(submission.studentName || "N/A");
            addCell(submission.studentId || "N/A");

            const assignment = submission.assignmentId;

            addCell(assignment?.title || "Assignment Deleted");

            const submittedDate = submission.submittedAt
                ? new Date(submission.submittedAt).toLocaleString()
                : "N/A";

            addCell(submittedDate);


            // DOWNLOAD FILE
            const fileCell = addCell("");

            if (submission.filePath) {

                const fileLink = document.createElement("a");

                fileLink.textContent =
                    submission.fileName || "View File";

                fileLink.href =
                    `${API_URL}/${encodeURIComponent(submission._id)}/file`;

                fileLink.target = "_blank";
                fileLink.rel = "noopener noreferrer";

                fileCell.appendChild(fileLink);

            } else {

                fileCell.textContent = "No File";

            }


            // OBTAINED MARKS INPUT
            const marksCell = addCell("");

            const marksInput = document.createElement("input");

            marksInput.type = "number";
            marksInput.min = "0";
            marksInput.max = assignment?.totalMarks ?? "";
            marksInput.step = "any";
            marksInput.placeholder = "Enter Marks";
            marksInput.value =
                submission.obtainedMarks ?? "";

            marksInput.style.cssText =
                "width:100px;padding:8px;box-sizing:border-box;";

            marksCell.appendChild(marksInput);


            // FEEDBACK INPUT
            const feedbackCell = addCell("");

            const feedbackInput = document.createElement("textarea");

            feedbackInput.placeholder = "Write feedback...";
            feedbackInput.value = submission.feedback || "";
            feedbackInput.rows = 2;

            feedbackInput.style.cssText =
                "width:150px;min-width:120px;padding:8px;resize:vertical;";

            feedbackCell.appendChild(feedbackInput);


            // STATUS
            const statusCell = addCell(submission.status || "Pending");

            if (submission.status === "Checked") {

                statusCell.style.color = "green";
                statusCell.style.fontWeight = "bold";

            } else {

                statusCell.style.color = "#d97706";
                statusCell.style.fontWeight = "bold";

            }


            // ACTIONS
            const actionCell = addCell("");

            // SAVE / UPDATE GRADE BUTTON
            const gradeButton = document.createElement("button");

            gradeButton.type = "button";

            gradeButton.textContent =
                submission.status === "Checked"
                    ? "Update Grade"
                    : "Save Grade";

            gradeButton.style.cssText =
                "padding:8px 12px;background:#087bff;color:white;border:0;border-radius:6px;cursor:pointer;margin:3px;";

            gradeButton.addEventListener("click", function() {

                saveGrade(
                    submission._id,
                    marksInput.value,
                    feedbackInput.value,
                    gradeButton
                );

            });

            actionCell.appendChild(gradeButton);


            // DELETE BUTTON
            const deleteButton = document.createElement("button");

            deleteButton.type = "button";
            deleteButton.textContent = "Delete";

            deleteButton.style.cssText =
                "padding:8px 12px;background:#dc3545;color:white;border:0;border-radius:6px;cursor:pointer;margin:3px;";

            deleteButton.addEventListener("click", function() {

                deleteSubmission(submission._id);

            });

            actionCell.appendChild(deleteButton);

        });

    }


    // ADMIN - SAVE / UPDATE GRADE
    async function saveGrade(id, marks, feedback, button) {

        if (marks === "" || !Number.isFinite(Number(marks))) {

            alert("Please enter valid obtained marks!");
            return;

        }

        const submission = submissions.find(
            item => String(item._id) === String(id)
        );

        const totalMarks = submission?.assignmentId?.totalMarks;

        if (totalMarks === undefined || totalMarks === null) {

            alert("Assignment details not found. Cannot grade this submission.");
            return;

        }

        if (Number(marks) < 0 || Number(marks) > Number(totalMarks)) {

            alert(`Please enter marks between 0 and ${totalMarks}!`);
            return;

        }

        try {

            button.disabled = true;
            button.textContent = "Saving...";

            const response = await fetch(
                `${API_URL}/${encodeURIComponent(id)}/grade`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        obtainedMarks: Number(marks),
                        feedback: feedback.trim()

                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Grading failed!");
            }

            alert(result.message);

            await loadSubmissions();

        } catch (error) {

            console.error("Grading Error:", error);

            alert(error.message || "Unable to save grade!");

            button.disabled = false;
            button.textContent = "Save Grade";

        }

    }


    // ADMIN - DELETE SUBMISSION
    async function deleteSubmission(id) {

        const confirmDelete = confirm(
            "Are you sure you want to delete this student's uploaded file and submission record?"
        );

        if (!confirmDelete) return;

        try {

            const response = await fetch(
                `${API_URL}/${encodeURIComponent(id)}`,
                {
                    method: "DELETE"
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Delete failed!");
            }

            alert(result.message);

            await loadSubmissions();

        } catch (error) {

            console.error("Admin Delete Error:", error);

            alert(error.message || "Unable to delete submission!");

        }

    }


    // SEARCH
    searchInput.addEventListener("input", function() {

        const query = this.value.toLowerCase().trim();

        const filtered = submissions.filter(submission => {

            const studentName =
                (submission.studentName || "").toLowerCase();

            const studentId =
                (submission.studentId || "").toLowerCase();

            const assignmentTitle =
                (submission.assignmentId?.title || "").toLowerCase();

            return (
                studentName.includes(query) ||
                studentId.includes(query) ||
                assignmentTitle.includes(query)
            );

        });

        displaySubmissions(filtered);

    });


    // INITIAL LOAD
    loadSubmissions();

}
