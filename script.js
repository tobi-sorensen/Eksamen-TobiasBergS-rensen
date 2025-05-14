// Håndter registrering
document.getElementById('registerForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;

    let users = JSON.parse(localStorage.getItem('users')) || {};

    if (users[username]) {
        showMessage("Brukernavnet finnes allerede.");
    } else {
        users[username] = password;
        localStorage.setItem('users', JSON.stringify(users));
        showMessage("Bruker registrert! Du kan nå logge inn.");
        this.reset();
    }
});

// Håndter innlogging
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    let users = JSON.parse(localStorage.getItem('users')) || {};

    if (users[username] && users[username] === password) {
        localStorage.setItem('loggedInUser', username);
        window.location.href = "side2.html";
    } else {
        showMessage("Feil brukernavn eller passord.");
    }
});

// Vis meldinger
function showMessage(msg) {
    document.getElementById('message').innerText = msg;
}