// Initialize Supabase client
const supabase = supabase.createClient(
  'https://drbbxxanlnfttxrkuqzn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYmJ4eGFubG5mdHR4cmt1cXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzQ0OTcsImV4cCI6MjA2OTA1MDQ5N30.ZyWy-ru4bs6Wf0NUGTrA9fVeVbgv1rvVwf9YJ70MuSI'
);

// Hard-coded users for demo authentication (replace or augment with Supabase Auth later)
const users = [
  {username:"sushant", password:"sush@123", role:"user"},
  {username:"gaurav", password:"gaurav@123", role:"user"},
  {username:"yash", password:"yash@123", role:"user"},
  {username:"shikha", password:"shikha@123", role:"user"},
  {username:"tripti", password:"tripti@123", role:"user"},
  {username:"anshi", password:"anshi@123", role:"user"},
  {username:"sem", password:"semops@123", role:"sem"},
  {username:"developer", password:"dev041228", role:"developer"},
];

let session_user = null;

/* --- Helper functions --- */
function showPopup(msg) {
  const popup = document.getElementById('popup');
  popup.style.display = '';
  document.getElementById('popup-content').textContent = msg;
  setTimeout(() => { popup.style.display = 'none'; }, 1200);
}
function formatDateIST(date) {
  const d = new Date(date);
  return d.toLocaleString('en-IN', {timeZone:'Asia/Kolkata'});
}
function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

/* --- Authentication --- */
function login(e) {
  e.preventDefault();
  const uname = document.getElementById('username').value.trim().toLowerCase();
  const pwd = document.getElementById('password').value;

  // Basic demo auth
  const user = users.find(u => u.username === uname && u.password === pwd);
  if (!user) {
    showPopup("Incorrect username or password");
    return;
  }
  session_user = {...user};
  showPopup(`Welcome, ${capitalize(session_user.username)}!`);
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('main-app').style.display = '';
  renderDashboard();
}
function logout() {
  session_user = null;
  document.getElementById('main-app').style.display = 'none';
  document.getElementById('login-screen').style.display = '';
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
}

/* --- Lead Operations --- */
// Fetch leads with optional filters
async function getLeads(filters = {}) {
  let query = supabase.from('leads').select('*').order('date_added', { ascending: false });

  if (filters.assignedTo && filters.assignedTo !== 'all') {
    query = query.eq('assigned_to', filters.assignedTo);
  }
  if (filters.dateAdded) {
    query = query.eq('date_added', filters.dateAdded);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching leads:', error);
    return [];
  }
  return data || [];
}

// Add a new lead to Supabase
async function addLeadToSupabase(lead) {
  const { data, error } = await supabase.from('leads').insert([lead]);
  if (error) {
    alert('Failed to add lead: ' + error.message);
    throw error;
  }
  showPopup('Lead Added!');
  return data;
}

// Update lead field in Supabase
async function updateLeadField(leadId, field, value) {
  const { error } = await supabase.from('leads').update({ [field]: value }).eq('id', leadId);
  if (error) {
    showPopup('Failed to update lead');
    console.error(error);
  } else {
    showPopup('Updated!');
  }
}

