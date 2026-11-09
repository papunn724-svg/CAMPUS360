// CAMPUS360 DIGITAL NOTES SYSTEM

const searchInput = document.getElementById("searchInput");
const subjectFilter = document.getElementById("subjectFilter");
const notesContainer = document.getElementById("notesContainer");

const noteCards = document.querySelectorAll(".note-card");

// SEARCH AND FILTER

function filterNotes() {

    const searchText = searchInput.value.toLowerCase();
    const selectedSubject = subjectFilter.value;

    let visibleCount = 0;

    noteCards.forEach(card => {

        const title = card.querySelector("h2").textContent.toLowerCase();

        const description = card.querySelector("p").textContent.toLowerCase();

        const subject = card.dataset.subject;

        const matchesSearch =
            title.includes(searchText) ||
            description.includes(searchText);

        const matchesSubject =
            selectedSubject === "all" ||
            subject === selectedSubject;

        if (matchesSearch && matchesSubject) {

            card.style.display = "block";
            visibleCount++;

        } else {

            card.style.display = "none";

        }

    });

    let message = document.getElementById("noResults");

    if (visibleCount === 0) {

        if (!message) {

            message = document.createElement("div");

            message.id = "noResults";
            message.className = "no-results";

            message.textContent = "No notes found! Try another search.";

            notesContainer.appendChild(message);

        }

    } else if (message) {

        message.remove();

    }

}


// SEARCH EVENTS

searchInput.addEventListener("input", filterNotes);

subjectFilter.addEventListener("change", filterNotes);


// DOWNLOAD NOTES DEMO

function downloadNotes(subject) {

    const notes = {

        c: "C PROGRAMMING\n\nIntroduction to C Programming\n\n1. Variables\n2. Data Types\n3. Operators\n4. Conditional Statements\n5. Loops\n6. Functions",

        dbms: "DATABASE MANAGEMENT SYSTEM\n\n1. Introduction to DBMS\n2. Database Models\n3. SQL Basics\n4. Primary Key\n5. Foreign Key\n6. Normalization",

        web: "WEB DEVELOPMENT\n\n1. HTML Basics\n2. CSS Styling\n3. JavaScript\n4. DOM Manipulation\n5. Responsive Design",

        math: "MATHEMATICS\n\n1. Algebra\n2. Matrices\n3. Differentiation\n4. Integration\n5. Probability",

        computer: "COMPUTER FUNDAMENTALS\n\n1. Computer Basics\n2. Hardware\n3. Software\n4. Operating Systems\n5. Memory"

    };

    const content = notes[subject];

    if (!content) {
        alert("Notes not available.");
        return;
    }

    const blob = new Blob([content], {
        type: "text/plain"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = subject + "-notes.txt";

    link.click();

    URL.revokeObjectURL(url);

}