const API_BASE = "https://crudcrud.com/api/aef45371b5da464e8b46a3b89ebe2582/users";
const messageBox = document.getElementById('message');

// Registrering
document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const name = document.getElementById('regName')?.value?.trim() || "";
    const age = parseInt(document.getElementById('regAge')?.value) || 0;
    const location = document.getElementById('regLocation')?.value?.trim() || "";

    if (!username || !password) {
        showMessage("Brukernavn og passord må fylles ut.");
        return;
    }

    console.log("Forsøker å registrere bruker:", username);
    const users = await fetchUsers();

    if (users.find(u => u.username === username)) {
        showMessage("Brukernavn er allerede i bruk.");
        console.log("Brukernavn finnes allerede:", username);
        return;
    }

    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, name, age, location })
        });

        if (response.ok) {
            console.log("Bruker registrert:", username);
            showMessage("Bruker registrert! Du kan nå logge inn.");
            document.getElementById('registerForm').reset();
        } else {
            console.error("Registrering feilet:", await response.text());
            showMessage("Noe gikk galt ved registrering.");
        }
    } catch (err) {
        console.error("Feil ved registrering:", err);
        showMessage("Klarte ikke å koble til serveren.");
    }
});

// Innlogging
document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    console.log("Forsøker å logge inn som:", username);

    const users = await fetchUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        console.log("Innlogging vellykket:", username);
        localStorage.setItem('loggedInUser', username);
        window.location.href = "side2.html";
    } else {
        console.warn("Feil brukernavn eller passord for:", username);
        showMessage("Feil brukernavn eller passord.");
    }
});

async function fetchUsers() {
    try {
        console.log("📥 Henter brukere fra API...");
        const response = await fetch(API_BASE);
        if (!response.ok) throw new Error("Respons ikke OK");
        const data = await response.json();
        console.log("Brukere mottatt:", data);
        return data;
    } catch (err) {
        console.error("Feil ved henting av brukere:", err);
        showMessage("Klarte ikke å hente brukerdata.");
        return [];
    }
}

function showMessage(msg) {
    messageBox.innerText = msg;
}

async function patchMissingPasswords(defaultPassword = "1234") {
    const users = await fetchUsers();
    for (const user of users) {
        if (!user.password && user._id) {
            const updated = { ...user, password: defaultPassword };
            delete updated._id;

            console.log("Oppdaterer bruker uten passord:", user.username);

            await fetch(`${API_BASE}/${user._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updated)
            });
        }
    }
}