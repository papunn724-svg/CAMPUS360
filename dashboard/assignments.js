
// CAMPUS360 STUDENT ASSIGNMENT SYSTEM

const student = JSON.parse(
    sessionStorage.getItem("campus360CurrentStudent") || "null"
);

if (!student) {

    alert("Please login first!");
    window.location.href = "../pages/login.html";

} else {

    const API_URL = "http://localhost:5000/api/student";

    const list = document.getElementById("assignmentList");
    const searchInput = document.getElementById("search");
    const filterInput = document.getElementById("filter");

    const uploadForm = document.getElementById("uploadForm");
    const uploadMessage = document.getElementById("uploadMessage");

    const titleInput = document.getElementById("assignmentTitle");
    const fileInput = document.getElementById("assignmentFile");

    const resultsList = document.getElementById("resultsList");

    let assignments = [];
    let submissions = [];


    // GET TODAY'S DATE
    function getTodayDate() {

        const today = new Date();

        return (
            today.getFullYear() + "-" +
            String(today.getMonth() + 1).padStart(2, "0") + "-" +
            String(today.getDate()).padStart(2, "0")
        );
    }


    // GET ASSIGNMENT SUBMISSION
    function getSubmission(assignment) {

        return submissions.find(item =>
            String(item.assignmentId?._id || item.assignmentId) ===
            String(assignment._id)
        );

    }


    // GET ASSIGNMENT STATUS
    function getStatus(assignment) {

        const submission = getSubmission(assignment);

        if (
            submission &&
            ["Submitted", "Checked"].includes(submission.status)
        ) {
            return submission.status;
        }

        return assignment.dueDate < getTodayDate()
            ? "Overdue"
            : "Pending";
    }


    // LOAD ASSIGNMENTS AND SUBMISSIONS
    async function loadAssignments() {

        try {

            const [assignmentResponse, submissionResponse] =
                await Promise.all([

                    fetch(`${API_URL}/assignments`),

                    fetch(
                        `${API_URL}/submissions/${encodeURIComponent(student.studentId)}`
                    )

                ]);

            const assignmentData = await assignmentResponse.json();
            const submissionData = await submissionResponse.json();

            if (!assignmentResponse.ok || !submissionResponse.ok) {
                throw new Error("Unable to load assignments.");
            }

            assignments = assignmentData.assignments || [];
            submissions = submissionData.submissions || [];

            updatePage();
            renderResults();

        } catch (error) {

            console.error("Assignment Loading Error:", error);

            list.textContent = "Unable to load assignments. Please try again.";

            if (resultsList) {
                resultsList.textContent = "Unable to load results.";
            }

        }
    }


    // UPDATE STATISTICS
    function updatePage() {

        let pending = 0;
        let submitted = 0;
        let overdue = 0;

        assignments.forEach(assignment => {

            const status = getStatus(assignment);

            if (status === "Pending") pending++;
            if (["Submitted", "Checked"].includes(status)) submitted++;
            if (status === "Overdue") overdue++;

        });

        document.getElementById("total").textContent = assignments.length;
        document.getElementById("pending").textContent = pending;
        document.getElementById("submitted").textContent = submitted;
        document.getElementById("overdue").textContent = overdue;

        renderAssignments();
    }


    // DISPLAY ASSIGNMENTS
    function renderAssignments() {

        list.innerHTML = "";

        const query = searchInput.value.toLowerCase().trim();
        const filter = filterInput.value;

        const filtered = assignments.filter(assignment => {

            const status = getStatus(assignment);

            const matchesSearch =
                assignment.title.toLowerCase().includes(query) ||
                assignment.subject.toLowerCase().includes(query);

            const matchesFilter =
                filter === "all" ||
                (filter === "submitted" && ["Submitted", "Checked"].includes(status)) ||
                status.toLowerCase() === filter;

            return matchesSearch && matchesFilter;

        });


        if (filtered.length === 0) {

            list.textContent = "No assignments found.";
            return;

        }


        filtered.forEach(assignment => {

            const status = getStatus(assignment);
            const submission = getSubmission(assignment);

            const card = document.createElement("div");
            card.className = "assignment-item";

            const title = document.createElement("h3");
            title.textContent = assignment.title;

            const subject = document.createElement("p");
            subject.textContent = "Subject: " + assignment.subject;

            const description = document.createElement("p");
            description.textContent =
                "Description: " + assignment.description;

            const due = document.createElement("p");
            due.textContent = "Due Date: " + assignment.dueDate;

            const marks = document.createElement("p");
            marks.textContent =
                "Total Marks: " + assignment.totalMarks;

            const badge = document.createElement("span");

            badge.className = "status " +
                (status === "Checked"
                    ? "submitted-status"
                    : status === "Submitted"
                        ? "submitted-status"
                        : status === "Overdue"
                            ? "overdue-status"
                            : "pending-status");

            badge.textContent = status;

            card.append(
                title,
                subject,
                description,
                due,
                marks,
                badge
            );


            // UPLOAD BUTTON
            if (status !== "Submitted" && status !== "Checked") {

                const submitButton = document.createElement("button");

                submitButton.type = "button";
                submitButton.textContent = "Upload Assignment File";

                submitButton.style.cssText =
                    "display:block;margin-top:15px;padding:10px 15px;background:#087bff;color:white;border:0;border-radius:8px;cursor:pointer;";

                submitButton.addEventListener("click", () => {

                    titleInput.value = assignment.title;

                    uploadForm.dataset.assignmentId = assignment._id;

                    uploadForm.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                });

                card.appendChild(submitButton);

            }


            // DELETE UPLOADED FILE BUTTON
            if (submission && submission.filePath) {

                const deleteButton = document.createElement("button");

                deleteButton.type = "button";
                deleteButton.textContent = "Delete Uploaded File";

                deleteButton.style.cssText =
                    "display:block;margin-top:12px;padding:10px 15px;background:#dc3545;color:white;border:0;border-radius:8px;cursor:pointer;";

                deleteButton.addEventListener("click", () => {

                    deleteMySubmission(submission._id);

                });

                card.appendChild(deleteButton);

            }

            list.appendChild(card);

        });

    }


    // =====================================
    // STUDENT - MY RESULTS AND FEEDBACK
    // =====================================

    function renderResults() {

        if (!resultsList) return;

        resultsList.innerHTML = "";

        const checkedSubmissions = submissions.filter(
            submission => submission.status === "Checked"
        );

        if (checkedSubmissions.length === 0) {

            const message = document.createElement("p");

            message.textContent =
                "No results available yet. Your results will appear after the admin checks your assignments.";

            resultsList.appendChild(message);

            return;

        }


        checkedSubmissions.forEach(submission => {

            const assignmentId =
                submission.assignmentId?._id || submission.assignmentId;

            const assignment = assignments.find(item =>
                String(item._id) === String(assignmentId)
            );

            const totalMarks = Number(assignment?.totalMarks);

            const obtainedMarks = Number(submission.obtainedMarks);

            const percentage = totalMarks > 0
                ? ((obtainedMarks / totalMarks) * 100).toFixed(2)
                : "N/A";


            // RESULT CARD
            const card = document.createElement("div");

            card.className = "result-card";

            card.style.cssText =
                "background:white;padding:20px;margin:15px 0;border-radius:12px;box-shadow:0 3px 12px rgba(0,0,0,0.08);";


            const title = document.createElement("h3");

            title.textContent =
                assignment?.title || "Assignment";

            const marks = document.createElement("h2");

            marks.textContent =
                `${submission.obtainedMarks} / ${assignment?.totalMarks ?? "N/A"} Marks`;

            marks.style.color = "#087bff";


            const percentageText = document.createElement("p");

            percentageText.textContent =
                `Percentage: ${percentage}%`;


            const status = document.createElement("p");

            status.textContent = "Status: Checked";

            status.style.color = "green";
            status.style.fontWeight = "bold";


            const feedbackHeading = document.createElement("h4");

            feedbackHeading.textContent = "Teacher Feedback";


            const feedback = document.createElement("p");

            feedback.textContent =
                submission.feedback || "No feedback provided.";

            const checkedDate = document.createElement("p");

            checkedDate.textContent = submission.checkedAt
                ? "Checked On: " +
                  new Date(submission.checkedAt).toLocaleDateString()
                : "";


            card.append(
                title,
                marks,
                percentageText,
                status,
                feedbackHeading,
                feedback,
                checkedDate
            );

            resultsList.appendChild(card);

        });

    }


    // STUDENT - DELETE OWN SUBMISSION
    async function deleteMySubmission(submissionId) {

        const confirmDelete = confirm(
            "Are you sure you want to delete your uploaded assignment file?"
        );

        if (!confirmDelete) return;

        try {

            const response = await fetch(
                `${API_URL}/submissions/${submissionId}/${encodeURIComponent(student.studentId)}`,
                {
                    method: "DELETE"
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Delete failed!");
            }

            alert(result.message);

            await loadAssignments();

        } catch (error) {

            console.error("Student Delete Error:", error);

            alert(error.message || "Unable to delete uploaded file!");

        }

    }


    // SEARCH
    searchInput.addEventListener("input", renderAssignments);


    // FILTER
    filterInput.addEventListener("change", renderAssignments);


    // UPLOAD ASSIGNMENT FILE
    uploadForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const assignmentId = uploadForm.dataset.assignmentId;
        const file = fileInput.files[0];

        if (!assignmentId) {
            alert("Please select an assignment first!");
            return;
        }

        if (!file) {
            alert("Please select a file!");
            return;
        }

        const allowedExtensions = [".pdf", ".doc", ".docx"];

        const extension = file.name.substring(
            file.name.lastIndexOf(".")
        ).toLowerCase();

        if (!allowedExtensions.includes(extension)) {
            alert("Only PDF, DOC and DOCX files are allowed!");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            alert("Maximum file size is 2 MB!");
            return;
        }


        const formData = new FormData();

        formData.append("assignmentFile", file);
        formData.append("assignmentId", assignmentId);
        formData.append("studentId", student.studentId);


        try {

            const response = await fetch(
                `${API_URL}/upload-assignment`,
                {
                    method: "POST",
                    body: formData
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Upload failed!");
            }

            uploadMessage.textContent =
                "Assignment submitted successfully!";

            uploadForm.reset();
            delete uploadForm.dataset.assignmentId;

            await loadAssignments();

        } catch (error) {

            console.error("Upload Error:", error);

            uploadMessage.textContent =
                error.message || "Unable to upload assignment.";

        }

    });


    // INITIAL LOAD
    loadAssignments();

}
