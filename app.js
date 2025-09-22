// Frontend JS connecting to Flask backend
const API_URL = "";

const app = document.getElementById('app');

// Render Login on load
function renderLogin() {
  app.innerHTML = `
    <h2>Login</h2>
    <form id="login-form">
      <label>Role:
        <select id="login-role" required>
          <option value="Farmer">Farmer</option>
          <option value="Wholesaler">Wholesaler</option>
          <option value="Retailer">Retailer</option>
        </select>
      </label>
      <label>Username:
        <input type="text" id="login-username" required />
      </label>
      <label>Password:
        <input type="password" id="login-password" required />
      </label>
      <p class="error" id="login-error" style="display:none;"></p>
      <button type="submit">Login</button>
    </form>
    <p>Don't have an account? <button class="link-button" id="to-signup">Signup</button></p>
    <p><button class="link-button" id="view-all">View All User Details</button></p>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleLogin();
  });
  document.getElementById('to-signup').addEventListener('click', renderSignup);
  document.getElementById('view-all').addEventListener('click', renderAllUsers);
}

// Render Signup
function renderSignup() {
  app.innerHTML = `
    <h2>Signup</h2>
    <form id="signup-form">
      <label>Role:
        <select id="signup-role" required>
          <option value="Farmer">Farmer</option>
          <option value="Wholesaler">Wholesaler</option>
          <option value="Retailer">Retailer</option>
        </select>
      </label>
      <label>Username:
        <input type="text" id="signup-username" required />
      </label>
      <label>Password:
        <input type="password" id="signup-password" required />
      </label>
      <label>Mobile Number:
        <input type="tel" id="signup-mobile" pattern="\\d{10}" placeholder="10 digit mobile number" required />
      </label>
      <p class="error" id="signup-error" style="display:none;"></p>
      <button type="submit">Signup</button>
    </form>
    <p>Already have an account? <button class="link-button" id="to-login">Login</button></p>
  <p>Host? <button class="link-button" id="host-login-btn">Host Login</button></p>
  `;

  document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSignup();
  });
  document.getElementById('to-login').addEventListener('click', renderLogin);
  document.getElementById('host-login-btn').addEventListener('click', renderHostLogin);
}

// Render Dashboard for logged user
function renderDashboard() {
  const user = JSON.parse(localStorage.getItem('agri_current_user'));
  if (!user) { renderLogin(); return; }

  let formHtml = '';
  if (user.role === 'Farmer') {
    formHtml = `
      <form id="role-form">
        <label>Crop Name:
          <input type="text" name="cropName" value="${user.data?.cropName || ''}" required />
        </label>
        <label>Weight of Crop (kg):
          <input type="number" name="weight" min="0" step="0.01" value="${user.data?.weight || ''}" required />
        </label>
        <label>Date Given to Wholesaler:
          <input type="date" name="dateGiven" value="${user.data?.dateGiven || ''}" required />
        </label>
        <label>Condition of Crop When Given:
          <input type="text" name="condition" value="${user.data?.condition || ''}" required />
        </label>
        <label>Price of Crop Given to Wholesaler:
          <input type="number" name="price" min="0" step="0.01" value="${user.data?.price || ''}" required />
        </label>
        <button type="submit">Update Details</button>
      </form>`;
  } else if (user.role === 'Wholesaler') {
    formHtml = `
      <form id="role-form">
        <label>Date of Crop Bought from Farmer:
          <input type="date" name="dateBought" value="${user.data?.dateBought || ''}" required />
        </label>
        <label>Date Sold to Retailer:
          <input type="date" name="dateSold" value="${user.data?.dateSold || ''}" required />
        </label>
        <label>Selling Price to Retailer:
          <input type="number" name="sellingPrice" min="0" step="0.01" value="${user.data?.sellingPrice || ''}" required />
        </label>
        <label>Transport Cost:
          <input type="number" name="transportCost" min="0" step="0.01" value="${user.data?.transportCost || ''}" required />
        </label>
        <label>Condition of Vegetable When Bought:
          <input type="text" name="condition" value="${user.data?.condition || ''}" required />
        </label>
        <button type="submit">Update Details</button>
      </form>`;
  } else {
    formHtml = `
      <form id="role-form">
        <label>Buying Price from Wholesaler:
          <input type="number" name="buyingPrice" value="${user.data?.buyingPrice || ''}" required />
        </label>
        <label>Condition of Crops When Received:
          <input type="text" name="condition" value="${user.data?.condition || ''}" required />
        </label>
        <label>Amount of Crops Bought (kg):
          <input type="number" name="amountBought" value="${user.data?.amountBought || ''}" required />
        </label>
        <label>Retail Price to Consumer:
          <input type="number" name="retailPrice" value="${user.data?.retailPrice || ''}" required />
        </label>
        <button type="submit">Update Details</button>
      </form>`;
  }

  app.innerHTML = `
    <h2>${user.role} Dashboard</h2>
    <button id="logout-btn" class="logout-btn">Logout</button>
    <button id="view-all-btn" class="link-button" style="margin-left:1rem;">View All Users</button>
    ${formHtml}
    <p><strong>Your User ID:</strong> ${user.id}</p>
    <p id="update-msg" style="color:green; display:none;">Details updated successfully!</p>
  `;

  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('agri_current_user');
    renderLogin();
  });
  document.getElementById('view-all-btn').addEventListener('click', renderAllUsers);

  const roleForm = document.getElementById('role-form');
  if (roleForm) {
    roleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(roleForm);
      const updatedData = {};
      for (const [k,v] of formData.entries()) updatedData[k] = v.trim();
      await updateUserData(user.id, updatedData);
    });
  }
}

// Handle signup request to backend
async function handleSignup() {
  const role = document.getElementById('signup-role').value;
  const username = document.getElementById('signup-username').value.trim();
  const password = document.getElementById('signup-password').value;
  const mobile = document.getElementById('signup-mobile').value.trim();
  const errorEl = document.getElementById('signup-error');

  if (!/^\d{10}$/.test(mobile)) {
    errorEl.textContent = 'Mobile must be 10 digits.';
    errorEl.style.display = 'block';
    return;
  }

  const res = await fetch(`${API_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ role, username, password, mobile })
  });
  const result = await res.json();
  if (!res.ok) {
    errorEl.textContent = result.error || 'Signup failed';
    errorEl.style.display = 'block';
    return;
  }
  // Pre-fill login form with newly created username and role
  setTimeout(()=>{
    document.getElementById('login-role').value = role;
    document.getElementById('login-username').value = username;
    document.getElementById('login-password').value = password;
    renderLogin();
  }, 100);

}

