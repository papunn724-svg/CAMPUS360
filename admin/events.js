// CHECK ADMIN SESSION
if (sessionStorage.getItem("campus360AdminLoggedIn") !== "true") {

    alert("Access Denied! Please Login as Admin.");

    window.location.replace("../pages/admin-login.html");

}
// CAMPUS360 ADMIN EVENT MANAGEMENT

const eventForm = document.getElementById("eventForm");
const eventContainer = document.getElementById("eventContainer");
const searchEvent = document.getElementById("searchEvent");

// LOAD SAVED EVENTS
let events = JSON.parse(
    localStorage.getItem("campus360AdminEvents") || "[]"
);

// DISPLAY EVENTS
function displayEvents(data) {
    eventContainer.innerHTML = "";

    if (data.length === 0) {
        eventContainer.innerHTML = "<p>No events found.</p>";
        return;
    }

    data.forEach(event => {
        const card = document.createElement("div");
        card.className = "event-card";

        const title = document.createElement("h3");
        title.textContent = event.name;

        const date = document.createElement("p");
        date.textContent = "Date: " + event.date;

        const venue = document.createElement("p");
        venue.textContent = "Venue: " + event.venue;

        const description = document.createElement("p");
        description.textContent = event.description;

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete Event";
        deleteButton.className = "delete-btn";

        deleteButton.addEventListener("click", function() {
            events = events.filter(item => item.id !== event.id);

            localStorage.setItem(
                "campus360AdminEvents",
                JSON.stringify(events)
            );

            displayEvents(events);
        });

        card.appendChild(title);
        card.appendChild(date);
        card.appendChild(venue);
        card.appendChild(description);
        card.appendChild(deleteButton);

        eventContainer.appendChild(card);
    });
}

// ADD NEW EVENT
eventForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const newEvent = {
        id: Date.now(),
        name: document.getElementById("eventName").value.trim(),
        date: document.getElementById("eventDate").value,
        venue: document.getElementById("eventVenue").value.trim(),
        description: document.getElementById("eventDescription").value.trim()
    };

    if (!newEvent.name || !newEvent.date ||
        !newEvent.venue || !newEvent.description) {
        alert("Please fill all details!");
        return;
    }

    events.push(newEvent);

    localStorage.setItem(
        "campus360AdminEvents",
        JSON.stringify(events)
    );

    eventForm.reset();
    displayEvents(events);

    alert("Event Added Successfully!");
});

// SEARCH EVENTS
searchEvent.addEventListener("input", function() {
    const query = this.value.toLowerCase();

    const filteredEvents = events.filter(event =>
        event.name.toLowerCase().includes(query) ||
        event.venue.toLowerCase().includes(query)
    );

    displayEvents(filteredEvents);
});

// INITIAL DISPLAY
displayEvents(events);