// ----- User Demo Profiles -----
const users = [
  { username: "sushant", password: "sush@123" },
  { username: "yash", password: "yash@123" },
  { username: "gaurav", password: "gaurav@123" }
];

// LocalStorage keys
const LEADS_KEY = "semleads_leads";
const SESSION_KEY = "semleads_user";

let currentUser = null;
let leads = [];
let addFollowupForIdx = null;

// ------ Login Logic ------
function showError(msg) {
  document.getElementById('error').textContent = msg;
}
function loginCheck(username, password) {
  return users.find(u => u.username === username && u.password === password);
}

document.getElementById('loginForm').onsubmit = function(e) {
  e.preventDefault();
  let user = document.getElementById('loginUser').value;
  let pass = document.getElementById('loginPass').value;
  let res = loginCheck(user, pass);
  if (!res) return showError('Invalid username or password.');
  window.localStorage.setItem(SESSION_KEY, user);
  currentUser = user;
  showDashboard();
};

function logout() {
  window.localStorage.removeItem(SESSION_KEY);
  location.reload();
}

function showDashboard() {
  document.getElementById('login-section').style.display = "none";
  document.getElementById('dashboard-section').style.display = "";
  document.getElementById('currentUser').textContent = currentUser;
  leads = getStoredLeads();
  renderLeads();
  renderTodayFollowups();
}

// ------ Data Storage ------
function getStoredLeads() {
  let arr = JSON.parse(window.localStorage.getItem(LEADS_KEY) || "[]");
  arr.forEach(lead => {
    if (!lead.followups) lead.followups = [];
  });
  return arr;
}
function saveLeads() {
  window.localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
}

// ------ Add Lead ------
document.getElementById('leadForm').onsubmit = function(e) {
  e.preventDefault();
  let newLead = {
    name: document.getElementById('leadName').value.trim(),
    email: document.getElementById('leadEmail').value.trim(),
    phone: document.getElementById('leadPhone').value.trim(),
    category: document.getElementById('leadCategory').value,
    remarks: document.getElementById('leadRemarks').value.trim(),
    followups: []
  };
  leads.push(newLead);
  saveLeads();
  renderLeads();
  renderTodayFollowups();
  this.reset();
  alert('Lead added!');
};

// ------ Render Leads Table ------
function renderLeads() {
  let q = document.getElementById('searchLead').value.trim().toLowerCase();
  let html = `<table id="leadsTable">
    <tr><th>Name</th><th>Email</th><th>Phone</th><th>Category</th>
    <th>Remarks</th><th>Follow-ups</th></tr>`;
  leads.filter(lead =>
    [lead.name, lead.email, lead.phone, lead.category, lead.remarks].join("|").toLowerCase().includes(q)
  ).forEach((lead, i) => {
    html += `<tr>
      <td>${lead.name}</td>
      <td>${lead.email}</td>
      <td>${lead.phone}</td>
      <td><span class='tag ${lead.category.split(' ')[0]}'>${lead.category}</span></td>
      <td>${lead.remarks || ''}</td>
      <td>
        ${lead.followups.length}
        <button onclick="openFollowupModal(${i})">Add</button>
        <br>
        ${lead.followups.map((f,idx) =>
          `<div style="font-size:13px;padding:2px;">
            📆 ${new Date(f.datetime).toLocaleString()}<br>
            <span style="color:#444;">${f.remark}</span>
            <span style="color:${f.done?'#317d3c':'#b53124'};font-weight:bold;">
              [${f.done?'Done':'Pending'}]
            </span>
            <button onclick="markFollowupDone(${i},${idx})" style="font-size:11px; margin-left:2px;">Mark Done</button>
          </div>`
        ).join('')}
      </td>
    </tr>`;
  });
  html += "</table>";
  document.getElementById('leadsTableContainer').innerHTML = html;
}

// ------ Search Functionality ------
document.getElementById('searchLead').oninput = renderLeads;

// ------ Follow-up Modal ------
window.openFollowupModal = function(idx) {
  addFollowupForIdx = idx;
  document.getElementById('fLeadName').textContent = leads[idx].name;
  document.getElementById('followupDate').value = '';
  document.getElementById('followupRemark').value = '';
  document.getElementById('modalBg').classList.add('open');
  document.getElementById('followupModal').classList.add('open');
};
window.closeFollowupModal = function() {
  document.getElementById('modalBg').classList.remove('open');
  document.getElementById('followupModal').classList.remove('open');
};

document.getElementById('followupForm').onsubmit = function(e) {
  e.preventDefault();
  let dt = document.getElementById('followupDate').value;
  let remark = document.getElementById('followupRemark').value.trim();
  if (!dt) return alert('Date and time required!');
  leads[addFollowupForIdx].followups.push({
    datetime: dt,
    remark: remark,
    done: false
  });
  saveLeads();
  closeFollowupModal();
  renderLeads();
  renderTodayFollowups();
};

// Mark follow-up as done
window.markFollowupDone = function(leadIdx, fIdx) {
  leads[leadIdx].followups[fIdx].done = true;
  saveLeads();
  renderLeads();
  renderTodayFollowups();
};

// ------ Calendar: Today's Follow-ups ------
function renderTodayFollowups() {
  let now = new Date();
  let yyyy = now.getFullYear(), mm = now.getMonth(), dd = now.getDate();
  let todayStart = new Date(yyyy,mm,dd,0,0,0).getTime();
  let todayEnd   = new Date(yyyy,mm,dd,23,59,59).getTime();
  let html = '';
  let foundAny = false;
  leads.forEach((lead, i) => {
    lead.followups.forEach((f, idx) => {
      let ts = new Date(f.datetime).getTime();
      if(ts>=todayStart && ts<=todayEnd) {
        html += `<div class="flex" style="align-items:center; margin-bottom:7px;">
          <span class="tag ${lead.category.split(' ')[0]}" style="min-width:40px;">${lead.category}</span>
          <b style="color:#25a">${lead.name}</b>
          <span>${new Date(f.datetime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
          <span>${f.remark}</span>
          <span style="color:${f.done?'#337d34':'#b53124'};font-size:.94em;">[${f.done?'Done':'Pending'}]</span>
          <button onclick="markFollowupDone(${i},${idx});" style="font-size:13px;">Mark Done</button>
        </div>`;
        foundAny = true;
      }
    });
  });
  document.getElementById('calendar-list').innerHTML = html || "<em>No follow-ups scheduled for today.</em>";
}

// ------ Autofill Session ------
window.onload = function() {
  currentUser = window.localStorage.getItem(SESSION_KEY);
  if(currentUser) showDashboard();
};

// Clicking background closes modal
document.getElementById('modalBg').onclick = closeFollowupModal;