// Handle login request to backend
async function handleLogin() {
  const role = document.getElementById('login-role').value;
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ role, username, password })
  });
  const result = await res.json();
  if (!res.ok) {
    errorEl.textContent = result.error || 'Login failed';
    errorEl.style.display = 'block';
    return;
  }
  localStorage.setItem('agri_current_user', JSON.stringify(result));
  renderDashboard();
}

// Update user data on server
async function updateUserData(id, data) {
  const res = await fetch(`${API_URL}/update`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ id, data })
  });
  if (res.ok) {
    const msg = document.getElementById('update-msg');
    if (msg) {
      msg.style.display = 'block';
      setTimeout(()=> msg.style.display='none', 3000);
    }
    // refresh current stored user
    const cur = JSON.parse(localStorage.getItem('agri_current_user'));
    cur.data = data;
    localStorage.setItem('agri_current_user', JSON.stringify(cur));
  } else {
    alert('Update failed');
  }
}

// Render all users table (clear view)
async function renderAllUsers() {
  const res = await fetch(`${API_URL}/users`);
  if (!res.ok) {
    alert('Failed to fetch users');
    return;
  }
  const users = await res.json();
  let html = `
    <h2>All User Details</h2>
    <button onclick="renderLogin()">Back</button>
    <a href="${API_URL}/download" target="_blank"><button style="margin-left:1rem;">Download Excel</button></a>
    <div class="table-container">
      <table class="user-table">
        <thead>
          <tr><th>User ID</th><th>Role</th><th>Username</th><th>Mobile</th><th>Data</th></tr>
        </thead>
        <tbody>`;
  users.forEach(u => {
    const prettyData = u.data && typeof u.data === 'object' ? JSON.stringify(u.data) : (u.data || 'No data');
    html += `<tr>
      <td>${u.id}</td>
      <td>${u.role}</td>
      <td>${u.username}</td>
      <td>${u.mobile}</td>
      <td style="max-width:300px; word-wrap:break-word;">${prettyData}</td>
    </tr>`;
  });
  html += `</tbody></table></div>`;
  app.innerHTML = html;
}

