
// CAMPUS360 - Campus Events Management

// DEFAULT EVENTS
const defaultEvents = [
    {
        id: 1,
        title: "Tech Fest 2026",
        category: "Technical",
        date: "2026-11-15",
        time: "10:00 AM",
        location: "College Auditorium",
        description: "Explore technology, coding and innovation."
    },
    {
        id: 2,
        title: "Annual Cultural Fest",
        category: "Cultural",
        date: "2026-11-18",
        time: "11:00 AM",
        location: "Main Campus",
        description: "Enjoy music, dance and cultural performances."
    },
    {
        id: 3,
        title: "Inter College Cricket",
        category: "Sports",
        date: "2026-11-20",
        time: "09:00 AM",
        location: "College Playground",
        description: "Participate in an exciting cricket tournament."
    },
    {
        id: 4,
        title: "Coding Competition",
        category: "Technical",
        date: "2026-11-23",
        time: "10:30 AM",
        location: "Computer Lab",
        description: "Show your programming and problem-solving skills."
    },
    {
        id: 5,
        title: "Photography Contest",
        category: "Cultural",
        date: "2026-11-25",
        time: "12:00 PM",
        location: "College Campus",
        description: "Capture beautiful moments of campus life."
    },
    {
        id: 6,
        title: "Football Tournament",
        category: "Sports",
        date: "2026-11-28",
        time: "08:00 AM",
        location: "Sports Ground",
        description: "Join the inter-department football tournament."
    }
];

// LOAD ADMIN EVENTS
function loadAllEvents() {

    const adminEvents = JSON.parse(
        localStorage.getItem("campus360AdminEvents") || "[]"
    );

    const convertedAdminEvents = adminEvents.map(event => ({
        id: event.id,
        title: event.name,
        category: "General",
        date: event.date,
        time: "To be announced",
        location: event.venue,
        description: event.description
    }));

    return [...defaultEvents, ...convertedAdminEvents];
}

let events = loadAllEvents();

// REGISTERED EVENTS
let registered = JSON.parse(
    localStorage.getItem("campus360Events") || "[]"
);

let selectedCategory = "All";

const eventGrid = document.getElementById("eventGrid");
const searchInput = document.getElementById("searchEvent");

// UPDATE STATISTICS
function updateStats() {

    const today = new Date().toLocaleDateString("en-CA");

    const upcoming = events.filter(
        event => event.date >= today
    );

    document.getElementById("totalEvents").textContent =
        events.length;

    document.getElementById("upcomingEvents").textContent =
        upcoming.length;

    document.getElementById("registeredEvents").textContent =
        registered.length;
}

// DISPLAY EVENTS
function displayEvents() {

    // Refresh admin events whenever page is displayed
    events = loadAllEvents();

    const searchText = searchInput.value.toLowerCase();
    const today = new Date().toLocaleDateString("en-CA");

    const filteredEvents = events.filter(event => {

        const matchesSearch =
            event.title.toLowerCase().includes(searchText) ||
            event.category.toLowerCase().includes(searchText) ||
            event.location.toLowerCase().includes(searchText);

        const matchesCategory =
            selectedCategory === "All" ||
            event.category === selectedCategory;

        const isUpcoming = event.date >= today;

        return matchesSearch && matchesCategory && isUpcoming;
    });

    eventGrid.innerHTML = "";

    if (filteredEvents.length === 0) {
        eventGrid.innerHTML = `
            <div class="empty-message">
                <h3>No Events Found!</h3>
                <p>Try another search.</p>
            </div>
        `;
        return;
    }

    filteredEvents.forEach(event => {

        const isRegistered = registered.includes(event.id);

        const formattedDate = new Date(
            event.date + "T00:00:00"
        ).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        const card = document.createElement("div");
        card.className = "event-card";

        card.innerHTML = `
            <h3>🎓 ${event.title}</h3>
            <p>📌 Category: ${event.category}</p>
            <p>📅 Date: ${formattedDate}</p>
            <p>⏰ Time: ${event.time}</p>
            <p>📍 Location: ${event.location}</p>
            <p>${event.description}</p>

            <button
                onclick="registerEvent(${event.id})"
                ${isRegistered ? "disabled" : ""}
            >
                ${isRegistered ? "✓ Registered" : "Register Now →"}
            </button>
        `;

        eventGrid.appendChild(card);
    });

    updateStats();
}

// REGISTER EVENT
function registerEvent(id) {

    if (registered.includes(id)) {
        alert("You are already registered!");
        return;
    }

    const event = events.find(item => item.id === id);

    if (!event) return;

    const confirmRegistration = confirm(
        `Do you want to register for ${event.title}?`
    );

    if (!confirmRegistration) return;

    registered.push(id);

    localStorage.setItem(
        "campus360Events",
        JSON.stringify(registered)
    );

    alert("Registration Successful! 🎉");

    displayEvents();
}

// SEARCH EVENTS
searchInput.addEventListener("input", displayEvents);

// CATEGORY FILTERS
document.querySelectorAll(".filter-btn").forEach(button => {

    button.addEventListener("click", () => {

        document.querySelectorAll(".filter-btn").forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        selectedCategory = button.dataset.category;

        displayEvents();
    });
});

// INITIALIZE
updateStats();
displayEvents();
