// ------------------------------------
// Toast helper
function showToast(message, success = true) {
  let t = document.createElement('div');
  t.className = 'snackbar';
  t.style.background = success
    ? 'linear-gradient(90deg,#29a746,#1da5b9 85%)'
    : 'linear-gradient(95deg,#d83c2b,#ee9c63 85%)';
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; }, 2200);
  setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 2600);
}

// Storage keys
const USERS_KEY = 'semleads_users',
      LEADS_KEY = 'semleads_leads',
      SESSION_KEY = 'semleads_user';

let currentUser = null,
    leads = [],
    addFollowupForIdx = null;

// Get/set users from localStorage
function getUserList() {
  let u = JSON.parse(localStorage.getItem(USERS_KEY) || 'null');
  if (!u) {
    u = [
      { username: 'shikha', password: 'shikha@123' },
      { username: 'tripti', password: 'tripti@123' },
      { username: 'anshi', password: 'anshi@123' },
      { username: 'SEM', password: 'sem@ops123' },
      { username: 'sushant', password: 'sush@123' },
      { username: 'gaurav', password: 'gaurav@123' },
      { username: 'yash', password: 'yash@123' },
      { username: 'developer', password: 'dev041228' },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(u));
  }
  return u;
}
function setUserList(arr) {
  localStorage.setItem(USERS_KEY, JSON.stringify(arr));
}

// Get/set leads from localStorage
function getStoredLeads() {
  let arr = JSON.parse(localStorage.getItem(LEADS_KEY) || '[]');
  arr.forEach((lead) => {
    if (!lead.followups) lead.followups = [];
  });
  window.leads = arr;
  return arr;
}
function saveLeads() {
  localStorage.setItem(LEADS_KEY, JSON.stringify(window.leads || []));
}

// Utility - check developer login
function isDeveloper() {
  return currentUser === 'developer';
}

// --- LOGIN FLOW ---
function loginCheck(username, password) {
  let list = getUserList();
  return list.find(
    (u) =>
      u.username.trim().toLowerCase() === username.toLowerCase() && u.password === password
  );
}
function showError(msg) {
  document.getElementById('error').textContent = msg;
}

document.getElementById('loginUser').oninput = document.getElementById('loginPass').oninput = function () {
  document.getElementById('error').textContent = '';
};
document.getElementById('loginForm').onsubmit = function (e) {
  e.preventDefault();
  let user = document.getElementById('loginUser').value.trim(),
      pass = document.getElementById('loginPass').value;
  let res = loginCheck(user, pass);
  if (!res) return showError('Invalid username or password.');
  localStorage.setItem(SESSION_KEY, user);
  currentUser = user;
  if (isDeveloper()) {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('superAdminPanel').style.display = '';
    document.getElementById('devUsername').textContent = currentUser;
    window.superadmin = new SuperAdmin();
    return;
  }
  showDashboard();
};

function logout() {
  localStorage.removeItem(SESSION_KEY);
  location.reload();
}

// Render Tabs and Dashboard content
function setTabActive(tabId) {
  const tabBtns = {
    tabAdmin: document.getElementById('tabAdmin'),
    tabDashboard: document.getElementById('tabDashboard'),
    tabAllLeads: document.getElementById('tabAllLeads'),
  };
  for (const k in tabBtns) if (tabBtns[k]) tabBtns[k].classList.remove('active');
  if (tabBtns[tabId]) tabBtns[tabId].classList.add('active');
}

// Show Dashboard main UI for logged user
function showDashboard() {
  document.getElementById('welcome-popup').textContent = `Welcome, ${currentUser}!`;
  document.getElementById('welcome-popup').style.display = 'block';
  setTimeout(() => {
    document.getElementById('welcome-popup').style.display = 'none';
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('superAdminPanel').style.display = 'none';
    document.getElementById('dashboard').style.display = '';
    document.getElementById('userNameDash').textContent = currentUser;
    leads = getStoredLeads();
    renderUserTabs();
    renderTabContent('dashboard');
  }, 900);
}