// Render Host Login form
function renderHostLogin() {
  app.innerHTML = `
    <h2>Host Login</h2>
    <form id="host-form">
      <label>Username:
        <input type="text" id="host-username" required />
      </label>
      <label>Password:
        <input type="password" id="host-password" required />
      </label>
      <p class="error" id="host-error" style="display:none;"></p>
      <button type="submit">Login as Host</button>
    </form>
    <p><button class="link-button" id="back-to-login">Back</button></p>
  `;
  document.getElementById('host-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleHostLogin();
  });
  document.getElementById('back-to-login').addEventListener('click', renderLogin);
}

// Handle host login
async function handleHostLogin() {
  const username = document.getElementById('host-username').value.trim();
  const password = document.getElementById('host-password').value;
  const errorEl = document.getElementById('host-error');
  const res = await fetch(`${API_URL}/host_login`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (res.status === 200) {
    // show host dashboard
    renderHostDashboard();
  } else {
    const result = await res.json();
    errorEl.textContent = result.error || 'Invalid host credentials';
    errorEl.style.display = 'block';
  }
}

// Render host dashboard with export
async function renderHostDashboard() {
  const res = await fetch(`${API_URL}/users`);
  const users = await res.json();
  let html = `<h2>Host Dashboard</h2><p><button id="export-xlsx">Download Excel</button> <button id="host-logout">Logout</button></p>`;
  html += `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Role</th><th>Username</th><th>Mobile</th><th>Data</th><th>Last Updated (UTC)</th></tr></thead><tbody>`;
  users.forEach(u => {
    const pretty = JSON.stringify(u.data || {}, null, 2).replace(/\\n/g,'<br>').replace(/ /g,'&nbsp;');
    html += `<tr>
      <td>${u.id}</td>
      <td>${u.role}</td>
      <td>${u.username}</td>
      <td>${u.mobile}</td>
      <td style="max-width:300px; word-wrap:break-word;">${pretty}</td>
      <td>${u.updated_at || ''}</td>
    </tr>`;
  });
  html += `</tbody></table></div>`;
  app.innerHTML = html;
  document.getElementById('export-xlsx').addEventListener('click', () => exportUsersToExcel(users));
  document.getElementById('host-logout').addEventListener('click', renderLogin);
}

// Export users array to Excel using SheetJS
function exportUsersToExcel(users) {
  const wb = XLSX.utils.book_new();
  const rows = users.map(u => ({
    id: u.id,
    role: u.role,
    username: u.username,
    mobile: u.mobile,
    data: JSON.stringify(u.data || {}),
    updated_at: u.updated_at || ''
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'users');
  XLSX.writeFile(wb, 'users.xlsx');
}

// On load
(function init(){
  const currentUser = JSON.parse(localStorage.getItem('agri_current_user'));
  if (currentUser) renderDashboard();
  else renderLogin();
})();
