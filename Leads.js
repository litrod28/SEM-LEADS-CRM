// --- Toast ---
function showToast(message, success = true) {
  let t = document.createElement('div');
  t.className = 'snackbar glassy-toast';
  t.textContent = message;
  t.style.animation = 'toastIn .65s cubic-bezier(.3,1.3,.38,.99), toastOut .5s 2.3s forwards';
  document.body.appendChild(t);
  setTimeout(() => {
    t.remove();
  }, 2900);
}

// --- Utility
function isDeveloper() {
  return currentUser === 'developer';
}

//--- User/Lead Mgmt in Storage ---
const USERS_KEY = 'semleads_users';
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

// --------- DEVELOPER SUPER ADMIN PANEL Logic ---------
class SuperAdmin {
  constructor() {
    this.userTabsElem = document.getElementById('superTabs');
    this.superBody = document.getElementById('superPanelBody');
    this.data = {
      users: getUserList(),
      target: 'developer', // Which user is currently managed?
    };
    this.renderTabs();
  }
  renderTabs() {
    this.data.users = getUserList();
    this.userTabsElem.innerHTML = '';
    this.data.users.forEach((u) => {
      let btn = document.createElement('button');
      btn.textContent = u.username;
      btn.className = u.username === this.data.target ? 'active' : '';
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
    <div class="userbox">
      <b>User Profile: <span style="color:#04b">${targetUser.username}</span></b>
      <form onsubmit="superadmin.editUser(event)">
        Username: <input name="username" value="${targetUser.username}" ${readonly} required>
        Password: <input name="password" value="${targetUser.password}" required>
        <button type="submit">Save</button>
        ${
          targetUser.username !== 'developer'
            ? `<button type="button" onclick="superadmin.deleteUser('${targetUser.username}')">Delete User</button>`
            : ''
        }
      </form>
      <br>
      <div>
        <button onclick="superadmin.renderMessages('${targetUser.username}')">Show Messages</button> 
        ${msgBox}
      </div>
      <div id="superMsgInbox"></div>
    </div>
    <div class="leadsbox">
      <b>Leads owned by this user:</b>
      <button onclick="superadmin.addLead('${targetUser.username}')">+ Add Lead</button>
      <div id="superLeadsList"></div>
    </div>
    `;
    this.renderLeads(targetUser.username);
    this.renderMessages(targetUser.username);
    superadmin.buildUserTable();
  }
  buildUserTable() {
    let ulist = getUserList();
    let html = `<table class="user-list-table"><tr><th>User</th><th>Password</th><th>&nbsp;</th></tr>`;
    ulist.forEach((u) => {
      html += `<tr>
        <td>${u.username}</td>
        <td>${u.password}</td>
        <td>${
          u.username !== 'developer' ? `<button onclick="superadmin.deleteUser('${u.username}')">Delete</button>` : ''
        }</td>
      </tr>`;
    });
    html += '</table>';
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
    users[idx].username = newName;
    users[idx].password = newPass;
    let leads = getStoredLeads();
    leads.forEach((l) => {
      if (l.addedBy === uname) l.addedBy = newName;
    });
    saveLeads();
    setUserList(users);
    showToast('Saved!', true);
    if (currentUser === uname) {
      currentUser = newName;
      localStorage.setItem(SESSION_KEY, newName);
      document.getElementById('currentUser').textContent = newName;
    }
    this.data.target = newName;
    this.renderTabs();
  }
  deleteUser(uname) {
    if (!confirm(`Delete user ${uname} and their leads?`)) return;
    let users = getUserList().filter((u) => u.username !== uname),
      leads = getStoredLeads().filter((l) => l.addedBy !== uname);
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
    <form onsubmit="superadmin.addUser(event)"><b>Add new user:</b> 
      Username:<input name="username" required> Password:<input name="password" required>
      <button>Add User</button>
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
    if (!val) return showToast('Empty msg', false);
    let k = 'semleads_inbox_' + uname,
      inbox = JSON.parse(localStorage.getItem(k) || '[]');
    inbox.push({ from: 'developer', text: val, dt: new Date().toLocaleString() });
    localStorage.setItem(k, JSON.stringify(inbox));
    showToast('Sent', true);
    this.renderMessages(uname);
    document.getElementById('msgToUser').value = '';
  }
  renderMessages(uname) {
    let k = 'semleads_inbox_' + uname,
      inbox = JSON.parse(localStorage.getItem(k) || '[]');
    document.getElementById('superMsgInbox').innerHTML =
      '<b>Inbox for ' +
      uname +
      ':</b><br>' +
      (inbox.length == 0
        ? `<em>No messages</em>`
        : inbox
            .slice()
            .reverse()
            .map(
              (m) =>
                `<div style="background:#f7ffff;margin:5px 0 3px 0;padding:5px 8px 3px 7px;border-radius:5px;"><b>${m.from}:</b> ${m.text}<br><small>${m.dt}</small></div>`
            )
            .join(''));
  }
  renderLeads(user) {
    let leads = getStoredLeads().filter((l) => l.addedBy === user);
    let html = '';
    leads.forEach((l) => {
      let id = 'superLeadsFup_' + l.email.replace(/[^a-z0-9]/gi, '');
      html += `
    <div style="background:#fff;padding:10px 7px 7px 8px;margin-bottom:9px;border-radius:7px;box-shadow:0 1px 6px #d6ebef11;">
      <b>${l.eventName || '[No Event]'}</b>
      <button style="margin-left:5px;" onclick="superadmin.deleteLead('${l.email}')">Delete</button>
      <button style="margin-left:3px;" onclick="superadmin.editLead('${l.email}')">Edit</button><br>
      Email: ${l.email} <br>
      Phone: ${l.phone} <br>
      Designation: ${l.designation}<br>
      Society: ${l.organisingSociety}<br>
      Category: ${l.category}<br>
      Remarks: ${l.remarks || '-'}<br>
      <form onsubmit="return superadmin.setLeadDate('${l.email}',this)">
        Date Added: <input type="datetime-local" name="dt" value="${l.addedOn ? l.addedOn.substring(0, 16) : ''}"><button>Set</button>
      </form>
      <div>Follow-ups: <button onclick="superadmin.showFupAddBox('${l.email}')">Add Follow-up</button></div>
      <div id="${id}"></div>
    </div>
    `;
      setTimeout(() => superadmin.renderFollowups(l.email), 1);
    });
    document.getElementById('superLeadsList').innerHTML = html;
  }
  addLead(addedBy) {
    this.superBody.querySelector('#superLeadsList').innerHTML =
      `<form onsubmit="return superadmin.saveNewLead(event,'${addedBy}')">
    <b>Add lead for ${addedBy}:</b> <br>
    Event Name:<input name="eventName"> Email:<input name="email"> Phone:<input name="phone"><br>
    Designation:<input name="designation"> Society:<input name="organisingSociety">
    <br>Category:<select name="category"><option>Hot</option><option>Warm</option><option>Cold</option><option>NI</option><option>NRE</option></select>
    <br>Remarks:<input name="remarks"> <button>Add</button></form>` +
      this.superBody.querySelector('#superLeadsList').innerHTML;
  }
  saveNewLead(e, user) {
    e.preventDefault();
    let f = e.target;
    let l = {
      eventName: f.eventName.value,
      email: f.email.value,
      phone: f.phone.value,
      designation: f.designation.value,
      organisingSociety: f.organisingSociety.value,
      category: f.category.value,
      remarks: f.remarks.value,
      followups: [],
      addedBy: user,
      addedOn: new Date().toISOString(),
    };
    let leads = getStoredLeads();
    if (leads.some((a) => a.email === l.email)) return showToast('Email already exists!', false);
    leads.push(l);
    window.leads = leads;
    saveLeads();
    showToast('Added!', true);
    this.renderLeads(user);
    return false;
  }
  deleteLead(email) {
    if (!confirm('Delete?')) return;
    let leads = getStoredLeads().filter((l) => l.email !== email);
    window.leads = leads;
    saveLeads();
    this.renderLeads(this.data.target);
  }
  editLead(email) {
    let leads = getStoredLeads();
    let idx = leads.findIndex((l) => l.email === email);
    if (idx < 0) return;
    let l = leads[idx];
    let f = `<form onsubmit="return superadmin.saveEditLead(event, '${email}')">
  Edit Lead-- Event: <input name="eventName" value="${l.eventName}"> Email:<input name="email" value="${l.email}"> Phone:<input name="phone" value="${l.phone}">
  <br>Designation:<input name="designation" value="${l.designation}"> Society:<input name="organisingSociety" value="${l.organisingSociety}">
  <br>Category:<select name="category">
    <option${l.category==='Hot'?' selected':''}>Hot</option>
    <option${l.category==='Warm'?' selected':''}>Warm</option>
    <option${l.category==='Cold'?' selected':''}>Cold</option>
    <option${l.category==='NI'?' selected':''}>NI</option>
    <option${l.category==='NRE'?' selected':''}>NRE</option>
  </select>
  <br>Remarks:<input name="remarks" value="${l.remarks || ''}">
  <button>Save</button>
  </form>`;
    this.superBody.querySelector('#superLeadsList').innerHTML =
      f + this.superBody.querySelector('#superLeadsList').innerHTML;
  }
  saveEditLead(e, email) {
    e.preventDefault();
    let leads = getStoredLeads();
    let idx = leads.findIndex((l) => l.email === email);
    let f = e.target;
    leads[idx].eventName = f.eventName.value;
    leads[idx].email = f.email.value;
    leads[idx].phone = f.phone.value;
    leads[idx].designation = f.designation.value;
    leads[idx].organisingSociety = f.organisingSociety.value;
    leads[idx].category = f.category.value;
    leads[idx].remarks = f.remarks.value;
    window.leads = leads;
    saveLeads();
    showToast('Saved');
    setTimeout(() => this.renderLeads(this.data.target), 320);
    return false;
  }
  setLeadDate(email, form) {
    let leads = getStoredLeads(),
      idx = leads.findIndex((l) => l.email === email);
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
      lead = leads.find((l) => l.email === email);
    if (!lead) return;
    let id = 'superLeadsFup_' + email.replace(/[^a-z0-9]/gi, '');
    let html = '';
    lead.followups.forEach((f, i) => {
      html += `<div style="margin:3px 0;">[${f.done ? 'Done' : 'Pending'}]
    ${new Date(f.datetime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
    <b>:</b> ${f.remark}
    <button onclick="superadmin.toggleFup('${email}',${i})">Toggle Done</button>
    <button onclick="superadmin.deleteFup('${email}',${i})">Delete</button>
    </div>`;
    });
    html += `<form onsubmit="return superadmin.addFupQuick(event,'${email}')">
    Add Followup: <input name="date" type="datetime-local"> <input name="remark" placeholder="remark">
    <button>Add</button></form>`;
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
    if (!dt || !r) return showToast('Enter both', false);
    let leads = getStoredLeads(),
      idx = leads.findIndex((l) => l.email === email);
    leads[idx].followups.push({ datetime: dt, remark: r, done: false });
    window.leads = leads;
    saveLeads();
    showToast('Added!');
    this.renderFollowups(email);
    return false;
  }
  toggleFup(email, i) {
    let leads = getStoredLeads(),
      idx = leads.findIndex((l) => l.email === email);
    if (idx < 0) return;
    leads[idx].followups[i].done = !leads[idx].followups[i].done;
    window.leads = leads;
    saveLeads();
    this.renderFollowups(email);
  }
  deleteFup(email, i) {
    let leads = getStoredLeads(),
      idx = leads.findIndex((l) => l.email === email);
    if (idx < 0) return;
    leads[idx].followups.splice(i, 1);
    window.leads = leads;
    saveLeads();
    this.renderFollowups(email);
  }
}
window.superadmin = null;

// -------- End Superadmin ---------

// -- USERS AND LEAD DATA/LOGIC FOR NORMAL USERS --
const LEADS_KEY = 'semleads_leads',
  SESSION_KEY = 'semleads_user';
let currentUser = null,
  leads = [],
  addFollowupForIdx = null;

function loginCheck(username, password) {
  let list = getUserList();
  return list.find(
    (u) =>
      u.username.trim().toLowerCase() === username.toLowerCase() &&
      u.password === password
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
  window.localStorage.setItem(SESSION_KEY, user);
  currentUser = user;
  if (isDeveloper()) {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('superAdminPanel').style.display = '';
    document.getElementById('devUsername').textContent = currentUser;
    window.superadmin = new SuperAdmin();
    return;
  }
  showDashboard();
};
function logout() {
  window.localStorage.removeItem(SESSION_KEY);
  location.reload();
}
function getStoredLeads() {
  let arr = JSON.parse(window.localStorage.getItem(LEADS_KEY) || '[]');
  arr.forEach((lead) => {
    if (!lead.followups) lead.followups = [];
  });
  window.leads = arr;
  return arr;
}
function saveLeads() {
  window.localStorage.setItem(LEADS_KEY, JSON.stringify(window.leads || []));
}

function setTabActive(tabId) {
  const tabBtns = {
    tabAdmin: document.getElementById('tabAdmin'),
    tabDashboard: document.getElementById('tabDashboard'),
    tabAllLeads: document.getElementById('tabAllLeads'),
  };
  for (const k in tabBtns) tabBtns[k] && tabBtns[k].classList.remove('active');
  if (tabBtns[tabId]) tabBtns[tabId].classList.add('active');
}
function showLeadsSection() {
  setTabActive('tabDashboard');
  document.getElementById('admin-section').style.display = 'none';
  document.getElementById('dashboardContentRow').style.display = '';
  document.getElementById('all-leads-section').style.display = 'none';
  document.getElementById('dashboard-section').style.display = '';
}
function showAllLeadsSection() {
  setTabActive('tabAllLeads');
  document.getElementById('admin-section').style.display = 'none';
  document.getElementById('dashboardContentRow').style.display = 'none';
  document.getElementById('all-leads-section').style.display = '';
  document.getElementById('dashboard-section').style.display = '';
  renderAllLeadsTable();
}
function showAdminSection() {
  setTabActive('tabAdmin');
  document.getElementById('dashboard-section').style.display = '';
  document.getElementById('admin-section').style.display = '';
  document.getElementById('dashboardContentRow').style.display = 'none';
  document.getElementById('all-leads-section').style.display = 'none';
  document.getElementById('adminName').textContent = currentUser ?? 'Admin';
  document.getElementById('adminTotalLeads').textContent = leads.length;
  document.getElementById('adminTodaysFollowups').textContent = countTodayFollowups();
}
function showDashboard() {
  document.getElementById('welcome-popup').style.display = 'block';
  setTimeout(() => {
    document.getElementById('welcome-popup').style.display = 'none';
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = '';
    document.getElementById('all-leads-section').style.display = 'none';
    document.getElementById('admin-section').style.display = 'none';
    document.getElementById('dashboardContentRow').style.display = '';
    document.getElementById('currentUser').textContent = currentUser;
    leads = getStoredLeads();
    renderLeads();
    renderTodayFollowups();
    showLeadsSection();
    showToast(`Welcome, ${currentUser}!`, true);
    // Show inbox if any
    let k = 'semleads_inbox_' + currentUser,
      inbox = JSON.parse(localStorage.getItem(k) || '[]');
    if (inbox && inbox.length) {
      setTimeout(() => {
        showToast('You have ' + inbox.length + ' message' + (inbox.length > 1 ? 's' : ''), true);
        alert('Messages from developer:\n\n' + inbox.map((m) => m.from + ': ' + m.text).join('\n\n'));
        localStorage.setItem(k, '[]');
      }, 1200);
    }
  }, 950);
}

document.getElementById('leadForm').onsubmit = function (e) {
  e.preventDefault();
  let eventName = document.getElementById('leadEventName').value.trim();
  let email = document.getElementById('leadEmail').value.trim();
  let phone = document.getElementById('leadPhone').value.trim();
  let designation = document.getElementById('leadDesignation').value.trim();
  let society = document.getElementById('leadOrgSociety').value.trim();
  let category = document.getElementById('leadCategory').value;
  if (!eventName || !email || !designation || !society || !phone || !category) {
    showToast('Please fill all the fields!', false);
    return;
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    showToast('Invalid email', false);
    return;
  }
  if (!/^\d{8,}/.test(phone)) {
    showToast('Enter valid phone no.', false);
    return;
  }
  if (leads.some((l) => l.email.trim().toLowerCase() === email.toLowerCase())) {
    showToast('Email already exists!', false);
    return;
  }
  let now = new Date();
  let istOffset = 5.5 * 60 * 60 * 1000; 
  let addedOnIST = new Date(now.getTime() + istOffset - now.getTimezoneOffset() * 60000);
  let newLead = {
    eventName,
    email,
    phone,
    designation,
    organisingSociety: society,
    category,
    remarks: document.getElementById('leadRemarks').value.trim(),
    addedBy: currentUser,
    addedOn: addedOnIST.toISOString(),
    followups: [],
  };
  leads.push(newLead);
  saveLeads();
  renderLeads();
  renderTodayFollowups();
  renderAllLeadsTable();
  this.reset();
  showToast('Lead added!');
};
function renderLeads() {} // no conflict with superadmin

function renderAllLeadsTable() {
  let q = document.getElementById('allSearchLead').value.trim().toLowerCase();
  let isAdmin = currentUser && currentUser.toUpperCase() === 'SEM';
  let html = `<table id="allLeadsTable"><tr>
    <th>Event Name</th><th>Email</th><th>Phone</th><th>Designation</th>
    <th>Society</th><th>Category</th><th>Remarks</th>
    <th>Added By</th><th>Added On (IST)</th><th>Follow-ups</th>
  </tr>`;
  let visibleLeads = isAdmin
    ? leads
    : leads.filter(
        (l) =>
          l.addedBy && l.addedBy.trim().toLowerCase() === currentUser.trim().toLowerCase()
      );
  visibleLeads
    .filter((lead) =>
      [lead.eventName, lead.email, lead.phone, lead.designation, lead.organisingSociety, lead.category, lead.remarks, lead.addedBy]
        .join('|')
        .toLowerCase()
        .includes(q)
    )
    .sort((a, b) => {
      return (b.addedOn || '').localeCompare(a.addedOn || '');
    })
    .forEach((lead, i) => {
      html += `<tr>
      <td>${lead.eventName}</td>
      <td>${lead.email}</td>
      <td>${lead.phone}</td>
      <td>${lead.designation}</td>
      <td>${lead.organisingSociety}</td>
      <td><span class='tag ${lead.category.split(' ')[0]}'>${lead.category}</span></td>
      <td>${lead.remarks || ''}</td>
      <td>${lead.addedBy || ''}</td>
      <td>${lead.addedOn ? new Date(lead.addedOn).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : ''}</td>
      <td>
        ${lead.followups?.length || 0}
        <button type="button" onclick="openFollowupModal(${leads.indexOf(lead)})">➕ Add</button>
        <br>
        ${(lead.followups || []).map((f, idx) =>
          `<div style="font-size:13px;padding:2px;">
            📆 ${new Date(f.datetime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}<br>
            <span style="color:#444;">${f.remark}</span>
            <span style="color:${f.done ? '#26b361' : '#d0021b'};font-weight:bold;">[${f.done ? 'Done' : 'Pending'}]</span>
            <button type="button" onclick="markFollowupDone(${leads.indexOf(lead)},${idx})" style="font-size:11px; margin-left:2px;">Mark Done</button>
          </div>`
        ).join('')}
      </td>
    </tr>`;
    });
  html += '</table>';
  document.getElementById('allLeadsTableContainer').innerHTML = html;
}
document.getElementById('allSearchLead').oninput = renderAllLeadsTable;

window.openFollowupModal = function (idx) {
  addFollowupForIdx = idx;
  document.getElementById('fLeadName').textContent = leads[idx].eventName;
  document.getElementById('followupDate').value = '';
  document.getElementById('followupRemark').value = '';
  document.getElementById('modalBg').classList.add('open');
  document.getElementById('followupModal').classList.add('open');
};
window.closeFollowupModal = function () {
  document.getElementById('modalBg').classList.remove('open');
  document.getElementById('followupModal').classList.remove('open');
};
document.getElementById('followupForm').onsubmit = function (e) {
  e.preventDefault();
  let dt = document.getElementById('followupDate').value,
    remark = document.getElementById('followupRemark').value.trim();
  if (!dt) return showToast('Date and time required!', false);
  if (!remark) return showToast('Please enter remark!', false);
  leads[addFollowupForIdx].followups.push({ datetime: dt, remark: remark, done: false });
  saveLeads();
  closeFollowupModal();
  renderLeads();
  renderTodayFollowups();
  renderAllLeadsTable();
  showToast('Follow-up added!');
};
window.markFollowupDone = function (leadIdx, fIdx) {
  if (leads[leadIdx].followups[fIdx].done) return showToast('Already done.', false);
  if (!confirm('Mark this follow-up as done?')) return;
  leads[leadIdx].followups[fIdx].done = true;
  saveLeads();
  renderLeads();
  renderTodayFollowups();
  renderAllLeadsTable();
  showToast('Marked done.', true);
};
function renderTodayFollowups() {
  let now = new Date();
  let yyyy = now.getFullYear(),
    mm = now.getMonth(),
    dd = now.getDate();
  let todayStart = new Date(yyyy, mm, dd, 0, 0, 0).getTime();
  let todayEnd = new Date(yyyy, mm, dd, 23, 59, 59).getTime();
  let html = '';
  leads.forEach((lead, i) => {
    lead.followups.forEach((f, idx) => {
      let ts = new Date(f.datetime).getTime();
      if (ts >= todayStart && ts <= todayEnd) {
        html += `<div class="flex" style="align-items:center; margin-bottom:7px;">
        <span class="tag ${lead.category.split(' ')[0]}" style="min-width:40px;">${lead.category}</span>
        <b style="color:#25a">${lead.eventName}</b>
        <span>${new Date(f.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <span>${f.remark}</span>
        <span style="color:${f.done ? '#26b361' : '#d0021b'};font-size:.98em;">[${f.done ? 'Done' : 'Pending'}]</span>
        <button type="button" onclick="markFollowupDone(${i},${idx});" style="font-size:13px;">Mark Done</button>
      </div>`;
      }
    });
  });
  document.getElementById('calendar-list').innerHTML =
    html || '<em>No follow-ups scheduled for today.</em>';
}
function countTodayFollowups() {
  let now = new Date();
  let yyyy = now.getFullYear(),
    mm = now.getMonth(),
    dd = now.getDate();
  let todayStart = new Date(yyyy, mm, dd, 0, 0, 0).getTime();
  let todayEnd = new Date(yyyy, mm, dd, 23, 59, 59).getTime();
  let count = 0;
  leads.forEach((lead) =>
    lead.followups.forEach((f) => {
      let ts = new Date(f.datetime).getTime();
      if (ts >= todayStart && ts <= todayEnd) count++;
    })
  );
  return count;
}

// -- Glassy Animated Enhancements --

// Ripple effect on buttons
document.querySelectorAll('button').forEach((btn) => {
  btn.style.position = 'relative';
  btn.style.overflow = 'hidden';
  btn.addEventListener('click', function (e) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = btn.getBoundingClientRect();
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  });
});

// Floating background parallax
const floats = document.querySelectorAll('.float-shape');
document.body.addEventListener('mousemove', (e) => {
  const cx = e.clientX / window.innerWidth - 0.5;
  const cy = e.clientY / window.innerHeight - 0.5;
  floats.forEach((el, i) => {
    const x = 10 * (i + 1) * cx;
    const y = 10 * (i + 1) * cy;
    el.style.transform = `translate(${x}px, ${y}px)`;
  });
});

// Input focus glow effect
document.querySelectorAll('input, textarea, select').forEach((el) => {
  el.addEventListener('focus', function () {
    const lbl = this.parentNode.querySelector('label');
    if (lbl) lbl.style.color = '#89dfff';
    this.style.boxShadow = '0 0 0 3px #7aceff88';
  });
  el.addEventListener('blur', function () {
    const lbl = this.parentNode.querySelector('label');
    if (lbl) lbl.style.color = '';
    this.style.boxShadow = '';
  });
});

// Modal open/close animations wrapped
function openModal(modalId, bgId) {
  document.getElementById(bgId).classList.add('open');
  const modal = document.getElementById(modalId);
  modal.classList.add('open');
  modal.style.opacity = '0';
  modal.style.transform = 'scale(0.88)';
  setTimeout(() => {
    modal.style.opacity = '1';
    modal.style.transform = 'scale(1)';
  }, 30);
}
function closeModal(modalId, bgId) {
  const modal = document.getElementById(modalId);
  modal.style.opacity = '0';
  modal.style.transform = 'scale(0.88)';
  setTimeout(() => {
    modal.classList.remove('open');
    document.getElementById(bgId).classList.remove('open');
  }, 180);
}

// Override terms modal functions to use above animations
const termsModalBg = document.getElementById('termsModalBg');
const termsModal = document.getElementById('termsModal');
const showTermsLink = document.getElementById('showTermsLink');
const closeTermsBtn = document.getElementById('closeTermsBtn');

function openTermsModal() {
  openModal('termsModal', 'termsModalBg');
  termsModal.focus();
}
function closeTermsModal() {
  closeModal('termsModal', 'termsModalBg');
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

// Container fade-in on DOM ready for extra smoothness
window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('container');
  setTimeout(() => {
    container.style.opacity = '1';
    container.style.transform = 'translateY(0)';
  }, 80);
});

// Optional: Mini Loader (for async operations)
window.showGlassLoader = function (msg = 'Loading...') {
  if (document.getElementById('glass-loader')) return;
  const loader = document.createElement('div');
  loader.id = 'glass-loader';
  loader.innerHTML = `<div class="glass-loader-anim"></div><div style="color:#c0e6ff;margin-top:14px;text-align:center;">${msg}</div>`;
  loader.style =
    'position:fixed;left:50vw;top:38vh;z-index:5001;transform:translate(-50%,-50%);background:rgba(255,255,255,0.13);padding:44px 60px 30px 60px;border-radius:32px;backdrop-filter: blur(20px) saturate(145%);box-shadow:0 10px 48px #133a61cc;animation: containerFadeSlide 1.1s cubic-bezier(.4,0,.2,1);';
  document.body.append(loader);
};
window.hideGlassLoader = function () {
  let l = document.getElementById('glass-loader');
  if (l) l.remove();
};
