
// ======================================
// CAMPUS360 - NOTIFICATIONS SYSTEM
// MongoDB Backend Connected
// ======================================

const API_URL = "https://campus360-lsvd.onrender.com/api";

// HTML ELEMENTS
const notificationList = document.getElementById("notificationList");

const unreadCount = document.getElementById("unreadCount");
const totalCount = document.getElementById("totalCount");
const readCount = document.getElementById("readCount");
const pendingCount = document.getElementById("pendingCount");

const markAllBtn = document.getElementById("markAllBtn");
const searchInput = document.getElementById("searchNotification");
const filterSelect = document.getElementById("filterNotification");

// GET LOGGED-IN STUDENT
let currentStudent = null;

try {
    currentStudent = JSON.parse(
        sessionStorage.getItem("campus360CurrentStudent")
    );
} catch (error) {
    console.error("Student Session Error:", error);
}

if (!currentStudent || !currentStudent.studentId) {

    alert("Please login first!");

    window.location.replace("../pages/login.html");

}

const studentId = currentStudent?.studentId;

let notifications = [];


// ======================================
// FETCH NOTIFICATIONS FROM MONGODB
// ======================================

async function loadNotifications() {

    try {

        notificationList.textContent = "Loading notifications...";

        const response = await fetch(
            `${API_URL}/student/notifications/${encodeURIComponent(studentId)}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load notifications!");
        }

        notifications = data.notifications || [];

        displayNotifications();

    } catch (error) {

        console.error("Notification Load Error:", error);

        notificationList.textContent =
            "Unable to load notifications. Please try again.";

    }

}


// ======================================
// UPDATE STATISTICS
// ======================================

function updateStatistics() {

    const total = notifications.length;

    const unread = notifications.filter(
        notification => !notification.read
    ).length;

    const read = notifications.filter(
        notification => notification.read
    ).length;

    totalCount.textContent = total;
    unreadCount.textContent = unread;
    readCount.textContent = read;
    pendingCount.textContent = unread;

}


// ======================================
// DISPLAY NOTIFICATIONS
// ======================================

function displayNotifications() {

    const searchText = searchInput.value.toLowerCase();

    const filterValue = filterSelect.value;

    const filtered = notifications.filter(notification => {

        const matchesSearch =
            notification.title.toLowerCase().includes(searchText) ||
            notification.message.toLowerCase().includes(searchText);

        const matchesFilter =
            filterValue === "All" ||
            (filterValue === "Unread" && !notification.read) ||
            (filterValue === "Read" && notification.read) ||
            notification.category === filterValue;

        return matchesSearch && matchesFilter;

    });

    notificationList.innerHTML = "";

    if (filtered.length === 0) {

        const emptyMessage = document.createElement("div");

        emptyMessage.className = "empty-notification";

        const heading = document.createElement("h3");
        heading.textContent = "No Notifications Found!";

        const paragraph = document.createElement("p");
        paragraph.textContent = "Try another search.";

        emptyMessage.append(heading, paragraph);

        notificationList.appendChild(emptyMessage);

        updateStatistics();

        return;

    }

    filtered.forEach(notification => {

        const card = document.createElement("div");

        card.className = "notification-card";

        // NOTIFICATION CONTENT
        const content = document.createElement("div");
        content.className = "notification-content";

        const title = document.createElement("h3");
        title.textContent = notification.title;

        const message = document.createElement("p");
        message.textContent = notification.message;

        const date = document.createElement("small");

        const formattedDate = notification.createdAt
            ? new Date(notification.createdAt).toLocaleString()
            : "";

        date.textContent =
            `${notification.category} | ${formattedDate}`;

        const status = document.createElement("p");
        status.className = "status";
        status.textContent = notification.read ? "Read" : "Unread";

        content.append(title, message, date, status);

        // ACTION BUTTONS
        const actions = document.createElement("div");
        actions.className = "notification-actions";

        if (!notification.read) {

            const readButton = document.createElement("button");

            readButton.className = "read-btn";
            readButton.textContent = "Mark as Read";
            readButton.dataset.action = "read";
            readButton.dataset.id = notification._id;

            actions.appendChild(readButton);

        }

        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.id = notification._id;

        actions.appendChild(deleteButton);

        content.appendChild(actions);
        card.appendChild(content);

        notificationList.appendChild(card);

    });

    updateStatistics();

}


// ======================================
// MARK ALL NOTIFICATIONS AS READ
// ======================================

markAllBtn.addEventListener("click", async () => {

    try {

        markAllBtn.disabled = true;

        const response = await fetch(
            `${API_URL}/student/notifications/read-all/${encodeURIComponent(studentId)}`,
            {
                method: "PUT"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Update failed!");
        }

        await loadNotifications();

    } catch (error) {

        console.error("Mark All Read Error:", error);

        alert("Unable to mark all notifications as read!");

    } finally {

        markAllBtn.disabled = false;

    }

});


// ======================================
// SEARCH NOTIFICATIONS
// ======================================

searchInput.addEventListener("input", displayNotifications);


// ======================================
// FILTER NOTIFICATIONS
// ======================================

filterSelect.addEventListener("change", displayNotifications);


// ======================================
// INDIVIDUAL NOTIFICATION ACTIONS
// ======================================

notificationList.addEventListener("click", async (event) => {

    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;

    const action = button.dataset.action;

    try {

        button.disabled = true;

        let response;

        if (action === "read") {

            response = await fetch(
                `${API_URL}/student/notifications/${id}/read/${encodeURIComponent(studentId)}`,
                {
                    method: "PUT"
                }
            );

        }

        if (action === "delete") {

            response = await fetch(
                `${API_URL}/student/notifications/${id}/${encodeURIComponent(studentId)}`,
                {
                    method: "DELETE"
                }
            );

        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Action failed!");
        }

        await loadNotifications();

    } catch (error) {

        console.error("Notification Action Error:", error);

        alert("Unable to update notification!");

        button.disabled = false;

    }

});


// ======================================
// INITIAL LOAD
// ======================================

if (studentId) {
    loadNotifications();
}
