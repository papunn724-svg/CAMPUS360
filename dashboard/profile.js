// CAMPUS360 PROFILE MANAGEMENT

const student = JSON.parse(
    sessionStorage.getItem("campus360CurrentStudent") || "null"
);

if (!student) {
    alert("Please login first!");
    window.location.href = "../pages/login.html";
} else {

    const storageKey = "profile_" + student.studentId;

    let profile = JSON.parse(
        localStorage.getItem(storageKey) || "null"
    ) || {
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        department: student.department,
        semester: "",
        phone: "",
        photo: ""
    };

    const form = document.getElementById("profileForm");

    const nameInput = document.getElementById("fullName");
    const emailInput = document.getElementById("email");
    const idInput = document.getElementById("studentId");
    const departmentInput = document.getElementById("department");
    const semesterInput = document.getElementById("semester");
    const phoneInput = document.getElementById("phone");

    const profileImage = document.getElementById("profileImage");
    const photoInput = document.getElementById("photoInput");

    // LOAD PROFILE

    function loadProfile() {

        nameInput.value = profile.name;
        emailInput.value = profile.email;
        idInput.value = profile.studentId;
        departmentInput.value = profile.department;
        semesterInput.value = profile.semester;
        phoneInput.value = profile.phone;

        document.getElementById("displayName").textContent =
            profile.name;

        if (profile.photo) {
            profileImage.src = profile.photo;
        }
    }

    // SAVE PROFILE

    form.addEventListener("submit", function(event) {

        event.preventDefault();

        profile.name = nameInput.value.trim();
        profile.email = emailInput.value.trim();
        profile.department = departmentInput.value;
        profile.semester = semesterInput.value;
        profile.phone = phoneInput.value.trim();

        if (!profile.name || !profile.email) {
            alert("Please enter your name and email.");
            return;
        }

        localStorage.setItem(
            storageKey,
            JSON.stringify(profile)
        );

        document.getElementById("displayName").textContent =
            profile.name;

        alert("Profile Updated Successfully! 🎉");

    });

    // PROFILE PHOTO PREVIEW

    photoInput.addEventListener("change", function() {

        const file = this.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select an image.");
            return;
        }

        if (file.size > 1024 * 1024) {
            alert("Please select an image smaller than 1 MB.");
            this.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = function(event) {

            profile.photo = event.target.result;

            profileImage.src = profile.photo;

            localStorage.setItem(
                storageKey,
                JSON.stringify(profile)
            );

            alert("Profile Photo Updated! 📸");

        };

        reader.readAsDataURL(file);

    });

    loadProfile();
}