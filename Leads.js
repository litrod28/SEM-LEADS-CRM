// ================================
// --- CRM PORTAL SEM LOGIC ---
// ================================

// --- USERS/ROLE/PASSWORD DATA ---
// You can change user/passwords here.
const USERS = [
  {username: "sushant", pw: "sush@123", role: "user"},
  {username: "gaurav", pw: "gaurav@123", role: "user"},
  {username: "yash", pw: "yash@123", role: "user"},
  {username: "shikha", pw: "shikha@123", role: "user"},
  {username: "tripti", pw: "tripti@123", role: "user"},
  {username: "anshi", pw: "anshi@123", role: "user"},
  {username: "sem", pw: "semops@123", role: "sem"},
  {username: "developer", pw: "dev041228", role: "developer"},
];

// --- DATA STORAGE KEYS ---
const LEADS_KEY = "crmleads";
const FOLLOWUPS_KEY = "crmfollowups";

// --- STATE ---
let CURRENT_USER = null;
let allLeads = [];
let allFollowUps = [];

// --- UTILS ---
function getTodayISO() {
  let d = new Date();
  const tzoffset = d.getTimezoneOffset() * 60000;
  return (new Date(d.getTime() - tzoffset)).toISOString().split("T")[0];
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function getUserList(excludeRoles=[]) {
  return USERS.filter(u => !excludeRoles.includes(u.role));
}
function saveLeads() {
  localStorage.setItem(LEADS_KEY, JSON.stringify(allLeads));
}
function loadLeads() {
  const data = localStorage.getItem(LEADS_KEY);
  allLeads = data ? JSON.parse(data) : [];
}
function saveFollowUps() {
  localStorage.setItem(FOLLOWUPS_KEY, JSON.stringify(allFollowUps));
}
function loadFollowUps() {
  const data = localStorage.getItem(FOLLOWUPS_KEY);
  allFollowUps = data ? JSON.parse(data) : [];
}

// --- UI HELPERS ---
function logout() {
  CURRENT_USER = null;
  sessionStorage.clear();
  document.getElementById("loginPage").style.display = "block";
  document.getElementById("userNameBadge").innerText = "";
  hideAllTabs();
}
function showWelcomePopup(msg, isError) {
  const p = document.getElementById("welcomePopup");
  p.innerText = msg;
  p.style.background = isError ? "#ff3e6eeb" : "rgba(60,186,255,0.32)";
  p.style.color = isError ? "#fff" : "#034574";
  p.classList.add("active");
  setTimeout(() => {
    p.classList.remove("active");
  }, 1000);
}
function hideAllTabs() {
  [
    "userTab", "addLeadTab", "myLeadsTab", "addAssignLeadTab",
    "allLeadsTab", "reportTab", "superAdminTab",
  ].forEach(id => {
    document.getElementById(id).style.display = "none";
  });
  [
    "tabUser", "tabAddLead", "tabMyLeads", "tabAddAssignLead",
    "tabAllLeads", "tabReport", "tabSuperAdmin"
  ].forEach(id => {
    document.getElementById(id).style.display = "none";
    document.getElementById(id)?.classList.remove("active-tab");
  });
}
function changeTab(tabId) {
  [
    "userTab", "addLeadTab", "myLeadsTab", "addAssignLeadTab",
    "allLeadsTab", "reportTab", "superAdminTab",
  ].forEach(id => {
    document.getElementById(id).style.display = (id === tabId ? "block" : "none");
    const tabBtn = document.getElementById(
      "tab" + id.charAt(0).toUpperCase() + id.slice(1, -3)
    );
    if (tabBtn) tabBtn.classList.toggle("active-tab", id === tabId);
  });
}

function showUserTabs(role) {
  // user, sem, developer
  const visibleTabs = {
    user: ["tabUser", "tabAddLead", "tabMyLeads"],
    sem: ["tabAddAssignLead", "tabAllLeads", "tabReport"],
    developer: ["tabAddAssignLead", "tabAllLeads", "tabReport", "tabSuperAdmin"]
  }[role];
  hideAllTabs();
  if (!visibleTabs) return;
  visibleTabs.forEach(id => {
    document.getElementById(id).style.display = "block";
  });
  // Default to first visible
  changeTab(visibleTabs[0].replace(/^tab/, "").toLowerCase() + "Tab");
}

// --- LOGIN FORM HANDLING ---
document.getElementById("loginForm").onsubmit = function (e) {
  e.preventDefault();
  const uname = document.getElementById("username").value.trim().toLowerCase();
  const pw = document.getElementById("password").value;
  const user = USERS.find(u => u.username === uname && u.pw === pw);
  if (user) {
    CURRENT_USER = user;
    sessionStorage.setItem("user", JSON.stringify(user));
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("userNameBadge").innerText = capitalize(uname);
    showUserTabs(user.role);
    showWelcomePopup("Welcome, " + capitalize(uname) + "!");
    refreshAllTabs();
  } else {
    showWelcomePopup("Login Failed!", true);
  }
  return false;
};
document.getElementById("logoutBtn").onclick = logout;

// --- ON PAGE LOAD: USER AUTO RELOGIN if possible ---
window.addEventListener("DOMContentLoaded", () => {
  loadLeads();
  loadFollowUps();
  const session = sessionStorage.getItem("user");
  if (session) {
    CURRENT_USER = JSON.parse(session);
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("userNameBadge").innerText = capitalize(CURRENT_USER.username);
    showUserTabs(CURRENT_USER.role);
    refreshAllTabs();
  }
  // Fill assign-to dropdown for SEM/DEV
  const assignTo = document.getElementById("assignTo");
  assignTo.innerHTML = getUserList(["sem", "developer"])
    .map(u => `<option value="${u.username}">${capitalize(u.username)}</option>`)
    .join("");
  // Fill user filter for AllLeads/Report
  document.getElementById("filterUser").innerHTML =
    `<option value="">All Users</option>` +
    getUserList(["sem", "developer"])
      .map(u => `<option value="${u.username}">${capitalize(u.username)}</option>`)
      .join("");
});

// --- Tab Switching ----
document.getElementById("tabUser").onclick = () => { changeTab("userTab"); refreshUserTab(); };
document.getElementById("tabAddLead").onclick = () => { changeTab("addLeadTab"); };
document.getElementById("tabMyLeads").onclick = () => { changeTab("myLeadsTab"); refreshMyLeads(); };
document.getElementById("tabAddAssignLead").onclick = () => { changeTab("addAssignLeadTab"); };
document.getElementById("tabAllLeads").onclick = () => { changeTab("allLeadsTab"); refreshAllLeads(); };
document.getElementById("tabReport").onclick = () => { changeTab("reportTab"); refreshReport(); };
document.getElementById("tabSuperAdmin").onclick = () => { changeTab("superAdminTab"); };

// --- LEAD FORMAT: {
//    id, eventName, organisingSociety, contactPerson, phone, email,
//    leadStage, remarks, followupDate, user, dateAdded, assignedBy
//  }
// --- FOLLOWUP FORMAT: {id, leadId, who, date, done, note}

// --- ADD LEAD: USER ---
document.getElementById("addLeadForm").onsubmit = function (e) {
  e.preventDefault();
  if (!CURRENT_USER) return;
  const fd = new FormData(this);
  const newLead = {
    id: Date.now().toString(),
    eventName: fd.get("eventName"),
    organisingSociety: fd.get("organisingSociety"),
    contactPerson: fd.get("contactPerson"),
    phone: fd.get("phone"),
    email: fd.get("email"),
    leadStage: fd.get("leadStage"),
    remarks: fd.get("remarks"),
    followupDate: fd.get("followupDate"),
    user: CURRENT_USER.username,
    dateAdded: getTodayISO(),
    assignedBy: CURRENT_USER.username
  };
  allLeads.push(newLead);
  saveLeads();
  showWelcomePopup("Lead Added!");
  this.reset();
  refreshUserTab();
};

// --- ADD/ASSIGN LEAD: SEM/DEVELOPER ---
document.getElementById("assignLeadForm").onsubmit = function (e) {
  e.preventDefault();
  if (!CURRENT_USER) return;
  const fd = new FormData(this);
  const newLead = {
    id: Date.now().toString(),
    eventName: fd.get("eventName"),
    organisingSociety: fd.get("organisingSociety"),
    contactPerson: fd.get("contactPerson"),
    phone: fd.get("phone"),
    email: fd.get("email"),
    leadStage: fd.get("leadStage"),
    remarks: fd.get("remarks"),
    followupDate: fd.get("followupDate"),
    user: fd.get("assignTo"),
    dateAdded: getTodayISO(),
    assignedBy: CURRENT_USER.username
  };
  allLeads.push(newLead);
  saveLeads();
  showWelcomePopup("Lead Assigned!");
  this.reset();
  refreshAllLeads();
  refreshReport();
};

// ============== USER TAB LOGIC (DASHBOARD) =========
function refreshUserTab() {
  if (!CURRENT_USER) return;
  const username = CURRENT_USER.username;
  const leads = allLeads.filter(lead => lead.user === username);
  document.getElementById("leadCount").textContent = leads.length;
  // Follow-ups Due today (reminders)
  const today = getTodayISO();
  const followupsToday = leads.filter(ld =>
    ld.followupDate && ld.followupDate === today
  );
  document.getElementById("todayFollowUpCount").textContent = followupsToday.length;
  // Overdue = previous followups not done (date < today)
  const overdue = leads.filter(ld =>
    ld.followupDate &&
    ld.followupDate < today &&
    !didCompleteFollowup(ld.id, ld.followupDate, username)
  );
  document.getElementById("overdueCount").textContent = overdue.length;
  // Reminders list
  const ul = document.getElementById("todayFollowUpsList");
  ul.innerHTML = followupsToday.map(ld =>
    `<li>${ld.eventName} – <small>${ld.contactPerson}</small></li>`
  ).join("");
}
function didCompleteFollowup(leadId, date, who) {
  return allFollowUps.some(f =>
    f.leadId === leadId && f.date === date && f.who === who && f.done
  );
}

// ============= MY LEADS TAB LOGIC ===============
function refreshMyLeads() {
  if (!CURRENT_USER) return;
  const leads = allLeads.filter(lead => lead.user === CURRENT_USER.username);
  const list = document.getElementById("myLeadsList");
  if (leads.length === 0) {
    list.innerHTML = "<em>No leads added yet.</em>";
    return;
  }
  list.innerHTML = leads.map(ld =>
    `<div class="lead-list-item">
      <div>
        <b>${ld.eventName}</b> (${ld.leadStage})<br>
        <small>${ld.organisingSociety} | ${ld.contactPerson} | ${ld.phone}</small><br>
        <small>${ld.email}</small><br>
        Remarks: <i>${ld.remarks}</i><br>
        <small>Follow-up: <b>${ld.followupDate || "No date"}</b>, Added: ${ld.dateAdded}</small>
      </div>
      <button onclick="addFollowUpPrompt('${ld.id}')" style="margin-left:10px" class="add-btn">Add Follow-up</button>
    </div>`
  ).join("");
}

// == FOLLOW-UP PROMPT/ADD (simple modal) ==
function addFollowUpPrompt(leadId) {
  const note = prompt("Follow-up remarks (optional):");
  if (note === null) return;
  allFollowUps.push({
    id: Date.now().toString(),
    leadId,
    who: CURRENT_USER.username,
    date: getTodayISO(),
    done: true,
    note: note || ""
  });
  saveFollowUps();
  showWelcomePopup("Follow-up added!");
  refreshUserTab();
  refreshMyLeads();
}

// ============= SEM/ALL LEADS TAB LOGIC ===============
function refreshAllLeads() {
  loadLeads();
  let leads = [...allLeads];
  // Filters
  const searchVal = document.getElementById("searchLeadAll").value.trim().toLowerCase();
  if (searchVal) {
    leads = leads.filter(ld =>
      [
        ld.eventName, ld.organisingSociety, ld.contactPerson, ld.email
      ].some(field => field && field.toLowerCase().includes(searchVal))
    );
  }
  const userVal = document.getElementById("filterUser").value;
  if (userVal) {
    leads = leads.filter(ld => ld.user === userVal);
  }
  const dateVal = document.getElementById("filterDate").value;
  if (dateVal) {
    leads = leads.filter(ld => ld.dateAdded === dateVal);
  }
  // List output
  const el = document.getElementById("allLeadsList");
  el.innerHTML = leads.length ? leads.map(ld =>
    `<div class="lead-list-item">
      <div>
        <b>${ld.eventName}</b> (<i>${ld.leadStage}</i>)<br>
        <span>${ld.organisingSociety} | ${ld.contactPerson} | ${ld.phone} | ${ld.email}</span><br>
        Remarks: <i>${ld.remarks || ""}</i><br>
        Follow-up: <b>${ld.followupDate || "None"}</b><br>
        Assigned: <b>${capitalize(ld.user)}</b> by <span>${capitalize(ld.assignedBy)}</span> | Date Added: ${ld.dateAdded}
      </div>
    </div>`
  ).join("") : "<em>No leads found.</em>";
}
// --- AllLeads Filter events ---
document.getElementById("searchLeadAll").oninput =
  document.getElementById("filterUser").onchange =
  document.getElementById("filterDate").onchange = refreshAllLeads;

// ================== REPORT TAB LOGIC ===================
function refreshReport() {
  // Show users, their lead and follow-up count, for today or selected filter
  loadLeads(); loadFollowUps();
  const ulist = getUserList(["sem", "developer"]);
  const date = document.getElementById("reportDate").value || getTodayISO();
  let html = "";
  ulist.forEach(u => {
    const leadsCount = allLeads.filter(ld => ld.user === u.username && ld.dateAdded === date).length;
    const follCount = allFollowUps.filter(f =>
      f.who === u.username && f.date === date && f.done
    ).length;
    html += `<tr>
      <td>${capitalize(u.username)}</td>
      <td>${leadsCount}</td>
      <td>${follCount}</td>
      <td>${leadsCount + follCount}</td>
    </tr>`;
  });
  document.getElementById("reportTableBody").innerHTML = html;
}
document.getElementById("reportDate").onchange = refreshReport;

// ================== SUPER ADMIN PANEL =====================
// Demo: allow editing users/roles/passwords/tab names/popups
if(document.getElementById("superAdminTab")) {
  document.getElementById("superAdminTab").innerHTML += `
    <div style="margin:20px 0">
      <h3>User Manager</h3>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr><th>Username</th><th>Role</th><th>Password</th><th>Edit</th></tr>
        </thead>
        <tbody id="superAdminUsers"></tbody>
      </table>
    </div>
    <div style="margin:20px 0">
      <h3>Tab Renaming</h3>
      <label>Rename Tab: 
        <select id="tabSelectForRename">
          <option value="tabUser">User</option>
          <option value="tabAddLead">Add Lead</option>
          <option value="tabMyLeads">My Leads</option>
          <option value="tabAddAssignLead">Add & Assign Lead</option>
          <option value="tabAllLeads">All Leads</option>
          <option value="tabReport">Report</option>
          <option value="tabSuperAdmin">Super Admin Panel</option>
        </select>
      </label>
      <input type="text" id="newTabName" style="width:200px" placeholder="New Tab Name" />
      <button class="add-btn" onclick="renameTab()">Rename</button>
    </div>
  `;
  // User edit table
  function refreshSuperAdminUsers() {
    const tbody = document.getElementById("superAdminUsers");
    tbody.innerHTML = USERS.map((u, i) =>
      `<tr>
        <td>${capitalize(u.username)}</td>
        <td>
          <select id="role_${i}">
            <option value="user"${u.role==="user"?" selected":""}>user</option>
            <option value="sem"${u.role==="sem"?" selected":""}>sem</option>
            <option value="developer"${u.role==="developer"?" selected":""}>developer</option>
          </select>
        </td>
        <td>
          <input type="text" id="pw_${i}" value="${u.pw}" style="width:110px" />
        </td>
        <td>
          <button class="add-btn" style="padding:3px 18px" onclick="editUser(${i})">Save</button>
        </td>
      </tr>`
    ).join("");
  }
  window.editUser = function(idx) {
    USERS[idx].pw = document.getElementById("pw_"+idx).value;
    USERS[idx].role = document.getElementById("role_"+idx).value;
    alert("User updated!");
    refreshSuperAdminUsers();
  }
  window.renameTab = function() {
    const sel = document.getElementById("tabSelectForRename").value;
    const val = document.getElementById("newTabName").value;
    if(sel && val) {
      document.getElementById(sel).innerText = val;
      alert("Tab renamed.");
    }
  }
}

// ========== REFRESH FOR ALL == (per tab switch or login)
function refreshAllTabs() {
  if (!CURRENT_USER) return;
  refreshUserTab();
  refreshMyLeads();
  refreshAllLeads();
  refreshReport();
  if (CURRENT_USER.role === "developer") refreshSuperAdminUsers();
}

// Make addFollowUpPrompt globally accessible
window.addFollowUpPrompt = addFollowUpPrompt;

// End of JS
