// CAMPUS360 ADMIN NOTIFICATIONS — MongoDB-backed broadcast management

if (
    sessionStorage.getItem("campus360AdminLoggedIn") !== "true" ||
    !sessionStorage.getItem("campus360AdminToken")
) {
    alert("Access Denied! Please login as Admin.");
    window.location.replace("../pages/admin-login.html");
} else {
    const API_URL = window.CAMPUS360_API_ORIGIN + "/api/admin/notifications";
    const form = document.getElementById("notificationForm");
    const list = document.getElementById("notificationList");
    const titleInput = document.getElementById("notificationTitle");
    const messageInput = document.getElementById("notificationMessage");
    const categoryInput = document.getElementById("notificationCategory");

    async function loadNotifications() {
        list.textContent = "Loading notifications...";
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Unable to load notifications.");

            list.innerHTML = "";
            const notifications = data.notifications || [];
            if (!notifications.length) {
                list.textContent = "No notifications have been sent yet.";
                return;
            }

            notifications.forEach(item => {
                const card = document.createElement("article");
                card.className = "notification-card";

                const heading = document.createElement("h3");
                heading.textContent = item.title;

                const message = document.createElement("p");
                message.textContent = item.message;

                const meta = document.createElement("small");
                meta.textContent = `${item.category} · ${item.studentId} · ${new Date(item.createdAt).toLocaleString()} · ${item.read ? "Read" : "Unread"}`;

                const remove = document.createElement("button");
                remove.type = "button";
                remove.textContent = "Delete";
                remove.className = "delete-btn";
                remove.addEventListener("click", async () => {
                    if (!confirm("Delete this notification for this student?")) return;
                    remove.disabled = true;
                    try {
                        const result = await fetch(`${API_URL}/${encodeURIComponent(item._id)}`, {
                            method: "DELETE"
                        });
                        const body = await result.json();
                        if (!result.ok) throw new Error(body.message || "Delete failed.");
                        await loadNotifications();
                    } catch (error) {
                        alert(error.message || "Unable to delete notification.");
                        remove.disabled = false;
                    }
                });

                card.append(heading, message, meta, remove);
                list.appendChild(card);
            });
        } catch (error) {
            console.error("Admin Notifications Error:", error);
            list.textContent = error.message || "Unable to load notifications.";
        }
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();
        const title = titleInput.value.trim();
        const message = messageInput.value.trim();
        const category = categoryInput.value;
        if (!title || !message) {
            alert("Please enter a title and message.");
            return;
        }

        const submit = form.querySelector('button[type="submit"]');
        submit.disabled = true;
        submit.textContent = "Sending...";
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, message, category })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Notification could not be sent.");
            alert(data.message || "Notification sent.");
            form.reset();
            await loadNotifications();
        } catch (error) {
            alert(error.message || "Unable to send notification.");
        } finally {
            submit.disabled = false;
            submit.textContent = "Send to All Students";
        }
    });

    loadNotifications();
}