// Render User Tabs at top depending on user role
function renderUserTabs() {
  const userTabs = document.getElementById('user-tabs');
  userTabs.innerHTML = '';

  // SEM sees all users as tabs
  let userList = getUserList().map(u => u.username);
  if (currentUser.toLowerCase() !== 'sem') {
    // Only current user tab if not SEM
    userList = [currentUser];
  }
  userList.forEach(user => {
    let btn = document.createElement('button');
    btn.textContent = user;
    btn.className = 'glass-tab-btn' + (user === currentUser ? ' active' : '');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', user === currentUser ? 'true' : 'false');
    btn.onclick = () => {
      currentUser = user;
      document.getElementById('userNameDash').textContent = user;
      renderTabContent('dashboard');
      document.querySelectorAll('#user-tabs button').forEach(b => {
        b.classList.toggle('active', b.textContent === user);
        b.setAttribute('aria-selected', b.textContent === user ? 'true' : 'false');
      });
    };
    userTabs.appendChild(btn);
  });
}

// Render the main tab content area
function renderTabContent(panelName) {
  const container = document.getElementById('tab-content-panels');
  container.innerHTML = '';

  if (panelName === 'dashboard') {
    container.appendChild(createAddLeadPanel());
    container.appendChild(createTodaysFollowupsPanel());
  }
}

function createAddLeadPanel() {
  const panel = document.createElement('section');
  panel.className = 'glass-panel';
  panel.setAttribute('aria-label', 'Add New Lead');

  const h2 = document.createElement('h2');
  h2.textContent = 'Add New Lead';
  h2.className = 'tab-section-title';
  panel.appendChild(h2);

  const form = document.createElement('form');
  form.id = 'leadForm';
  form.autocomplete = 'off';

  const fields = [
    { label: 'Event Name', id: 'leadEventName', type: 'text', required: true },
    { label: 'Email', id: 'leadEmail', type: 'email', required: true },
    { label: 'Phone', id: 'leadPhone', type: 'text', required: true },
    { label: 'Designation', id: 'leadDesignation', type: 'text', required: true },
    { label: 'Organising Society', id: 'leadOrgSociety', type: 'text', required: true },
  ];
  fields.forEach(({ label, id, type, required }) => {
    const lbl = document.createElement('label');
    lbl.setAttribute('for', id);
    lbl.textContent = label;
    form.appendChild(lbl);

    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.name = id;
    if (required) input.required = true;
    form.appendChild(input);
  });

  // Category select
  const labelCategory = document.createElement('label');
  labelCategory.setAttribute('for', 'leadCategory');
  labelCategory.textContent = 'Category';
  form.appendChild(labelCategory);

  const selectCategory = document.createElement('select');
  selectCategory.id = 'leadCategory';
  selectCategory.name = 'leadCategory';
  selectCategory.required = true;

  ['', 'Hot', 'Warm', 'Cold', 'NI', 'NRE'].forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat || 'Select';
    selectCategory.appendChild(option);
  });
  form.appendChild(selectCategory);

  // Remarks textarea
  const labelRemarks = document.createElement('label');
  labelRemarks.setAttribute('for', 'leadRemarks');
  labelRemarks.textContent = 'Remarks';
  form.appendChild(labelRemarks);

  const textareaRemarks = document.createElement('textarea');
  textareaRemarks.id = 'leadRemarks';
  textareaRemarks.name = 'leadRemarks';
  textareaRemarks.rows = 2;
  form.appendChild(textareaRemarks);

  // Submit button
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Add Lead';
  form.appendChild(submitBtn);

  form.onsubmit = leadFormSubmitHandler;

  panel.appendChild(form);
  return panel;
}

