// Data and login
const users = [
  {username:"sushant", password:"sush@123", role:"user"},
  {username:"gaurav", password:"gaurav@123", role:"user"},
  {username:"yash", password:"yash@123", role:"user"},
  {username:"shikha", password:"shikha@123", role:"user"},
  {username:"tripti", password:"tripti@123", role:"user"},
  {username:"anshi", password:"anshi@123", role:"user"},
  {username:"sem", password:"semops@123", role:"sem"},
  {username:"developer", password:"dev041228", role:"developer"},
], fontUI = "'Manrope','Segoe UI',sans-serif";
let leads = [], followups = [], session_user = null;
function capitalize(str) { return str.slice(0,1).toUpperCase() + str.slice(1); }
function showPopup(msg) {
  const popup = document.getElementById('popup');
  popup.style.display = '';
  document.getElementById('popup-content').textContent = msg;
  setTimeout(()=>{ popup.style.display='none'; }, 1010);
}
function formatDateIST(date) {
  const d = new Date(date);
  return d.toLocaleString('en-IN', {timeZone:'Asia/Kolkata'});
}
function generateId() { return Math.random().toString(36).substr(2,9) + Date.now(); }
// Toggle UI (glass animated)
function crmToggle(el, checked, onChange) {
  el.setAttribute("data-checked", String(checked));
  el.onclick = () => { 
    el.setAttribute("data-checked", String(!JSON.parse(el.getAttribute("data-checked"))));
    onChange && onChange(JSON.parse(el.getAttribute("data-checked")));
  };
}

// LOGIN
function login(e) {
  e.preventDefault();
  const uname = document.getElementById('username').value.trim().toLowerCase();
  const pwd = document.getElementById('password').value;
  const user = users.find(u=>u.username===uname && u.password===pwd);
  if (!user) { showPopup("Incorrect username or password"); return; }
  session_user = {...user};
  showPopup(`Welcome, ${capitalize(session_user.username)}!`);
  document.getElementById('login-screen').style.display='none';
  document.getElementById('main-app').style.display='';
  renderDashboard();
}
function logout() {
  session_user=null;
  document.getElementById('main-app').style.display='none';
  document.getElementById('login-screen').style.display='';
  document.getElementById('username').value='';
  document.getElementById('password').value='';
}

// TAB ROUTING
function renderDashboard() {
  document.getElementById('user-label').innerText = capitalize(session_user.username);
  let tabs=[];
  if (session_user.role==='user') tabs = [
    {label: "User", fn: renderUserTab},
    {label: "Add Lead", fn: renderAddLeadTab},
    {label: "My Leads", fn: renderMyLeadsTab},
  ];
  else if (session_user.role==='sem') tabs = [
    {label: "Add & Assign Lead", fn: renderSemAddAssignLead},
    {label: "All Leads", fn: renderSemAllLeads},
    {label: "Report", fn: renderSemReport},
  ];
  else if (session_user.role==='developer') tabs = [
    {label: "Admin — Users", fn: renderDevUsers},
    {label: "Admin — Leads", fn: renderSemAllLeads},
    {label: "Admin — Report", fn: renderSemReport},
  ];
  // Tab bar
  const tabbar = document.getElementById('tab-bar'); tabbar.innerHTML = '';
  tabs.forEach((tab, i) => {
    let div = document.createElement('div');
    div.className = 'tab'; div.textContent = tab.label;
    div.onclick = () => { selectTab(i); };
    if(i===0) div.classList.add('active');
    tabbar.appendChild(div);
  });
  window.__currTabs = tabs;
  selectTab(0);
}
function selectTab(idx) {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((tab, i) => tab.classList.toggle('active', i===idx));
  document.getElementById('tab-content').innerHTML = '';
  setTimeout(()=>{ window.__currTabs[idx].fn(); }, 60);
}

