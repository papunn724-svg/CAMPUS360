async function testLogin() {
    try {
        const response = await fetch("http://localhost:5000/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: "teststudent@example.com",
                password: "Test@12345"
            })
        });

        const data = await response.text();

        console.log("Status:", response.status);
        console.log("Response:", data);

    } catch (error) {
        console.log("Error:", error.message);
    }
}

testLogin();