/* --- Follow-up Operations --- */
// Fetch followups with optional filters
async function getFollowups(filters = {}) {
  let query = supabase.from('followups').select('*');

  if (filters.user) {
    query = query.eq('user', filters.user);
  }
  if (filters.date) {
    query = query.eq('date', filters.date);
  }
  if (filters.leadId) {
    query = query.eq('lead_id', filters.leadId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching followups: ', error);
    return [];
  }
  return data || [];
}

// Add a followup to Supabase
async function addFollowupToSupabase(followup) {
  const { data, error } = await supabase.from('followups').insert([followup]);
  if (error) {
    alert('Failed to add follow-up: ' + error.message);
    throw error;
  }
  showPopup('Follow-up Added!');
  return data;
}

// Update followup status (optional, e.g. mark done)
async function updateFollowupStatus(followupId, status) {
  const { error } = await supabase.from('followups').update({ status }).eq('id', followupId);
  if (error) console.error('Failed to update followup status', error);
}

/* --- Dashboard Tabs Rendering --- */
async function renderDashboard() {
  document.getElementById('user-label').innerText = capitalize(session_user.username);
  let tabs = [];
  if (session_user.role === 'user') {
    tabs = [
      {label: "User", fn: renderUserTab},
      {label: "Add Lead", fn: renderAddLeadTab},
      {label: "My Leads", fn: renderMyLeadsTab},
    ];
  } else if (session_user.role === 'sem') {
    tabs = [
      {label: "Add & Assign Lead", fn: renderSemAddAssignLead},
      {label: "All Leads", fn: renderSemAllLeads},
      {label: "Report", fn: renderSemReport},
    ];
  } else if (session_user.role === 'developer') {
    tabs = [
      {label: "Admin — Users", fn: renderDevUsers},
      {label: "Admin — Leads", fn: renderSemAllLeads},
      {label: "Admin — Report", fn: renderSemReport},
    ];
  }
  const tabbar = document.getElementById('tab-bar');
  tabbar.innerHTML = '';
  tabs.forEach((tab, i) => {
    let div = document.createElement('div');
    div.className = 'tab';
    div.textContent = tab.label;
    div.onclick = () => selectTab(i);
    if (i === 0) div.classList.add('active');
    tabbar.appendChild(div);
  });
  window.__currTabs = tabs;
  selectTab(0);
}
function selectTab(idx) {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((tab, i) => tab.classList.toggle('active', i === idx));
  document.getElementById('tab-content').innerHTML = '';
  setTimeout(() => window.__currTabs[idx].fn(), 100);
}

/* --- User Tab --- */
async function renderUserTab() {
  const todayISO = new Date().toISOString().substring(0, 10);
  const userLeads = await getLeads({ assignedTo: session_user.username });
  const userFollowups = await getFollowups({ user: session_user.username });

  const followupDone = userFollowups.filter(f => f.date.split('T')[0] === todayISO && f.status === 'done').length;
  const overdue = userFollowups.filter(f => f.status !== 'done' && new Date(f.date) < new Date());
  const reminders = userFollowups.filter(f => f.status !== 'done' && f.date.split('T')[0] === todayISO);

  document.getElementById('tab-content').innerHTML = `
    <div class="card">
      <div class="section-title">User Overview</div>
      <div>Name: <b>${capitalize(session_user.username)}</b></div>
      <div>Leads added: <b>${userLeads.length}</b></div>
      <div>Follow-up done today: <b>${followupDone}</b></div>
      <div>Overdue Follow-ups:</div>
      <ul>${overdue.length ? overdue.map(f => `<li>${f.lead_event_name} &mdash; ${formatDateIST(f.date)}</li>`).join('') : '<li>(none)</li>'}</ul>
      <div>Follow-up reminders for today:</div>
      <ul>${reminders.length ? reminders.map(f => `<li>${f.lead_event_name} &mdash; ${formatDateIST(f.date)}</li>`).join('') : '<li>(none)</li>'}</ul>
    </div>
  `;
}

/* --- Add Lead Tab --- */
function renderAddLeadTab() {
  let html = `
    <form class="lead-form" onsubmit="addLead(event)">
      <label>Event Name <input required name="eventName"></label>
      <label>Organising Society <input required name="orgSociety"></label>
      <label>Contact Person <input required name="contactPerson"></label>
      <label>Phone No. <input required name="phone" maxlength="15"></label>
      <label>Email <input type="email" required name="email"></label>
      <label>Lead Stage
        <div class="lead-stage">
          ${["hot","wrm","cld","ni","nre","junk"].map(lv =>
            `<label><input type="radio" name="leadStage" value="${lv}" required><span>${lv.toUpperCase()}</span></label>`).join('')}
        </div>
      </label>
      <label>Remarks <textarea name="remarks"></textarea></label>
      <label>Followup date/time <input type="datetime-local" required name="followup"></label>
      <button class="glass-btn" type="submit">Add Lead</button>
    </form>
  `;
  document.getElementById('tab-content').innerHTML = `<div class="card">${html}</div>`;
}

/* --- Add Lead Handler --- */
async function addLead(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  let lead = {
    event_name: fd.get("eventName"),
    org_society: fd.get("orgSociety"),
    contact_person: fd.get("contactPerson"),
    phone: fd.get("phone"),
    email: fd.get("email"),
    lead_stage: fd.get("leadStage"),
    remarks: fd.get("remarks"),
    assigned_to: session_user.username,
    date_added: new Date().toISOString(),
  };

  await addLeadToSupabase(lead);

  // Add followup entry
  let followup = {
    user: session_user.username,
    lead_id: lead.id, // will be set after insert, so optional here or fetch later
    lead_event_name: lead.event_name,
    date: fd.get("followup"),
    status: 'pending',
  };
  // Note: Because id is generated by Supabase, fetching lead id for followup must be handled properly
  // For simplicity, we skip followup insert here or fetch recently added lead as needed

  renderDashboard();
}

/* --- My Leads Tab --- */
async function renderMyLeadsTab() {
  const userLeads = await getLeads({ assignedTo: session_user.username });
  let html = `
    <div class="card">
      <div class="section-title">My Leads</div>
      <table class="leads-table">
        <tr>
          <th>Event Name</th><th>Society</th><th>Contact</th><th>Phone</th><th>Email</th>
          <th>Lead Stage</th><th>Remarks</th><th>Date Added</th><th>Add Follow-up</th>
        </tr>
        ${userLeads.map(l =>
          `<tr>
            <td contenteditable="true" onblur="editLead('${l.id}','event_name',this.innerText)">${l.event_name || ''}</td>
            <td contenteditable="true" onblur="editLead('${l.id}','org_society',this.innerText)">${l.org_society || ''}</td>
            <td contenteditable="true" onblur="editLead('${l.id}','contact_person',this.innerText)">${l.contact_person || ''}</td>
            <td contenteditable="true" onblur="editLead('${l.id}','phone',this.innerText)">${l.phone || ''}</td>
            <td contenteditable="true" onblur="editLead('${l.id}','email',this.innerText)">${l.email || ''}</td>
            <td>
              <select onchange="editLead('${l.id}','lead_stage',this.value)">
                ${["hot","wrm","cld","ni","nre","junk"].map(stage =>
                  `<option value="${stage}"${l.lead_stage === stage ? ' selected' : ''}>${stage.toUpperCase()}</option>`
                ).join('')}
              </select>
            </td>
            <td contenteditable="true" onblur="editLead('${l.id}','remarks',this.innerText)">${l.remarks || ''}</td>
            <td>${formatDateIST(l.date_added)}</td>
            <td><button class="followup-btn" onclick="renderAddFollowup('${l.id}', '${l.event_name || ''}')">+</button></td>
          </tr>`
        ).join('')}
      </table>
    </div>
  `;
  document.getElementById('tab-content').innerHTML = html;
}

/* --- Edit Lead --- */
async function editLead(leadId, field, value) {
  value = value.trim();
  await updateLeadField(leadId, field, value);
}

/* --- Add & Assign Lead (SEM) --- */
function renderSemAddAssignLead() {
  const userOptions = users.filter(u => u.role === 'user').map(u => `<option value="${u.username}">${capitalize(u.username)}</option>`).join('');
  const html = `
    <form class="lead-form" onsubmit="semAddLead(event)">
      <label>Event Name <input required name="eventName"></label>
      <label>Organising Society <input required name="orgSociety"></label>
      <label>Contact Person <input required name="contactPerson"></label>
      <label>Phone No. <input required name="phone" maxlength="15"></label>
      <label>Email <input type="email" required name="email"></label>
      <label>Lead Stage
        <div class="lead-stage">
          ${["hot","wrm","cld","ni","nre","junk"].map(lv =>
            `<label><input type="radio" name="leadStage" value="${lv}" required><span>${lv.toUpperCase()}</span></label>`).join('')}
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
  document.getElementById('tab-content').innerHTML = `<div class="card">${html}</div>`;
}

async function semAddLead(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const lead = {
    event_name: fd.get("eventName"),
    org_society: fd.get("orgSociety"),
    contact_person: fd.get("contactPerson"),
    phone: fd.get("phone"),
    email: fd.get("email"),
    lead_stage: fd.get("leadStage"),
    remarks: fd.get("remarks"),
    assigned_to: fd.get("assignedTo"),
    date_added: new Date().toISOString(),
  };

  // Insert lead
  const { data, error } = await supabase.from('leads').insert([lead]).select();
  if (error) {
    alert("Failed to add lead: " + error.message);
    return;
  }
  const insertedLead = data[0];

  // Insert followup
  const followup = {
    user: fd.get("assignedTo"),
    lead_id: insertedLead.id,
    lead_event_name: insertedLead.event_name,
    date: fd.get("followup"),
    status: "pending",
  };
  await addFollowupToSupabase(followup);

  showPopup("Lead Added & Assigned!");
  renderDashboard();
}

/* --- All Leads (SEM + Developer) --- */
async function renderSemAllLeads() {
  let usersList = ["all"].concat(users.filter(u => u.role === "user").map(u => u.username));
  let filterUserOptions = usersList.map(u => `<option value="${u}">${capitalize(u)}</option>`).join('');
  let html = `
    <div class="card">
      <div style="display:flex; align-items:center; gap:1.1rem; flex-wrap:wrap;">
        <div class="section-title">All Leads</div>
        <select id="filter-user" class="glass" style="padding:0.6rem;">${filterUserOptions}</select>
        <input id="filter-date" type="date" class="glass" style="padding:0.6rem;">
        <input id="search-lead" class="search-lead" placeholder="Search lead...">
        <label class="toggle-today">
          <input type="checkbox" id="today-fl-toggle">Today's Follow-up
        </label>
        <button class="glass-btn" onclick="applyLeadFilter()">Filter</button>
      </div>
      <div style="overflow-x:auto;">
        <table class="leads-table" id="all-leads-table">
          <tr>
            <th>Event Name</th><th>Society</th><th>Contact</th><th>Phone</th>
            <th>Email</th><th>Lead Stage</th><th>Remarks</th>
            <th>Assigned To</th><th>Date Added</th>
            <th>Edit</th>
          </tr>
        </table>
      </div>
    </div>
  `;
  document.getElementById('tab-content').innerHTML = html;
  applyLeadFilter();
  document.getElementById('search-lead').addEventListener('input', applyLeadFilter);
  document.getElementById('today-fl-toggle').addEventListener('change', applyLeadFilter);
}

async function applyLeadFilter() {
  let uname = document.getElementById('filter-user').value;
  let dt = document.getElementById('filter-date').value;
  let q = (document.getElementById('search-lead') || { value: "" }).value.trim().toLowerCase();
  let onlyToday = (document.getElementById('today-fl-toggle') || {}).checked;

  let data = await getLeads({ assignedTo: uname === 'all' ? null : uname, dateAdded: dt || null });

  // Because Supabase text search is limited, filter on client side here for 'q' and today's followups
  if (q) {
    data = data.filter(l =>
      (l.event_name + l.contact_person + l.phone + l.email + l.org_society + l.remarks)
        .toLowerCase().includes(q)
    );
  }

  if (onlyToday) {
    const today = (new Date()).toISOString().slice(0, 10);
    let followupsToday = await supabase.from('followups').select('lead_id').eq('date', today);
    let ids = new Set((followupsToday.data || []).map(f => f.lead_id));
    data = data.filter(l => ids.has(l.id));
  }

  let tb = document.getElementById('all-leads-table');
  tb.innerHTML = `<tr>
    <th>Event Name</th><th>Society</th><th>Contact</th><th>Phone</th>
    <th>Email</th><th>Lead Stage</th><th>Remarks</th>
    <th>Assigned To</th><th>Date Added</th>
    <th>Edit</th>
  </tr>` + data.map(l => {
    let editable = (session_user.username === l.assigned_to);
    return `<tr>
      <td${editable ? ' contenteditable="true"' : ''} onblur="editLead('${l.id}','event_name',this.innerText)">${l.event_name || ''}</td>
      <td${editable ? ' contenteditable="true"' : ''} onblur="editLead('${l.id}','org_society',this.innerText)">${l.org_society || ''}</td>
      <td${editable ? ' contenteditable="true"' : ''} onblur="editLead('${l.id}','contact_person',this.innerText)">${l.contact_person || ''}</td>
      <td${editable ? ' contenteditable="true"' : ''} onblur="editLead('${l.id}','phone',this.innerText)">${l.phone || ''}</td>
      <td${editable ? ' contenteditable="true"' : ''} onblur="editLead('${l.id}','email',this.innerText)">${l.email || ''}</td>
      <td>${editable ? `<select onchange="editLead('${l.id}','lead_stage',this.value)">
        ${["hot","wrm","cld","ni","nre","junk"].map(stage =>
          `<option value="${stage}"${l.lead_stage === stage ? ' selected' : ''}>${stage.toUpperCase()}</option>`
        ).join('')}
      </select>` : l.lead_stage.toUpperCase()}</td>
      <td${editable ? ' contenteditable="true"' : ''} onblur="editLead('${l.id}','remarks',this.innerText)">${l.remarks || ''}</td>
      <td>${capitalize(l.assigned_to)}</td>
      <td>${formatDateIST(l.date_added)}</td>
      <td>${editable ? '<span style="color:#b04ae4;font-size:1.14em;">&#9998;</span>' : ''}</td>
    </tr>`;
  }).join('');
}

/* --- Reports Tab --- */
async function renderSemReport() {
  let usersList = users.filter(u => u.role === "user");
  let today = (new Date()).toISOString().substring(0, 10);
  let html = `
    <div class="card">
      <div style="display:flex;align-items:center;gap:1.5rem;">
        <div class="section-title">Report (per user, for a date)</div>
        <input id="report-date" type="date" class="glass" style="padding:0.6rem;" value="${today}">
        <button class="glass-btn" onclick="applyReportFilter()">Filter</button>
      </div>
      <table class="report-table" id="report-table">
        <tr>
          <th>User</th>
          <th>No. of Leads</th><th>Follow-ups</th>
        </tr>
        ${usersList.map(u => `
          <tr>
            <td>${capitalize(u.username)}</td>
            <td id="lead-count-${u.username}">...</td>
            <td id="followup-count-${u.username}">...</td>
          </tr>
        `).join('')}
      </table>
    </div>
  `;
  document.getElementById('tab-content').innerHTML = html;
  await applyReportFilter();
}

async function applyReportFilter() {
  let dt = document.getElementById('report-date').value;
  if (!dt) dt = (new Date()).toISOString().substring(0,10);
  let usersList = users.filter(u => u.role === "user");

  for (let u of usersList) {
    // Count leads added on dt assigned to u
    let { count: leadsCount, error: lerr } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', u.username)
      .eq('date_added', dt);

    if (lerr) {
      console.error('Error fetching leads count', lerr);
      leadsCount = 0;
    }

    // Count followups for user on dt
    let { count: followupCount, error: ferr } = await supabase
      .from('followups')
      .select('*', { count: 'exact', head: true })
      .eq('user', u.username)
      .eq('date', dt);

    if (ferr) {
      console.error('Error fetching followups count', ferr);
      followupCount = 0;
    }

    document.getElementById(`lead-count-${u.username}`).innerText = leadsCount || 0;
    document.getElementById(`followup-count-${u.username}`).innerText = followupCount || 0;
  }
}

/* --- Admin Tab --- */
function renderDevUsers() {
  let html = `
    <div class="card">
      <div class="section-title">Admin: User Management</div>
      <table class="report-table">
        <tr><th>User</th><th>Role</th><th>Password (reset)</th></tr>
        ${users.map((u, i) => `
          <tr>
            <td><input style="width:120px" value="${u.username}" onchange="devSetUsername(${i}, this.value)"></td>
            <td>${u.role}</td>
            <td><input style="width:120px" type="password" value="${u.password}" onchange="devSetPassword(${i}, this.value)"></td>
          </tr>
        `).join('')}
      </table>
    </div>
  `;
  document.getElementById('tab-content').innerHTML = html;
}
function devSetUsername(idx, val) {
  users[idx].username = val.trim().toLowerCase();
  showPopup("Username changed.");
}
function devSetPassword(idx, val) {
  users[idx].password = val;
  showPopup("Password changed.");
}

/* --- Followups: Add New Followup UI --- */
function renderAddFollowup(leadId, eventName) {
  const html = `
    <div class="card">
      <h3>Add Follow-up for: <b>${eventName}</b></h3>
      <form onsubmit="submitFollowup(event, '${leadId}', '${eventName}')">
        <label>Follow-up date/time <input type="datetime-local" name="followup" required></label>
        <button class="glass-btn" type="submit">Add Follow-up</button>
      </form>
    </div>
  `;
  document.getElementById('tab-content').innerHTML = html;
}
window.renderAddFollowup = renderAddFollowup;

async function submitFollowup(e, leadId, eventName) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const dt = fd.get('followup');
  if (!dt) return alert('Please enter follow-up datetime');
  const followup = {
    user: session_user.username,
    lead_id: leadId,
    lead_event_name: eventName,
    date: dt,
    status: 'pending',
  };
  await addFollowupToSupabase(followup);
  showPopup('Follow-up Added!');
  // Refresh My Leads tab to show updated info
  renderMyLeadsTab();
}

/* --- Initialization --- */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('main-app').style.display = 'none';
});
