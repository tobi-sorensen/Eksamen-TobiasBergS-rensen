const API_BASE = "https://crudcrud.com/api/aef45371b5da464e8b46a3b89ebe2582";
const username = localStorage.getItem('loggedInUser');
let currentUserId = null;
let currentMatch = null;

const maxSwipes = 10;
let swipeCount = parseInt(sessionStorage.getItem('swipeCount')) || 0;

if (!username) {
    window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("usernameDisplay").textContent = username;
    fetchUserProfile();
    loadFilters();
    loadCurrentMatch();
    fetchLikedUsers();

    document.getElementById("profileForm").addEventListener("submit", updateProfile);
    document.getElementById("filterForm").addEventListener("submit", saveFilterSettings);
    document.getElementById("likeButton").addEventListener("click", likeCurrentMatch);
    document.getElementById("declineButton").addEventListener("click", declineCurrentMatch);
    document.getElementById("logoutButton").addEventListener("click", () => {
        localStorage.clear();
        sessionStorage.removeItem('swipeCount'); // nullstill swipeCount ved logout
        window.location.href = "index.html";
        console.log('loggedInUser etter logout:', localStorage.getItem('loggedInUser'));
    });
});

function canSwipe() {
    return swipeCount < maxSwipes;
}

async function fetchUserProfile() {
    try {
        const res = await fetch(`${API_BASE}/users`);
        const users = await res.json();
        const user = users.find(u => u.username === username);
        if (user) {
            currentUserId = user._id;
            document.getElementById("name").value = user.name || "";
            document.getElementById("age").value = user.age || "";
            document.getElementById("location").value = user.location || "";
        }
    } catch (err) {
        console.error("Feil ved henting av brukerprofil:", err);
        alert("Klarte ikke å hente brukerprofil.");
    }
}

async function updateProfile(e) {
    e.preventDefault();

    try {
        // Hent alle brukere og finn gjeldende bruker inkl. passord
        const res = await fetch(`${API_BASE}/users`);
        const users = await res.json();
        const existingUser = users.find(u => u.username === username);

        if (!existingUser) {
            alert("Fant ikke bruker i databasen.");
            return;
        }

        // Oppdater kun de nødvendige feltene, behold passordet
        const updatedUser = {
            username,
            password: existingUser.password, // Behold passord
            name: document.getElementById("name").value,
            age: parseInt(document.getElementById("age").value),
            location: document.getElementById("location").value
        };

        await fetch(`${API_BASE}/users/${existingUser._id}`, {
            method: "PUT",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser)
        });

        alert("Profil oppdatert!");
    } catch (err) {
        console.error("Feil ved oppdatering av profil:", err);
        alert("Klarte ikke å oppdatere profilen.");
    }
}

function saveFilterSettings(e) {
    e.preventDefault();
    const filters = {
        gender: document.getElementById("genderFilter").value,
        minAge: parseInt(document.getElementById("minAge").value) || 18,
        maxAge: parseInt(document.getElementById("maxAge").value) || 100
    };
    localStorage.setItem("userFilters", JSON.stringify(filters));
    fetchAndShowMatch();
}

function loadFilters() {
    const filters = JSON.parse(localStorage.getItem("userFilters"));
    if (filters) {
        document.getElementById("genderFilter").value = filters.gender || "";
        document.getElementById("minAge").value = filters.minAge;
        document.getElementById("maxAge").value = filters.maxAge;
    }
}

async function fetchAndShowMatch() {
    const filters = JSON.parse(localStorage.getItem("userFilters")) || { gender: '', minAge: 18, maxAge: 100 };
    try {
        const genderParam = filters.gender ? `&gender=${filters.gender}` : '';
        const res = await fetch(`https://randomuser.me/api/?results=10${genderParam}`);
        const data = await res.json();
        const match = data.results.find(u => {
            const age = u.dob.age;
            return age >= filters.minAge && age <= filters.maxAge;
        });
        if (match) {
            currentMatch = match;
            localStorage.setItem("currentMatch", JSON.stringify(match));
            displayMatch(match);
        } else {
            document.getElementById("matchDisplay").innerHTML = "<p>Fant ingen matcher som passer filteret.</p>";
        }
    } catch (err) {
        console.error("Feil ved henting av match:", err);
        alert("Klarte ikke å hente matcher.");
    }
}

function displayMatch(user) {
    const container = document.getElementById("matchDisplay");
    container.innerHTML = `
        <img src="${user.picture.large}" alt="Profilbilde">
        <p><strong>Navn:</strong> ${user.name.first} ${user.name.last}</p>
        <p><strong>Alder:</strong> ${user.dob.age}</p>
        <p><strong>Bosted:</strong> ${user.location.city}</p>
    `;
}

function loadCurrentMatch() {
    const saved = JSON.parse(localStorage.getItem("currentMatch"));
    if (saved) {
        currentMatch = saved;
        displayMatch(saved);
    } else {
        fetchAndShowMatch();
    }
}

async function likeCurrentMatch() {
    if (!currentMatch) return;
    if (!canSwipe()) {
        alert("Du har nådd maks antall swipes for denne økten.");
        return;
    }

    try {
        await fetch(`${API_BASE}/likedUsers`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentMatch)
        });
        swipeCount++;
        sessionStorage.setItem('swipeCount', swipeCount);
        fetchLikedUsers();
        fetchAndShowMatch();
    } catch (err) {
        console.error("Feil ved lagring av likt bruker:", err);
        alert("Klarte ikke å lagre likt bruker.");
    }
}

function declineCurrentMatch() {
    if (!canSwipe()) {
        alert("Du har nådd maks antall swipes for denne økten.");
        return;
    }
    swipeCount++;
    sessionStorage.setItem('swipeCount', swipeCount);
    fetchAndShowMatch();
}

async function fetchLikedUsers() {
    try {
        const res = await fetch(`${API_BASE}/likedUsers`);
        const users = await res.json();
        const list = document.getElementById("likedUsersList");
        list.innerHTML = "";
        users.forEach(user => {
            const li = document.createElement("li");
            li.innerHTML = `
                <img src="${user.picture.thumbnail}" alt="">
                ${user.name.first} ${user.name.last} (${user.dob.age}) - ${user.location.city}
                <button onclick="deleteLikedUser('${user._id}')">Slett</button>
            `;
            list.appendChild(li);
        });
    } catch (err) {
        console.error("Feil ved henting av likte brukere:", err);
        alert("Klarte ikke å hente likte brukere.");
    }
}

async function deleteLikedUser(id) {
    try {
        await fetch(`${API_BASE}/likedUsers/${id}`, {
            method: "DELETE"
        });
        fetchLikedUsers();
    } catch (err) {
        console.error("Feil ved sletting av likt bruker:", err);
        alert("Klarte ikke å slette bruker.");
    }
}