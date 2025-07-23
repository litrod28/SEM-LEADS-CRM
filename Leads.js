// === Modern Toast Notifications ===
function showToast(message, success = true) {
  let t = document.createElement("div");
  t.className = "snackbar";
  t.style.background = success
    ? "linear-gradient(90deg,#18a583,#06bbea 85%)"
    : "linear-gradient(95deg,#d83c2b,#ee9c63 85%)";
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; }, 2050);
  setTimeout(() => { try{ document.body.removeChild(t); }catch{} }, 2750);
}

// === User Config ===
const users = [
  { username: "sushant", password: "sush@123" },
  { username: "yash", password: "yash@123" },
  { username: "gaurav", password: "gaurav@123" }
];
const LEADS_KEY = "semleads_leads";
const SESSION_KEY = "semleads_user";
let currentUser = null, leads = [], addFollowupForIdx = null;

// === Tab Navigation with Animation ===
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

// === Login Logic ===
function showError(msg) {
  document.getElementById('error').textContent = msg;
}
function loginCheck(username, password) {
  return users.find(u => u.username === username && u.password === password);
}
document.getElementById('loginUser').oninput =
document.getElementById('loginPass').oninput = function(){
  document.getElementById('error').textContent = '';
};
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
    showToast(`Welcome, ${currentUser}!`, true);
  }, 900);
}

// === Local Storage Handling ===
function getStoredLeads() {
  let arr = JSON.parse(window.localStorage.getItem(LEADS_KEY) || "[]");
  arr.forEach(lead => { if (!lead.followups) lead.followups = []; });
  return arr;
}
function saveLeads() {
  window.localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
}

// === Add Lead with Enhanced Validation ===
document.getElementById('leadForm').onsubmit = function(e) {
  e.preventDefault();
  let eventName = document.getElementById('leadEventName').value.trim();
  let email = document.getElementById('leadEmail').value.trim();
  let phone = document.getElementById('leadPhone').value.trim();
  let designation = document.getElementById('leadDesignation').value.trim();
  let society = document.getElementById('leadOrgSociety').value.trim();
  let category = document.getElementById('leadCategory').value;

  if (!eventName || !email || !designation || !society || !category) {
    showToast("Please fill out all fields.", false); return;
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    showToast("Invalid email format.", false); return;
  }
  if (!/^\d{8,}/.test(phone)) {
    showToast("Enter a valid phone number.", false); return;
  }
  if (leads.some(l => l.email === email)) {
    showToast("Email already exists.", false); return;
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

// === Render All Leads Search Table ===
function renderLeads() {} // No dashboard leads table

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
    [lead.eventName, lead.email, lead.phone, lead.designation, lead.organisingSociety, lead.category, lead.remarks].join(" ").toLowerCase().includes(q)
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
        ${lead.followups.length}
        <button type="button" onclick="openFollowupModal(${i})" title="Add Follow-up">➕</button>
        <br>
        ${lead.followups.map((f,idx) =>
          `<div style="font-size:13px;padding:2px;">
            📆 ${new Date(f.datetime).toLocaleString()}<br>
            <span style="color:#444;">${f.remark}</span>
            <span style="color:${f.done?'#1bb757':'#d0021b'};font-weight:bold;">
              [${f.done?'Done':'Pending'}]
            </span>
            <button type="button" onclick="markFollowupDone(${i},${idx})" style="font-size:11px; margin-left:2px;">Mark Done</button>
          </div>`
        ).join('')}
      </td>
    </tr>`;
  });
  html += "</table>";
  document.getElementById('allLeadsTableContainer').innerHTML = html;
}
document.getElementById('allSearchLead').oninput = renderAllLeadsTable;

// === Follow-up Modal ===
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
  if (!remark) return showToast('Remark required!', false);
  leads[addFollowupForIdx].followups.push({ datetime: dt, remark: remark, done: false });
  saveLeads();
  closeFollowupModal();
  renderLeads();
  renderTodayFollowups();
  renderAllLeadsTable();
  showToast('Follow-up added!');
};
window.markFollowupDone = function(leadIdx, fIdx) {
  if (leads[leadIdx].followups[fIdx].done) return showToast("Already done.", false);
  if (!confirm("Mark this follow-up as done?")) return;
  leads[leadIdx].followups[fIdx].done = true;
  saveLeads();
  renderLeads();
  renderTodayFollowups();
  renderAllLeadsTable();
  showToast('Marked done.', true);
};

// === Today's Follow-ups Animated List ===
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
        html += `<div class="flex" style="align-items:center; margin-bottom:9px;">
          <span class="tag ${lead.category.split(' ')[0]}" style="min-width:42px;">${lead.category}</span>
          <b style="color:#19a">${lead.eventName}</b>
          <span>${new Date(f.datetime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
          <span>${f.remark}</span>
          <span style="color:${f.done?'#08925f':'#d0021b'};font-size:.96em;">[${f.done?'Done':'Pending'}]</span>
          <button type="button" onclick="markFollowupDone(${i},${idx});" style="font-size:13px;">Mark Done</button>
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

// === On load: session auto-login ===
window.onload = function() {
  currentUser = window.localStorage.getItem(SESSION_KEY);
  if(currentUser) showDashboard();
};
document.getElementById('modalBg').onclick = closeFollowupModal;
