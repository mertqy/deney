const fetch = require('node-fetch');

async function test() {
    const res = await fetch('https://deney-d2x5.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: "T User",
            email: "tuser1234@demo.com",
            password: "pass",
            birth_date: "1990-01-01"
        })
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data:", data);
}

test();