// Handler for Add Lead form submit
function leadFormSubmitHandler(e) {
  e.preventDefault();
  const form = e.target;

  const eventName = form.leadEventName.value.trim();
  const email = form.leadEmail.value.trim();
  const phone = form.leadPhone.value.trim();
  const designation = form.leadDesignation.value.trim();
  const society = form.leadOrgSociety.value.trim();
  const category = form.leadCategory.value;
  const remarks = form.leadRemarks.value.trim();

  if (!eventName || !email || !designation || !society || !phone || !category) {
    showToast('Please fill all the fields!', false);
    return;
  }

  // Email and phone validation
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    showToast('Invalid email', false);
    return;
  }
  if (!/^\d{8,}$/.test(phone)) {
    showToast('Enter valid phone number', false);
    return;
  }
  if (leads.some(l => l.email.trim().toLowerCase() === email.toLowerCase())) {
    showToast('Email already exists!', false);
    return;
  }

  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // ms
  const addedOnIST = new Date(now.getTime() + istOffset - now.getTimezoneOffset() * 60000);
  const newLead = {
    eventName,
    email,
    phone,
    designation,
    organisingSociety: society,
    category,
    remarks,
    addedBy: currentUser,
    addedOn: addedOnIST.toISOString(),
    followups: [],
  };
  leads.push(newLead);
  saveLeads();
  showToast('Lead added!');
  form.reset();
  renderTabContent('dashboard');
  renderTodayFollowups();
}

function createTodaysFollowupsPanel() {
  const panel = document.createElement('section');
  panel.className = 'glass-panel';
  panel.setAttribute('aria-label', "Today's Follow-ups");
  panel.style.color = '#1d3e60';

  const h2 = document.createElement('h2');
  h2.textContent = "Today's Follow-ups";
  h2.className = 'tab-section-title';
  panel.appendChild(h2);

  const container = document.createElement('div');
  container.id = 'calendar-list';
  panel.appendChild(container);

  renderTodayFollowups(container);

  return panel;
}

function renderTodayFollowups(container) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = now.getMonth();
  const dd = now.getDate();
  const todayStart = new Date(yyyy, mm, dd, 0, 0, 0).getTime();
  const todayEnd = new Date(yyyy, mm, dd, 23, 59, 59).getTime();

  container.innerHTML = '';
  let html = '';

  leads.forEach((lead, i) => {
    lead.followups.forEach((f, idx) => {
      const ts = new Date(f.datetime).getTime();
      if (ts >= todayStart && ts <= todayEnd) {
        html += `<div class="flex" style="align-items:center;margin-bottom:7px;">
          <span class="tag ${lead.category.split(' ')[0]}" style="min-width:40px;">${lead.category}</span>
          <b style="color:#0791c4;">${lead.eventName}</b>
          <span style="margin-left:8px;">${new Date(f.datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          <span style="margin-left:10px;">${f.remark}</span>
          <span style="color:${f.done ? '#26b361' : '#d0021b'};font-size:.98em; margin-left:10px;">[${f.done ? 'Done' : 'Pending'}]</span>
          <button type="button" onclick="markFollowupDone(${i},${idx})" style="margin-left:14px; font-size:13px;">Mark Done</button>
        </div>`;
      }
    });
  });

  container.innerHTML = html || '<em>No follow-ups scheduled for today.</em>';
}

// Mark a follow-up as 'done'
window.markFollowupDone = (leadIdx, fIdx) => {
  if (leads[leadIdx].followups[fIdx].done) return showToast('Already marked done.', false);
  if (!confirm('Mark this follow-up as done?')) return;
  leads[leadIdx].followups[fIdx].done = true;
  saveLeads();
  renderTodayFollowups(document.getElementById('calendar-list'));
  showToast('Marked done.', true);
};

// --- SUPER ADMIN PANEL CLASS and related methods ---

