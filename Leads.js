//----- User Demo Profiles -----
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

// Snackbars for notifications
function showToast(message, success = true) {
  let t = document.createElement("div");
  t.textContent = message;
  t.style.position = "fixed";
  t.style.left = "50%";
  t.style.bottom = "40px";
  t.style.transform = "translateX(-50%)";
  t.style.padding = "16px 30px";
  t.style.background = success ? "#28b76b" : "#e0382c";
  t.style.color = "#fff";
  t.style.fontSize = "1.15rem";
  t.style.borderRadius = "18px";
  t.style.boxShadow = "0 10px 28px #2242";
  t.style.zIndex = "9999";
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; }, 1100);
  setTimeout(() => { document.body.removeChild(t); }, 1600);
}

// TAB VIEW SWITCHING
function setTabActive(tabId) {
  const tabBtns = {
    tabAdmin: document.getElementById("tabAdmin"),
    tabDashboard: document.getElementById("tabDashboard"),
    tabAllLeads: document.getElementById("tabAllLeads")
  };
  for (const k in tabBtns) tabBtns[k] && tabBtns[k].classList.remove("active");
  if (tabBtns[tabId]) tabBtns[tabId].classList.add("active");
}

function showLeadsSection() {
  setTabActive("tabDashboard");
  document.getElementById('admin-section').style.display = 'none';
  document.getElementById('dashboardContentRow').style.display = '';
  document.getElementById('all-leads-section').style.display = 'none';
  document.getElementById('dashboard-section').style.display = '';
}
function showAllLeadsSection() {
  setTabActive("tabAllLeads");
  document.getElementById('admin-section').style.display = 'none';
  document.getElementById('dashboardContentRow').style.display = 'none';
  document.getElementById('all-leads-section').style.display = '';
  document.getElementById('dashboard-section').style.display = '';
  renderAllLeadsTable();
}
function showAdminSection() {
  setTabActive("tabAdmin");
  document.getElementById('dashboard-section').style.display = '';
  document.getElementById('admin-section').style.display = '';
  document.getElementById('dashboardContentRow').style.display = 'none';
  document.getElementById('all-leads-section').style.display = 'none';
  document.getElementById('adminName').textContent = currentUser ?? "Admin";
  document.getElementById('adminTotalLeads').textContent = leads.length;
  document.getElementById('adminTodaysFollowups').textContent = countTodayFollowups();
}

//-- Login Logic (eye icon and error clear) --
(function addPasswordToggle() {
  const passInput = document.getElementById('loginPass');
  if (!passInput) return;
  let eye = document.createElement('span');
  eye.textContent = '👁️';
  eye.title = "Show/Hide password";
  eye.style.cssText = "position:absolute; top:53px; right:17px; cursor:pointer;font-size:1.25em;user-select:none;";
  let parent = passInput.parentElement;
  parent.style.position = "relative";
  passInput.insertAdjacentElement('afterend', eye);
  eye.onclick = () => {
    passInput.type = passInput.type === "text" ? "password" : "text";
  }
})();

document.getElementById('loginUser').oninput =
document.getElementById('loginPass').oninput = function(){
  document.getElementById('error').textContent = '';
};

function showError(msg) {
  document.getElementById('error').textContent = msg;
}
function loginCheck(username, password) {
  return users.find(u => u.username === username && u.password === password);
}

