// Initialize Supabase client
const supabase = supabase.createClient(
  'https://drbbxxanlnfttxrkuqzn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYmJ4eGFubG5mdHR4cmt1cXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzQ0OTcsImV4cCI6MjA2OTA1MDQ5N30.ZyWy-ru4bs6Wf0NUGTrA9fVeVbgv1rvVwf9YJ70MuSI'
);

// Hardcoded users for demo auth (consider using Supabase Auth for production)
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

let followups = []; // Optionally implement followups on Supabase in similar manner if you have table
let session_user = null;

/* --- Helper Functions --- */
function showPopup(msg) {
  const popup = document.getElementById('popup');
  popup.style.display = '';
  document.getElementById('popup-content').textContent = msg;
  setTimeout(() => { popup.style.display = 'none'; }, 1000);
}
function formatDateIST(date) {
  const d = new Date(date);
  return d.toLocaleString('en-IN', {timeZone:'Asia/Kolkata'});
}
function capitalize(str) {
  return str.slice(0,1).toUpperCase() + str.slice(1);
}

/* --- Authentication --- */
function login(e) {
  e.preventDefault();
  const uname = document.getElementById('username').value.trim().toLowerCase();
  const pwd = document.getElementById('password').value;

  // Basic auth with demo users (replace with Supabase Auth if needed)
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

/* --- Supabase Data Operations for Leads --- */
// Fetch leads with optional filters
async function getLeads(filters = {}) {
  let query = supabase.from('leads').select('*').order('date_added', { ascending: false });

  if (filters.assignedTo && filters.assignedTo !== 'all') {
    query = query.eq('assigned_to', filters.assignedTo);
  }
  if (filters.dateAdded) {
    query = query.eq('date_added', filters.dateAdded);
  }
  // Filtering by text query is done client-side below due to limited LIKE support

  let { data, error } = await query;
  if (error) {
    console.error('Error fetching leads:', error);
    return [];
  }
  return data || [];
}

// Add new lead to Supabase
async function addLeadToSupabase(lead) {
  let { data, error } = await supabase.from('leads').insert([lead]);
  if (error) {
    alert('Failed to add lead: ' + error.message);
    throw error;
  }
  showPopup('Lead Added!');
  return data;
}

// Update lead field in Supabase
async function updateLeadField(leadId, field, value) {
  let { error } = await supabase.from('leads').update({ [field]: value }).eq('id', leadId);
  if (error) {
    showPopup('Failed to update lead');
    console.error(error);
  } else {
    showPopup('Updated!');
  }
}

/* --- Dashboard and Tabs Rendering --- */
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
  // For demo, keep followups in-memory or extend to fetch from Supabase (not shown here)
  const today = new Date().toISOString().substring(0, 10);
  // Fetch user's leads
  const userLeads = await getLeads({assignedTo: session_user.username});
  // Filter followups from in-memory array for demo
  const followupDone = followups.filter(f => f.user === session_user.username && f.date.split('T')[0] === today).length;
  const overdue = followups.filter(f => f.user === session_user.username && f.status !== 'done' && new Date(f.date) < new Date());
  const reminders = followups.filter(f => f.user === session_user.username && f.status !== 'done' && f.date.split('T')[0] === today);

  document.getElementById('tab-content').innerHTML = `
    <div class="card">
      <div class="section-title">User Overview</div>
      <div>Name: <b>${capitalize(session_user.username)}</b></div>
      <div>Leads added: <b>${userLeads.length}</b></div>
      <div>Follow-up done today: <b>${followupDone}</b></div>
      <div>Overdue Follow-ups:</div>
      <ul>${overdue.map(f => `<li>${f.leadEventName} &mdash; ${formatDateIST(f.date)}</li>`).join('') || '<li>(none)</li>'}</ul>
      <div>Follow-up reminders for today:</div>
      <ul>${reminders.map(f => `<li>${f.leadEventName} &mdash; ${formatDateIST(f.date)}</li>`).join('') || '<li>(none)</li>'}</ul>
    </div>
  `;
}

/* --- Add Lead Tab --- */
function renderAddLeadTab() {
  const fields = `
    <form class="lead-form" onsubmit="addLead(event)">
      <label>Event Name <input required name="eventName"></label>
      <label>Organising Society <input required name="orgSociety"></label>
      <label>Contact Person <input required name="contactPerson"></label>
      <label>Phone No. <input required name="phone" maxlength="15"></label>
      <label>Email <input type="email" required name="email"></label>
      <label>Lead Stage
        <div class="lead-stage">
          ${["hot","wrm","cld","ni","nre","junk"].map(lv =>
            `<label><input type="radio" name="leadStage" value="${lv}" required><span>${lv.toUpperCase()}</span></label>`
          ).join('')}
        </div>
      </label>
      <label>Remarks <textarea name="remarks"></textarea></label>
      <label>Followup date/time <input type="datetime-local" required name="followup"></label>
      <button class="glass-btn" type="submit">Add Lead</button>
    </form>
  `;
  document.getElementById('tab-content').innerHTML = `<div class="card">${fields}</div>`;
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
    date_added: new Date().toISOString()
  };

  await addLeadToSupabase(lead);

  // Optionally create a followup record similar way if you implement followups in Supabase

  renderDashboard();
}

/* --- My Leads Tab --- */
async function renderMyLeadsTab() {
  const userLeads = await getLeads({assignedTo: session_user.username});
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
          <td><button class="followup-btn" onclick="addFollowup('${l.id}','${(l.event_name || '')}')">+</button></td>
        </tr>`
      ).join('')}
      </table>
    </div>
  `;
  document.getElementById('tab-content').innerHTML = html;
}

/* --- Edit Lead Handler --- */
async function editLead(leadId, field, val) {
  await updateLeadField(leadId, field, val);
}

/* --- Add Followup Handler (uses prompt, no Supabase sync here) --- */
function addFollowup(leadId, eventName) {
  const dt = prompt("Enter follow-up datetime (YYYY-MM-DDTHH:MM):", (new Date().toISOString().slice(0,16)));
  if(dt && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dt)) {
    followups.push({id: generateId(), user: session_user.username, leadId, leadEventName: eventName, date: dt, status: "pending"});
    showPopup("Follow-up Added!");
    renderMyLeadsTab();
  }
}

/* ------- SEM Role Tabs and Admin Functions --------- */
/* Please implement SEM tabs and Admin renderers similarly, fetching and updating Supabase data */
/* For brevity, their implementations are not rewritten here but follow same async pattern */

/* --- Initialization --- */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('main-app').style.display = 'none';
});