class SuperAdmin {
  constructor() {
    this.userTabsElem = document.getElementById('superTabs');
    this.superBody = document.getElementById('superPanelBody');
    this.data = {
      users: getUserList(),
      target: 'developer', // default managed user
    };
    this.renderTabs();
  }
  renderTabs() {
    this.data.users = getUserList();
    this.userTabsElem.innerHTML = '';
    this.data.users.forEach((u) => {
      let btn = document.createElement('button');
      btn.textContent = u.username;
      btn.className = u.username === this.data.target ? 'glass-tab-btn active' : 'glass-tab-btn';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', u.username === this.data.target ? 'true' : 'false');
      btn.onclick = () => {
        this.data.target = u.username;
        this.renderTabs();
        this.renderPanel();
      };
      this.userTabsElem.appendChild(btn);
    });
    this.renderPanel();
  }
  renderPanel() {
    let ulist = getUserList(),
        targetUser = ulist.find((u) => u.username === this.data.target);
    let readonly = targetUser.username === 'developer' ? 'readonly' : '';
    let msgBox = `<input id="msgToUser" class="msg-input" placeholder="Send message to this user..."><button onclick="superadmin.sendMessage('${targetUser.username}')">Send</button>`;
    this.superBody.innerHTML = `
      <div class="userbox" style="margin-bottom:20px; color:#154a75;">
        <b>User Profile: <span style="color:#0373d6;">${targetUser.username}</span></b>
        <form onsubmit="superadmin.editUser(event)">
          <label>Username: <input name="username" value="${targetUser.username}" ${readonly} required></label>
          <label>Password: <input name="password" value="${targetUser.password}" required></label>
          <button type="submit">Save</button>
          ${
            targetUser.username !== 'developer'
            ? `<button type="button" onclick="superadmin.deleteUser('${targetUser.username}')" style="margin-left:12px; background:#ea6153; color:#fff;">Delete User</button>`
            : ''
          }
        </form>
        <br>
        <div>
          <button onclick="superadmin.renderMessages('${targetUser.username}')">Show Messages</button>
          ${msgBox}
        </div>
        <div id="superMsgInbox" style="margin-top:10px;"></div>
      </div>
      <div class="leadsbox" style="color:#154a75;">
        <b>Leads owned by this user:</b>
        <button onclick="superadmin.addLead('${targetUser.username}')" style="margin-left: 13px;">+ Add Lead</button>
        <div id="superLeadsList" style="margin-top:12px;"></div>
      </div>
    `;
    this.renderLeads(targetUser.username);
    this.renderMessages(targetUser.username);
    this.buildUserTable();
  }
  buildUserTable() {
    let ulist = getUserList();
    let html = `<table class="user-list-table" style="width:100%;border:1px solid #58a0f666;border-collapse:collapse;">
      <thead><tr><th style="background:#1973ebcc; color:#f5faff; padding:8px 14px;">User</th><th style="background:#1973ebcc; color:#f5faff; padding:8px 14px;">Password</th><th style="background:#1973ebcc; color:#f5faff; padding:8px 14px;">Actions</th></tr></thead><tbody>`;
    ulist.forEach((u) => {
      html += `<tr>
        <td style="padding:6px 10px;">${u.username}</td>
        <td style="padding:6px 10px;">${u.password}</td>
        <td style="padding:6px 10px;">${
          u.username !== 'developer'
            ? `<button style="background:#ea6153; color:#fff; border:none; padding:6px 12px; border-radius:7px; cursor:pointer;" onclick="superadmin.deleteUser('${u.username}')">Delete</button>`
            : ''
        }</td>
      </tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('userManageTable').innerHTML = html;
  }
  editUser(e) {
    e.preventDefault();
    let uname = this.data.target,
        users = getUserList();
    let idx = users.findIndex((u) => u.username === uname);
    if (idx < 0) return showToast('User not found!', false);
    let newName = e.target.username.value.trim();
    let newPass = e.target.password.value.trim();
    if (!newName || !newPass) return showToast('Fields required', false);
    if (newName !== uname && users.some((u) => u.username === newName)) return showToast('Username taken', false);

    // Change username on leads
    let leads = getStoredLeads();
    leads.forEach((l) => {
      if (l.addedBy === uname) l.addedBy = newName;
    });
    saveLeads();
    users[idx].username = newName;
    users[idx].password = newPass;
    setUserList(users);
    showToast('Saved!', true);

    if (currentUser === uname) {
      currentUser = newName;
      localStorage.setItem(SESSION_KEY, newName);
      document.getElementById('userNameDash').textContent = newName;
      document.getElementById('user-tabs').querySelectorAll('button').forEach(b => {
        b.classList.toggle('active', b.textContent === newName);
      });
    }
    this.data.target = newName;
    this.renderTabs();
  }
  deleteUser(uname) {
    if (!confirm(`Delete user ${uname} and their leads?`)) return;
    let users = getUserList().filter((u) => u.username !== uname),
        leads = getStoredLeads().filter((l) => l.email && l.addedBy !== uname);
    setUserList(users);
    window.leads = leads;
    saveLeads();
    if (currentUser === uname) {
      logout();
      return;
    }
    if (this.data.target === uname) this.data.target = 'developer';
    this.renderTabs();
  }
  showUserAddBox() {
    this.superBody.innerHTML = `
      <form onsubmit="superadmin.addUser(event)" aria-label="Add new user form">
        <b>Add new user:</b><br><br>
        <label>Username:<input name="username" required></label>
        <label>Password:<input name="password" required type="password"></label>
        <button type="submit">Add User</button>
      </form>
    `;
  }
  addUser(e) {
    e.preventDefault();
    let users = getUserList();
    let uname = e.target.username.value.trim(),
        pass = e.target.password.value.trim();
    if (!uname || !pass) return showToast('Fields are required', false);
    if (users.some((u) => u.username === uname)) return showToast('Username exists', false);
    users.push({ username: uname, password: pass });
    setUserList(users);
    showToast('User added!', true);
    this.data.target = uname;
    this.renderTabs();
  }
  sendMessage(uname) {
    let val = document.getElementById('msgToUser').value.trim();
    if (!val) return showToast('Empty message', false);
    let k = 'semleads_inbox_' + uname,
        inbox = JSON.parse(localStorage.getItem(k) || '[]');
    inbox.push({ from: 'developer', text: val, dt: new Date().toLocaleString() });
    localStorage.setItem(k, JSON.stringify(inbox));
    showToast('Message sent', true);
    this.renderMessages(uname);
    document.getElementById('msgToUser').value = '';
  }
  renderMessages(uname) {
    let k = 'semleads_inbox_' + uname,
        inbox = JSON.parse(localStorage.getItem(k) || '[]');
    document.getElementById('superMsgInbox').innerHTML =
      '<b>Inbox for ' + uname + ':</b><br>' +
      (inbox.length === 0
        ? `<em>No messages</em>`
        : inbox
            .slice()
            .reverse()
            .map(m =>
              `<div style="background:#f4fbff; margin:5px 0 3px 0; padding:6px 9px; border-radius:6px; color:#0373d6; line-height:1.3;">
                <b>${m.from}:</b> ${m.text}<br><small style="color:#555;">${m.dt}</small>
              </div>`
            )
            .join('')
      );
  }
  renderLeads(user) {
    let leads = getStoredLeads().filter((l) => l.addedBy === user);
    let html = '';
    leads.forEach((l) => {
      let id = 'superLeadsFup_' + l.email.replace(/[^a-z0-9]/gi, '');
      html += `
      <div style="background:#f4fbff; padding:14px 14px 10px 14px; margin-bottom:14px; border-radius:20px; box-shadow:0 1px 8px #a1cdf856; color:#034470;">
        <b>${l.eventName || '[No Event]'}</b>
        <button style="margin-left:12px; background:#f75c5c; color:#fff; border:none; border-radius:9px; padding:4px 12px; cursor:pointer;" onclick="superadmin.deleteLead('${l.email}')" aria-label="Delete lead ${l.eventName}">Delete</button>
        <button style="margin-left:8px; background:#2389fe; color:#fff; border:none; border-radius:9px; padding:4px 12px; cursor:pointer;" onclick="superadmin.editLead('${l.email}')" aria-label="Edit lead ${l.eventName}">Edit</button>
        <br><br>
        Email: ${l.email} <br>
        Phone: ${l.phone} <br>
        Designation: ${l.designation} <br>
        Society: ${l.organisingSociety} <br>
        Category: <span class="tag ${l.category.split(' ')[0]}">${l.category}</span> <br>
        Remarks: ${l.remarks || '-'} <br>
        <form onsubmit="return superadmin.setLeadDate('${l.email}', this)" style="margin-top:8px; user-select:none;">
          Date Added: <input type="datetime-local" name="dt" value="${l.addedOn ? l.addedOn.substring(0,16) : ''}" style="border-radius:8px; padding:4px 10px; border: 1.5px solid #a1cdf8;" />
          <button type="submit" style="font-size: 0.9rem;">Set</button>
        </form>
        <div style="margin-top:12px;">
          Follow-ups:
          <button onclick="superadmin.showFupAddBox('${l.email}')" style="margin-left:10px; font-size:0.9rem; padding:4px 11px; border-radius:8px; background:#38aacc; color:#fff; border:none; cursor:pointer;">Add Follow-up</button>
        </div>
        <div id="${id}" style="margin-top:10px;"></div>
      </div>
      `;
      // Delay rendering followups to not block UI
      setTimeout(() => superadmin.renderFollowups(l.email), 0);
    });
    document.getElementById('superLeadsList').innerHTML = html;
  }
  addLead(addedBy) {
    this.superBody.querySelector('#superLeadsList').innerHTML =
      `<form onsubmit="return superadmin.saveNewLead(event, '${addedBy}')" style="margin-bottom:18px; color:#154a75;">
        <b>Add new lead for ${addedBy}:</b><br>
        <label>Event Name:<input name="eventName" required></label>
        <label>Email:<input name="email" required type="email"></label>
        <label>Phone:<input name="phone" required></label>
        <label>Designation:<input name="designation" required></label>
        <label>Society:<input name="organisingSociety" required></label>
        <label>Category:<select name="category" required>
          <option>Hot</option><option>Warm</option><option>Cold</option><option>NI</option><option>NRE</option>
        </select></label>
        <label>Remarks:<input name="remarks"></label>
        <button type="submit">Add</button>
      </form>` + this.superBody.querySelector('#superLeadsList').innerHTML;
  }
  saveNewLead(e, user) {
    e.preventDefault();
    let f = e.target;
    let l = {
      eventName: f.eventName.value.trim(),
      email: f.email.value.trim(),
      phone: f.phone.value.trim(),
      designation: f.designation.value.trim(),
      organisingSociety: f.organisingSociety.value.trim(),
      category: f.category.value,
      remarks: f.remarks.value.trim(),
      followups: [],
      addedBy: user,
      addedOn: new Date().toISOString(),
    };
    if (getStoredLeads().some(a => a.email === l.email)) return showToast('Email already exists!', false);
    if (!l.email || !l.eventName) {
      showToast('Event Name and Email required', false);
      return false;
    }
    window.leads = getStoredLeads();
    window.leads.push(l);
    saveLeads();
    showToast('Added!', true);
    this.renderLeads(user);
    return false;
  }
  deleteLead(email) {
    if (!confirm('Delete this lead?')) return;
    window.leads = getStoredLeads().filter(l => l.email !== email);
    saveLeads();
    this.renderLeads(this.data.target);
  }
  editLead(email) {
    let leads = getStoredLeads();
    let idx = leads.findIndex(l => l.email === email);
    if (idx < 0) return;
    let l = leads[idx];
    let f = `<form onsubmit="return superadmin.saveEditLead(event, '${email}')" style="margin-bottom:18px; color:#154a75;">
      <b>Edit Lead</b><br>
      <label>Event Name:<input name="eventName" value="${l.eventName}" required></label>
      <label>Email:<input name="email" value="${l.email}" type="email" required></label>
      <label>Phone:<input name="phone" value="${l.phone}" required></label>
      <label>Designation:<input name="designation" value="${l.designation}" required></label>
      <label>Society:<input name="organisingSociety" value="${l.organisingSociety}" required></label>
      <label>Category:
        <select name="category" required>
          <option${l.category==='Hot'?' selected':''}>Hot</option>
          <option${l.category==='Warm'?' selected':''}>Warm</option>
          <option${l.category==='Cold'?' selected':''}>Cold</option>
          <option${l.category==='NI'?' selected':''}>NI</option>
          <option${l.category==='NRE'?' selected':''}>NRE</option>
        </select>
      </label>
      <label>Remarks:<input name="remarks" value="${l.remarks || ''}"></label>
      <button type="submit">Save</button>
    </form>`;
    this.superBody.querySelector('#superLeadsList').innerHTML = f + this.superBody.querySelector('#superLeadsList').innerHTML;
  }
  saveEditLead(e, email) {
    e.preventDefault();
    let leads = getStoredLeads();
    let idx = leads.findIndex(l => l.email === email);
    if (idx < 0) return showToast('Lead not found', false);
    let f = e.target;
    leads[idx].eventName = f.eventName.value.trim();
    leads[idx].email = f.email.value.trim();
    leads[idx].phone = f.phone.value.trim();
    leads[idx].designation = f.designation.value.trim();
    leads[idx].organisingSociety = f.organisingSociety.value.trim();
    leads[idx].category = f.category.value;
    leads[idx].remarks = f.remarks.value.trim();
    window.leads = leads;
    saveLeads();
    showToast('Saved');
    setTimeout(() => this.renderLeads(this.data.target), 300);
    return false;
  }
  setLeadDate(email, form) {
    let leads = getStoredLeads(),
        idx = leads.findIndex(l => l.email === email);
    if (idx < 0) return false;
    leads[idx].addedOn = form.dt.value;
    window.leads = leads;
    saveLeads();
    showToast('Date Updated!');
    setTimeout(() => this.renderLeads(this.data.target), 120);
    return false;
  }
  renderFollowups(email) {
    let leads = getStoredLeads(),
        lead = leads.find(l => l.email === email);
    if (!lead) return;
    let id = 'superLeadsFup_' + email.replace(/[^a-z0-9]/gi, '');
    let html = '';
    lead.followups.forEach((f, i) => {
      html += `<div style="padding:4px 8px; margin:3px 0; border-radius:12px; background:#d3eafa44; color:#01497c;">
      [${f.done ? 'Done' : 'Pending'}] ${new Date(f.datetime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}:
      <b style="margin-left:8px;">${f.remark}</b>
      <button onclick="superadmin.toggleFup('${email}',${i})" style="margin-left:12px; font-size:0.9rem;">Toggle Done</button>
      <button onclick="superadmin.deleteFup('${email}',${i})" style="margin-left:9px; font-size:0.9rem; background:#ee6767; color:white;">Delete</button>
      </div>`;
    });
    html += `<form onsubmit="return superadmin.addFupQuick(event, '${email}')" style="margin-top:10px; color:#154a75;">
      Add Followup:
      <input name="date" type="datetime-local" required style="width:40%; margin-right:6px;">
      <input name="remark" placeholder="Remark" required style="width:50%; margin-right:6px;">
      <button type="submit">Add</button>
    </form>`;
    document.getElementById(id).innerHTML = html;
  }
  showFupAddBox(email) {
    let id = 'superLeadsFup_' + email.replace(/[^a-z0-9]/gi, '');
    let container = document.getElementById(id);
    if (!container) return;
    let input = container.querySelector('input[name="date"]');
    if (input) input.focus();
  }
  addFupQuick(e, email) {
    e.preventDefault();
    let dt = e.target.date.value,
        r = e.target.remark.value.trim();
    if (!dt || !r) return showToast('Enter both date and remark', false);
    let leads = getStoredLeads(),
        idx = leads.findIndex(l => l.email === email);
    leads[idx].followups.push({ datetime: dt, remark: r, done: false });
    window.leads = leads;
    saveLeads();
    showToast('Follow-up added!');
    this.renderFollowups(email);
    return false;
  }
  toggleFup(email, i) {
    let leads = getStoredLeads(),
        idx = leads.findIndex(l => l.email === email);
    if (idx < 0) return;
    leads[idx].followups[i].done = !leads[idx].followups[i].done;
    window.leads = leads;
    saveLeads();
    this.renderFollowups(email);
  }
  deleteFup(email, i) {
    let leads = getStoredLeads(),
        idx = leads.findIndex(l => l.email === email);
    if (idx < 0) return;
    leads[idx].followups.splice(i, 1);
    window.leads = leads;
    saveLeads();
    this.renderFollowups(email);
  }
}
window.superadmin = null;

// Terms & Conditions modal logic
const termsModalBg = document.getElementById('termsModalBg');
const termsModal = document.getElementById('termsModal');
const showTermsLink = document.getElementById('showTermsLink');
const closeTermsBtn = document.getElementById('closeTermsBtn');

function openTermsModal() {
  termsModalBg.classList.add('open');
  termsModal.classList.add('open');
  termsModal.setAttribute('aria-hidden', 'false');
  termsModal.focus();
}
function closeTermsModal() {
  termsModalBg.classList.remove('open');
  termsModal.classList.remove('open');
  termsModal.setAttribute('aria-hidden', 'true');
}
showTermsLink.addEventListener('click', (e) => {
  e.preventDefault();
  openTermsModal();
});
closeTermsBtn.addEventListener('click', (e) => {
  e.preventDefault();
  closeTermsModal();
});
termsModalBg.addEventListener('click', (e) => {
  closeTermsModal();
});

// Follow-up modal logic
const modalBg = document.getElementById('modalBg');
const followupModal = document.getElementById('followupModal');

window.openFollowupModal = function (idx) {
  addFollowupForIdx = idx;
  document.getElementById('fLeadName').textContent = leads[idx].eventName;
  document.getElementById('followupDate').value = '';
  document.getElementById('followupRemark').value = '';
  modalBg.classList.add('open');
  followupModal.classList.add('open');
  followupModal.setAttribute('aria-hidden', 'false');
  followupModal.focus();
};
window.closeFollowupModal = function () {
  modalBg.classList.remove('open');
  followupModal.classList.remove('open');
  followupModal.setAttribute('aria-hidden', 'true');
};
document.getElementById('modalBg').onclick = window.closeFollowupModal;

document.getElementById('followupForm').onsubmit = function (e) {
  e.preventDefault();
  let dt = document.getElementById('followupDate').value,
      remark = document.getElementById('followupRemark').value.trim();
  if (!dt) return showToast('Date and time required!', false);
  if (!remark) return showToast('Please enter remark!', false);
  leads[addFollowupForIdx].followups.push({ datetime: dt, remark: remark, done: false });
  saveLeads();
  closeFollowupModal();
  renderTodayFollowups(document.getElementById('calendar-list'));
  showToast('Follow-up added!');
};

// On page load
window.onload = function () {
  currentUser = localStorage.getItem(SESSION_KEY);
  leads = getStoredLeads();
  if (currentUser === 'developer') {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('superAdminPanel').style.display = '';
    document.getElementById('devUsername').textContent = currentUser;
    window.superadmin = new SuperAdmin();
    return;
  }
  if (currentUser) {
    showDashboard();
  }
};
