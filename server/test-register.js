async function testRegistration() {
    try {
        const response = await fetch("http://localhost:5000/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: "Test Student",
                studentId: "C360001",
                email: "teststudent@example.com",
                department: "BCA",
                password: "Test@12345"
            })
        });

        const data = await response.json();

        console.log("Status:", response.status);
        console.log("Response:", data);

    } catch (error) {
        console.log("Error:", error.message);
    }
}

testRegistration();