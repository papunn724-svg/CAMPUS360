// CHECK ADMIN SESSION
if (sessionStorage.getItem("campus360AdminLoggedIn") !== "true") {

    alert("Access Denied! Please Login as Admin.");

    window.location.replace("../pages/admin-login.html");

}
// CAMPUS360 ADMIN NOTIFICATIONS

const notificationForm = document.getElementById("notificationForm");
const notificationList = document.getElementById("notificationList");

let notifications = JSON.parse(
    localStorage.getItem("campusNotifications") || "[]"
);

// DISPLAY NOTIFICATIONS
function displayNotifications() {

    notificationList.innerHTML = "";

    if (notifications.length === 0) {
        notificationList.textContent = "No notifications available.";
        return;
    }

    notifications.forEach(notification => {

        const card = document.createElement("div");
        card.className = "notification-card";

        const title = document.createElement("h3");
        title.textContent = notification.title;

        const message = document.createElement("p");
        message.textContent = notification.message;

        const date = document.createElement("small");
        date.textContent = notification.date || "";

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";

        deleteButton.addEventListener("click", function() {

            notifications = notifications.filter(
                item => item.id !== notification.id
            );

            localStorage.setItem(
                "campusNotifications",
                JSON.stringify(notifications)
            );

            displayNotifications();
        });

        card.append(title, message, date, deleteButton);
        notificationList.appendChild(card);

    });
}

// ADD NOTIFICATION
notificationForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const title = document.getElementById("notificationTitle").value.trim();
    const message = document.getElementById("notificationMessage").value.trim();

    if (!title || !message) {
        alert("Please fill all details!");
        return;
    }

    const newNotification = {
        id: Date.now(),
        title: title,
        message: message,
        date: new Date().toLocaleString()
    };

    notifications.unshift(newNotification);

    localStorage.setItem(
        "campusNotifications",
        JSON.stringify(notifications)
    );

    notificationForm.reset();

    displayNotifications();

    alert("Notification Added Successfully!");
});

// INITIAL DISPLAY
displayNotifications();