// USER TAB
function renderUserTab() {
  const userLeads = leads.filter(l=>l.assignedTo===session_user.username);
  const today = new Date().toISOString().substring(0,10);
  const followupDone = followups.filter(f=>f.user===session_user.username && f.status==="done" && f.date.split('T')[0]===today).length;
  const overdue = followups.filter(f=>
    f.user===session_user.username && f.status!=='done' && new Date(f.date)<new Date()
  );
  const reminders = followups.filter(f=>
    f.user===session_user.username && f.status!=='done' && f.date.split('T')[0]===today
  );
  let html = `<div class="card">
    <div class="section-title">User Overview</div>
    <div><b>Name:</b> <span style="font-weight:700">${capitalize(session_user.username)}</span></div>
    <div><b>Leads added:</b> <span style="font-weight:700">${userLeads.length}</span></div>
    <div><b>Follow-up done today:</b> <span style="font-weight:700">${followupDone}</span></div>
    <div style="margin-top:.8em;"><b>Overdue Follow-ups:</b></div>
    <ul>${overdue.map(f=>`<li>${f.leadEventName} &mdash; ${formatDateIST(f.date)}</li>`).join('')||'<li>(none)</li>'}</ul>
    <div style="margin-top:1.2em;"><b>Follow-up reminders for today:</b></div>
    <ul style="padding-left:0;">${
      reminders.length?
        reminders.map(f=>`
          <li style="margin-bottom:.4em;">
            <span style="font-weight:600">${f.leadEventName}</span> &mdash; ${formatDateIST(f.date)}
            <span style="margin-left:14px;vertical-align:middle;">
              <div class="crm-toggle" data-checked="false" id="toggle_fup_${f.id}" style="display:inline-block;vertical-align:middle;"><span></span></div>
              <span class="crm-toggle-label" style="vertical-align:middle;">Mark done</span>
            </span>
          </li>
        `).join(''):'<li>(none)</li>'
    }</ul>
  </div>`;
  document.getElementById('tab-content').innerHTML = html;
  reminders.forEach(f=>{
    let el = document.getElementById(`toggle_fup_${f.id}`);
    crmToggle(el, false, (chkd)=>{ if(chkd) { f.status="done"; showPopup("Marked as done"); renderUserTab(); } });
  });
}
// ADD LEAD (User)
function renderAddLeadTab() {
  const fields = `
    <form class="lead-form" onsubmit="addLead(event)">
      <label>Event Name <input required name="eventName"></label>
      <label>Organising Society <input required name="orgSociety"></label>
      <label>Contact Person <input required name="contactPerson"></label>
      <label>Phone No. <input required name="phone" maxlength="15"></label>
      <label>Email <input type="email" required name="email"></label>
      <label>Lead Stage
        <div class="lead-stage" style="display:flex;gap:.72em;">
          ${["hot","wrm","cld","ni","nre","junk"].map(lv=>
            `<label style="font-family:${fontUI};font-weight:700;">
              <input type="radio" name="leadStage" value="${lv}" required style="vertical-align:middle;">
              <span style="margin-left:4px;">${lv.toUpperCase()}</span>
            </label>`
          ).join('')}
        </div>
      </label>
      <label>Remarks <textarea name="remarks"></textarea></label>
      <label>Followup Date & Time <input type="datetime-local" required name="followup"></label>
      <button class="glass-btn" type="submit">Add Lead</button>
    </form>
  `;
  document.getElementById('tab-content').innerHTML = `<div class="card">${fields}</div>`;
}
function addLead(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const leadId = generateId();
  let lead = {
    id: leadId,
    eventName: fd.get("eventName"),
    orgSociety: fd.get("orgSociety"),
    contactPerson: fd.get("contactPerson"),
    phone: fd.get("phone"),
    email: fd.get("email"),
    leadStage: fd.get("leadStage"),
    remarks: fd.get("remarks"),
    assignedTo: session_user.username,
    dateAdded: new Date().toISOString(),
  };
  leads.push(lead);
  followups.push({
    id: generateId(), user: session_user.username,
    leadId, leadEventName: lead.eventName, date: fd.get("followup"), status: "pending"
  });
  showPopup("Lead Added!");
  renderDashboard();
}
// MY LEADS (search, edit, timepicker, toggles)
function renderMyLeadsTab() {
  let html = `<div class="card">
    <div style="display:flex;align-items:center;gap:2rem;margin-bottom:12px;">
      <span class="section-title" style="font-size:1.11rem;">My Leads</span>
      <input id="lead-search" placeholder="🔍 Search Lead" style="flex:0 0 210px;max-width:220px;padding:.7em 0.65em;border-radius:14px;font-size:1rem;border:1.4px solid #caf1ff99;background:#f7fcff;color:#144566;" oninput="renderMyLeadsTab()">
    </div>
    <div style="overflow-x:auto;">
    <table class="leads-table">
    <tr>
      <th>Event Name</th><th>Society</th><th>Contact</th><th>Phone</th><th>Email</th>
      <th>Lead Stage</th><th>Remarks</th><th>Date Added</th><th>Follow-up</th><th>Actions</th>
    </tr>`;
  let s = document.getElementById('lead-search');
  let query = (s && s.value) ? s.value.trim().toLowerCase() : '';
  let rows = leads.filter(l=>l.assignedTo===session_user.username &&
    (!query || Object.values(l).join(' ').toLowerCase().includes(query))
  ).map(l=>{
    const fups = followups.filter(f=>f.leadId===l.id && f.user===session_user.username)
    .map(f=>
      `<div style="margin-bottom:3px;">
        <input type="datetime-local" style="font-size:.95em;max-width:156px;border-radius:9px;border:1px solid #badefd;background:#f5fcff;" value="${f.date.replace(' ','T').substring(0,16)}"
          onchange="event.stopPropagation(); fupDate('${f.id}',this.value)">
        <div class="crm-toggle" data-checked="${f.status==='done'}" id="toggle_mytab_${f.id}" style="display:inline-block;vertical-align:middle;margin-left:5px;"><span></span></div>
      </div>`
    ).join('');
    return `<tr>
      <td contenteditable="true" onblur="editLead('${l.id}','eventName',this.innerText)">${l.eventName}</td>
      <td contenteditable="true" onblur="editLead('${l.id}','orgSociety',this.innerText)">${l.orgSociety}</td>
      <td contenteditable="true" onblur="editLead('${l.id}','contactPerson',this.innerText)">${l.contactPerson}</td>
      <td contenteditable="true" onblur="editLead('${l.id}','phone',this.innerText)">${l.phone}</td>
      <td contenteditable="true" onblur="editLead('${l.id}','email',this.innerText)">${l.email}</td>
      <td contenteditable="true" onblur="editLead('${l.id}','leadStage',this.innerText)">${l.leadStage}</td>
      <td contenteditable="true" onblur="editLead('${l.id}','remarks',this.innerText)">${l.remarks||''}</td>
      <td>${formatDateIST(l.dateAdded)}</td>
      <td>${fups}
        <button class="followup-btn" style="margin-top:5px;" onclick="addLeadFollowup('${l.id}','${l.eventName}')">+</button>
      </td>
      <td>
        <button class="followup-btn" style="background:#fafbfd;color:#b03e11;" onclick="deleteLead('${l.id}')">Delete</button>
      </td>
    </tr>`;
  }).join('');
  html += (rows||'') + `</table></div></div>`;
  document.getElementById('tab-content').innerHTML = html;
  leads.filter(l=>l.assignedTo===session_user.username)
    .forEach(l=>{followups.filter(f=>f.leadId===l.id && f.user===session_user.username)
    .forEach(f=>crmToggle(document.getElementById(`toggle_mytab_${f.id}`), f.status==="done", (chkd)=>{f.status = chkd ? "done" : "pending"; showPopup("Updated");}));});
}
function addLeadFollowup(leadId,eventName) {
  let dt = prompt("Enter follow-up datetime (YYYY-MM-DDTHH:MM):");
  if(dt && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dt)) {
    followups.push({
      id:generateId(), user:session_user.username, leadId, leadEventName:eventName, date:dt, status:"pending"
    });
    showPopup("Follow-up Added!"); renderMyLeadsTab();
  }
}
function fupDate(fupId,val) {
  let f = followups.find(x=>x.id===fupId);
  if (f) { f.date = val; showPopup("Follow-up date updated."); }
}
function editLead(leadId,field,val) {
  let l = leads.find(l=>l.id===leadId);
  if(l) { l[field] = val; showPopup("Lead updated."); }
}
function deleteLead(leadId) {
  if(confirm("Delete this lead?")) {
    leads = leads.filter(l=>l.id!==leadId);
    followups = followups.filter(f=>f.leadId!==leadId);
    renderMyLeadsTab();
    showPopup("Deleted!");
  }
}
// SEM and Developer (same structure, glass tabs)
function renderSemAddAssignLead() {
  let userOptions = users.filter(u=>u.role==="user").map(u=>`<option value="${u.username}">${capitalize(u.username)}</option>`).join('');
  const fields = `
    <form class="lead-form" onsubmit="semAddLead(event)">
      <label>Event Name <input required name="eventName"></label>
      <label>Organising Society <input required name="orgSociety"></label>
      <label>Contact Person <input required name="contactPerson"></label>
      <label>Phone No. <input required name="phone" maxlength="15"></label>
      <label>Email <input type="email" required name="email"></label>
      <label>Lead Stage
        <div class="lead-stage">
          ${["hot","wrm","cld","ni","nre","junk"].map(lv=>
            `<label style="font-family:${fontUI};font-weight:700;">
              <input type="radio" name="leadStage" value="${lv}" required style="vertical-align:middle;">
              <span style="margin-left:4px;">${lv.toUpperCase()}</span>
            </label>`
          ).join('')}
        </div>
      </label>
      <label>Remarks <textarea name="remarks"></textarea></label>
      <label>Followup date/time <input type="datetime-local" required name="followup"></label>
      <label>Assign to
        <select required name="assignedTo">${userOptions}</select>
      </label>
      <button class="glass-btn" type="submit">Add & Assign Lead</button>
    </form>
  `;
  document.getElementById('tab-content').innerHTML = `<div class="card">${fields}</div>`;
}
function semAddLead(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const leadId = generateId();
  let lead = {
    id:leadId,
    eventName: fd.get("eventName"),
    orgSociety: fd.get("orgSociety"),
    contactPerson: fd.get("contactPerson"),
    phone: fd.get("phone"),
    email: fd.get("email"),
    leadStage: fd.get("leadStage"),
    remarks: fd.get("remarks"),
    assignedTo: fd.get('assignedTo'),
    dateAdded: new Date().toISOString(),
  };
  leads.push(lead);
  followups.push({id: generateId(), user: fd.get('assignedTo'), leadId, leadEventName:lead.eventName, date: fd.get("followup"), status:"pending"});
  showPopup("Lead Added & Assigned!"); renderDashboard();
}
function renderSemAllLeads() {
  let usersList = ["all"].concat(users.filter(u=>u.role==="user").map(u=>u.username));
  let filterUserOptions = usersList.map(u=>`<option value="${u}">${capitalize(u)}</option>`).join('');
  let html = `
    <div class="card">
      <div style="display:flex;align-items:center;gap:1.5rem;">
        <div class="section-title">All Leads</div>
        <select id="filter-user" class="glass" style="padding:0.6rem;">${filterUserOptions}</select>
        <input id="filter-date" type="date" class="glass" style="padding:0.6rem;">
        <button class="glass-btn" onclick="applyLeadFilter()">Filter</button>
      </div>
      <table class="leads-table" id="all-leads-table">
      <tr>
        <th>Event Name</th><th>Society</th><th>Contact</th><th>Phone</th>
        <th>Email</th><th>Lead Stage</th><th>Remarks</th>
        <th>Assigned To</th><th>Date Added</th>
      </tr>
      ${leads.map(l=>
        `<tr>
          <td>${l.eventName}</td><td>${l.orgSociety}</td><td>${l.contactPerson}</td><td>${l.phone}</td>
          <td>${l.email}</td><td>${l.leadStage}</td><td>${l.remarks||''}</td>
          <td>${capitalize(l.assignedTo)}</td>
          <td>${formatDateIST(l.dateAdded)}</td>
        </tr>`
      ).join('')}
      </table>
    </div>
  `;
  document.getElementById('tab-content').innerHTML = html;
}
function applyLeadFilter() {
  let uname=document.getElementById('filter-user').value;
  let dt=document.getElementById('filter-date').value;
  let data = leads;
  if(uname && uname!=='all') data = data.filter(l=>l.assignedTo===uname);
  if(dt) data = data.filter(l=>l.dateAdded.substring(0,10)===dt);
  let tb = document.getElementById('all-leads-table');
  tb.innerHTML = `<tr>
    <th>Event Name</th><th>Society</th><th>Contact</th><th>Phone</th>
    <th>Email</th><th>Lead Stage</th><th>Remarks</th>
    <th>Assigned To</th><th>Date Added</th>
    </tr>` + 
    data.map(l=>
      `<tr>
        <td>${l.eventName}</td><td>${l.orgSociety}</td><td>${l.contactPerson}</td><td>${l.phone}</td>
        <td>${l.email}</td><td>${l.leadStage}</td><td>${l.remarks||''}</td>
        <td>${capitalize(l.assignedTo)}</td>
        <td>${formatDateIST(l.dateAdded)}</td>
      </tr>`
    ).join('');
}
function renderSemReport() {
  let usersList = users.filter(u=>u.role==="user");
  const today = new Date().toISOString().substring(0,10);
  let html = `
    <div class="card">
      <div style="display:flex;align-items:center;gap:1.5rem;">
        <div class="section-title">Report (per user, for today)</div>
        <input id="report-date" type="date" class="glass" style="padding:0.6rem;" value="${today}">
        <button class="glass-btn" onclick="applyReportFilter()">Filter</button>
      </div>
      <table class="report-table" id="report-table">
      <tr>
        <th>User</th>
        <th>No. of Leads</th><th>Follow-ups</th>
      </tr>
      ${usersList.map(u=>{
        const leadsToday = leads.filter(l=>l.assignedTo===u.username && l.dateAdded.substring(0,10)===today).length;
        const flToday = followups.filter(f=>f.user===u.username && f.date.split('T')[0]===today).length;
        return `<tr>
          <td>${capitalize(u.username)}</td>
          <td>${leadsToday}</td>
          <td>${flToday}</td>
        </tr>`;
      }).join('')}
      </table>
    </div>
  `;
  document.getElementById('tab-content').innerHTML = html;
}
function applyReportFilter() {
  let dt = document.getElementById('report-date').value;
  let usersList = users.filter(u=>u.role==="user");
  let tb = document.getElementById('report-table');
  tb.innerHTML = `<tr>
    <th>User</th>
    <th>No. of Leads</th><th>Follow-ups</th>
  </tr>` + 
  usersList.map(u=>{
    const leadsToday = leads.filter(l=>l.assignedTo===u.username && l.dateAdded.substring(0,10)===dt).length;
    const flToday = followups.filter(f=>f.user===u.username && f.date.split('T')[0]===dt).length;
    return `<tr>
      <td>${capitalize(u.username)}</td>
      <td>${leadsToday}</td>
      <td>${flToday}</td>
    </tr>`;
  }).join('');
}
function renderDevUsers() {
  let html = `
    <div class="card">
      <div class="section-title">Admin: User Management</div>
      <table class="report-table">
      <tr><th>User</th><th>Role</th><th>Password (reset)</th></tr>
      ${users.map((u,i)=>`
        <tr>
          <td><input style="width:120px" value="${u.username}" onchange="devSetUsername(${i},this.value)"></td>
          <td>${u.role}</td>
          <td><input style="width:120px" type="password" value="${u.password}" onchange="devSetPassword(${i},this.value)"></td>
        </tr>`).join('')}
      </table>
    </div>
  `;
  document.getElementById('tab-content').innerHTML = html;
}
function devSetUsername(idx,val) { users[idx].username = val.trim().toLowerCase(); showPopup("Username changed."); }
function devSetPassword(idx,val) { users[idx].password = val; showPopup("Password changed."); }
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('main-app').style.display='none';
});