document.getElementById('loginForm').onsubmit = function(e) {
  e.preventDefault();
  let user = document.getElementById('loginUser').value.trim();
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
  document.getElementById('welcome-popup').style.display = 'block';
  setTimeout(() => {
    document.getElementById('welcome-popup').style.display = 'none';
    document.getElementById('login-section').style.display = "none";
    document.getElementById('dashboard-section').style.display = "";
    document.getElementById('all-leads-section').style.display = "none";
    document.getElementById('admin-section').style.display = "none";
    document.getElementById('dashboardContentRow').style.display = "";
    document.getElementById('currentUser').textContent = currentUser;
    leads = getStoredLeads();
    renderLeads();
    renderTodayFollowups();
    showLeadsSection();
    // Animation
    showToast(`Welcome, ${currentUser}!`, true);
  }, 1000);
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

//------ Add Lead (validation & duplicate check) ------
document.getElementById('leadForm').onsubmit = function(e) {
  e.preventDefault();
  let eventName = document.getElementById('leadEventName').value.trim();
  let email = document.getElementById('leadEmail').value.trim();
  let phone = document.getElementById('leadPhone').value.trim();
  let designation = document.getElementById('leadDesignation').value.trim();
  let society = document.getElementById('leadOrgSociety').value.trim();
  let category = document.getElementById('leadCategory').value;

  // validation
  if (!eventName || !email || !phone || !designation || !society || !category) {
    showToast("All fields are required!", false);
    return;
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    showToast("Invalid email address", false); return;
  }
  if (!/^\d{8,}/.test(phone)) {
    showToast("Enter a valid phone number", false); return;
  }
  if (leads.some(l => l.email === email)) {
    showToast("Email already exists in leads!", false); return;
  }
  let newLead = {
    eventName, email, phone, designation, organisingSociety: society,
    category, remarks: document.getElementById('leadRemarks').value.trim(),
    followups: []
  };
  leads.push(newLead);
  saveLeads();
  renderLeads();
  renderTodayFollowups();
  renderAllLeadsTable();
  this.reset();
  showToast('Lead added!');
};

// ------ Render Leads Table ------
function renderLeads() {
  let html = `<table id="leadsTable">
    <tr>
      <th title="Event">Event Name</th>
      <th>Email</th>
      <th>Phone</th>
      <th>Designation</th>
      <th>Organising Society</th>
      <th>Category</th>
      <th>Remarks</th>
      <th>Follow-ups</th>
    </tr>`;
  leads.forEach((lead, i) => {
    html += `<tr>
      <td title="Event Name">${lead.eventName}</td>
      <td>${lead.email}</td>
      <td>${lead.phone}</td>
      <td>${lead.designation}</td>
      <td title="Organising Society">${lead.organisingSociety}</td>
      <td><span class='tag ${lead.category.split(' ')[0]}'>${lead.category}</span></td>
      <td>${lead.remarks || ''}</td>
      <td>
        <span title="Follow-ups">${lead.followups.length}</span>
        <button type="button" onclick="openFollowupModal(${i})" title="Add follow-up">➕</button>
        <br>
        ${lead.followups.map((f,idx) =>
          `<div style="font-size:13px;padding:2px;" title="Follow-up detail">
            📆 <span title="Follow-up date">${new Date(f.datetime).toLocaleString()}</span><br>
            <span style="color:#444;">${f.remark}</span>
            <span style="color:${f.done?'#317d3c':'#b53124'};font-weight:bold;">
              [${f.done?'Done':'Pending'}]
            </span>
            <button type="button" onclick="markFollowupDone(${i},${idx})" style="font-size:10px; margin-left:2px;"
            title="Mark as done">✔️</button>
          </div>`
        ).join('')}
      </td>
    </tr>`;
  });
  // Not displaying leads table on dashboard by default (per your UI intent)
}

// ------ All Leads Table ------
function renderAllLeadsTable() {
  let q = document.getElementById('allSearchLead').value.trim().toLowerCase();
  let html = `<table id="allLeadsTable">
    <tr>
      <th>Event Name</th>
      <th>Email</th>
      <th>Phone</th>
      <th>Designation</th>
      <th>Organising Society</th>
      <th>Category</th>
      <th>Remarks</th>
      <th>Follow-ups</th>
    </tr>`;
  leads.filter(lead =>
    [lead.eventName, lead.email, lead.phone, lead.designation, lead.organisingSociety, lead.category, lead.remarks].join("|").toLowerCase().includes(q)
  ).forEach((lead, i) => {
    html += `<tr>
      <td>${lead.eventName}</td>
      <td>${lead.email}</td>
      <td>${lead.phone}</td>
      <td>${lead.designation}</td>
      <td>${lead.organisingSociety}</td>
      <td><span class='tag ${lead.category.split(' ')[0]}'>${lead.category}</span></td>
      <td>${lead.remarks || ''}</td>
      <td>
        <span title="Follow-ups">${lead.followups.length}</span>
        <button type="button" onclick="openFollowupModal(${i})" title="Add follow-up">➕</button>
        <br>
        ${lead.followups.map((f,idx) =>
          `<div style="font-size:13px;padding:2px;" title="Follow-up detail">
            📆 <span title="Follow-up date">${new Date(f.datetime).toLocaleString()}</span><br>
            <span style="color:#444;">${f.remark}</span>
            <span style="color:${f.done?'#317d3c':'#b53124'};font-weight:bold;">
              [${f.done?'Done':'Pending'}]
            </span>
            <button type="button" onclick="markFollowupDone(${i},${idx})" style="font-size:10px; margin-left:2px;"
            title="Mark as done">✔️</button>
          </div>`
        ).join('')}
      </td>
    </tr>`;
  });
  html += "</table>";
  document.getElementById('allLeadsTableContainer').innerHTML = html;
}
document.getElementById('allSearchLead').oninput = renderAllLeadsTable;

// ------ Follow-up Modal ------
window.openFollowupModal = function(idx) {
  addFollowupForIdx = idx;
  document.getElementById('fLeadName').textContent = leads[idx].eventName;
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
  if (!dt) return showToast('Date and time required!', false);
  if (!remark) return showToast('Please enter the follow-up remark!', false);
  leads[addFollowupForIdx].followups.push({
    datetime: dt,
    remark: remark,
    done: false
  });
  saveLeads();
  closeFollowupModal();
  renderLeads();
  renderTodayFollowups();
  renderAllLeadsTable();
  showToast('Follow-up logged!');
};

window.markFollowupDone = function(leadIdx, fIdx) {
  const f = leads[leadIdx].followups[fIdx];
  if (f.done) return showToast("Already marked done.", false);
  if (!confirm("Mark this follow-up as done?")) return;
  leads[leadIdx].followups[fIdx].done = true;
  saveLeads();
  renderLeads();
  renderTodayFollowups();
  renderAllLeadsTable();
  showToast('Follow-up marked done');
};

// ------ Calendar: Today's Follow-ups ------
function renderTodayFollowups() {
  let now = new Date();
  let yyyy = now.getFullYear(), mm = now.getMonth(), dd = now.getDate();
  let todayStart = new Date(yyyy,mm,dd,0,0,0).getTime();
  let todayEnd   = new Date(yyyy,mm,dd,23,59,59).getTime();
  let html = '';
  leads.forEach((lead, i) => {
    lead.followups.forEach((f, idx) => {
      let ts = new Date(f.datetime).getTime();
      if(ts>=todayStart && ts<=todayEnd) {
        html += `<div class="flex" style="align-items:center; margin-bottom:7px;">
          <span class="tag ${lead.category.split(' ')[0]}" style="min-width:40px;" title="Category">${lead.category}</span>
          <b style="color:#25a" title="Event Name">${lead.eventName}</b>
          <span title="Time">${new Date(f.datetime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
          <span>${f.remark}</span>
          <span style="color:${f.done?'#337d34':'#b53124'};font-size:.94em;">[${f.done?'Done':'Pending'}]</span>
          <button type="button" onclick="markFollowupDone(${i},${idx});" style="font-size:13px;" title="Mark as done">✔️</button>
        </div>`;
      }
    });
  });
  document.getElementById('calendar-list').innerHTML = html || "<em>No follow-ups scheduled for today.</em>";
}

function countTodayFollowups() {
  let now = new Date();
  let yyyy = now.getFullYear(), mm = now.getMonth(), dd = now.getDate();
  let todayStart = new Date(yyyy,mm,dd,0,0,0).getTime();
  let todayEnd   = new Date(yyyy,mm,dd,23,59,59).getTime();
  let count = 0;
  leads.forEach((lead) =>
    lead.followups.forEach((f) => {
      let ts = new Date(f.datetime).getTime();
      if (ts >= todayStart && ts <= todayEnd) count++;
    })
  );
  return count;
}

// ------ Autofill Session ------
window.onload = function() {
  currentUser = window.localStorage.getItem(SESSION_KEY);
  if(currentUser) showDashboard();
};

// Clicking background closes modal
document.getElementById('modalBg').onclick = closeFollowupModal;
