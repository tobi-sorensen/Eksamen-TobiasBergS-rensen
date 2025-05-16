/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const scriptPath = path.resolve(__dirname, '../script.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');
eval(scriptContent);

const side2 = require('../side2.js');
const { canSwipe } = side2;

beforeEach(() => {
  document.body.innerHTML = `
    <div id="message"></div>

    <!-- Registrering og innlogging -->
    <form id="registerForm">
      <input id="regUsername" />
      <input id="regPassword" type="password" />
      <input id="regName" />
      <input id="regAge" type="number" />
      <input id="regLocation" />
      <button type="submit">Registrer</button>
    </form>

    <form id="loginForm">
      <input id="loginUsername" />
      <input id="loginPassword" type="password" />
      <button type="submit">Logg inn</button>
    </form>

    <!-- Profilside -->
    <div id="usernameDisplay"></div>
    <form id="profileForm">
      <input id="name" />
      <input id="age" />
      <input id="location" />
      <button type="submit">Oppdater</button>
    </form>

    <select id="genderFilter"></select>
    <input id="minAge" />
    <input id="maxAge" />
    <form id="filterForm"></form>
    <ul id="likedUsersList"></ul>
    <button id="likeButton"></button>
    <button id="declineButton"></button>
  `;

  localStorage.clear();
  sessionStorage.clear();
  
  localStorage.setItem('loggedInUser', 'testuser');
  sessionStorage.setItem('swipeCount', '0');

  global.currentMatch = null;

  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Registrering og Innlogging', () => {
  test('fetchUsers returnerer brukere', async () => {
    const mockUsers = [{ username: 'testuser', password: '1234' }];
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });

    const users = await fetchUsers();
    expect(users).toEqual(mockUsers);
  });

  test('showMessage oppdaterer message DOM', () => {
    showMessage('Hei test');
    expect(document.getElementById('message').innerText).toBe('Hei test');
  });

  test("patchMissingPasswords oppdaterer brukere uten passord", async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { _id: "123", username: "bob" },
          { _id: "456", username: "alice", password: "secret" }
        ]
      })
      .mockResolvedValue({ ok: true }); 

    await patchMissingPasswords("nyttpass");

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("123"), expect.objectContaining({
      method: "PUT"
    }));
  });
});

describe('Profilside og swipe-funksjonalitet', () => {
  test('canSwipe returnerer true når swipeCount er 0', () => {
    sessionStorage.setItem('swipeCount', '0');
    expect(canSwipe()).toBe(true);
  });

  test('canSwipe returnerer false når swipeCount er 10', () => {
    sessionStorage.setItem('swipeCount', '10');
    expect(canSwipe()).toBe(false);
  });
});
