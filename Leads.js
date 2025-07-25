// === Toast helper ===
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

// User list from localStorage or default
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

// Leads from localStorage or default
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

function isDeveloper() {
  return currentUser === 'developer';
}

// Login flow
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

// Dashboard & Tabs
function setActiveTab(userTabs, activeTab) {
  userTabs.querySelectorAll('button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === activeTab);
    btn.setAttribute('aria-selected', btn.dataset.tab === activeTab ? 'true' : 'false');
  });
}

function renderUserTabs() {
  const userTabs = document.getElementById('user-tabs');
  userTabs.innerHTML = '';

  let tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'all-leads', label: 'All Leads' },
  ];
  tabs.forEach(({ id, label }) => {
    let btn = document.createElement('button');
    btn.textContent = label;
    btn.dataset.tab = id;
    btn.className = 'glass-tab-btn';
    btn.setAttribute('role', 'tab');
    btn.onclick = () => {
      setActiveTab(userTabs, id);
      renderTabContent(id);
    };
    userTabs.appendChild(btn);
  });
  // Activate "Dashboard" by default
  setActiveTab(userTabs, 'dashboard');
}

function renderTabContent(tabId) {
  const container = document.getElementById('tab-content-panels');
  container.innerHTML = '';
  if (tabId === 'dashboard') {
    container.appendChild(createAddLeadPanel());
    container.appendChild(createTodaysFollowupsPanel());
    container.appendChild(createUserLeadsPanel());
  } else if (tabId === 'all-leads') {
    container.appendChild(createAllLeadsPanel());
  }
}

// Add Lead Form Panel
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

  const labelRemarks = document.createElement('label');
  labelRemarks.setAttribute('for', 'leadRemarks');
  labelRemarks.textContent = 'Remarks';
  form.appendChild(labelRemarks);

  const textareaRemarks = document.createElement('textarea');
  textareaRemarks.id = 'leadRemarks';
  textareaRemarks.name = 'leadRemarks';
  textareaRemarks.rows = 2;
  form.appendChild(textareaRemarks);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Add Lead';
  form.appendChild(submitBtn);

  form.onsubmit = leadFormSubmitHandler;

  panel.appendChild(form);
  return panel;
}

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

window.markFollowupDone = (leadIdx, fIdx) => {
  if (leads[leadIdx].followups[fIdx].done) return showToast('Already marked done.', false);
  if (!confirm('Mark this follow-up as done?')) return;
  leads[leadIdx].followups[fIdx].done = true;
  saveLeads();
  renderTodayFollowups(document.getElementById('calendar-list'));
  showToast('Marked done.', true);
};

// User leads panel with follow-up controls
function createUserLeadsPanel() {
  const panel = document.createElement('section');
  panel.className = 'glass-panel';
  panel.setAttribute('aria-label', 'Your Leads');

  const h2 = document.createElement('h2');
  h2.textContent = 'Your Leads';
  h2.className = 'tab-section-title';
  panel.appendChild(h2);

  const container = document.createElement('div');
  container.id = 'userLeadsList';
  panel.appendChild(container);

  renderUserLeads(container);

  return panel;
}

function renderUserLeads(container) {
  let userLeads = leads.filter(l => (currentUser.toLowerCase() === 'sem') ? true : l.addedBy === currentUser);
  if (userLeads.length === 0) {
    container.innerHTML = '<em>No leads added yet.</em>';
    return;
  }
  let html = `<table aria-label="Leads table">
    <thead><tr>
    <th>Event Name</th>
    <th>Email</th>
    <th>Phone</th>
    <th>Designation</th>
    <th>Society</th>
    <th>Category</th>
    <th>Remarks</th>
    <th>Added On</th>
    <th>Follow-ups</th>
    </tr></thead><tbody>`;
  userLeads.forEach((lead, i) => {
    html += `<tr>
      <td>${lead.eventName}</td>
      <td>${lead.email}</td>
      <td>${lead.phone}</td>
      <td>${lead.designation}</td>
      <td>${lead.organisingSociety}</td>
      <td><span class="tag ${lead.category.split(' ')[0]}">${lead.category}</span></td>
      <td>${lead.remarks || '-'}</td>
      <td>${new Date(lead.addedOn).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
      <td>
        ${lead.followups?.length || 0}
        <button type="button" onclick="openFollowupModal(${leads.indexOf(lead)})" aria-label="Add follow up to ${lead.eventName}">➕ Add</button>
        <br>
        ${(lead.followups || []).map((f, idx) => {
          let canDelete = (currentUser.toLowerCase() === 'sem' || lead.addedBy === currentUser);
          return `<div style="font-size:13px;padding:4px 0;">
            📆 ${new Date(f.datetime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}<br>
            <span style="color:#444;">${f.remark}</span>
            <span style="color:${f.done ? '#26b361' : '#d0021b'};font-weight:bold;">[${f.done ? 'Done' : 'Pending'}]</span>
            ${canDelete ? `<button type="button" onclick="deleteFollowup(${leads.indexOf(lead)}, ${idx})" title="Delete follow-up" style="font-size:11px; margin-left:6px;">🗑️</button>` : ''}
          </div>`;
        }).join('')}
      </td>
    </tr>`;
  });
  html += '</tbody></table>';

  container.innerHTML = html;
}

window.deleteFollowup = function(leadIdx, fIdx) {
  const lead = leads[leadIdx];
  if (!lead) return;
  if (!(currentUser.toLowerCase() === 'sem' || lead.addedBy === currentUser)) {
    showToast('Not authorized', false);
    return;
  }
  if (!confirm('Delete this follow-up?')) return;
  lead.followups.splice(fIdx, 1);
  saveLeads();
  renderUserLeads(document.getElementById('userLeadsList'));
  showToast('Follow-up deleted!');
};

// All Leads tab panel
function createAllLeadsPanel() {
  const panel = document.createElement('section');
  panel.className = 'glass-panel';
  panel.setAttribute('aria-label', 'All Leads');

  const h2 = document.createElement('h2');
  h2.textContent = 'All Leads';
  h2.className = 'tab-section-title';
  panel.appendChild(h2);

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.id = 'allSearchLead';
  searchInput.placeholder = 'Search leads...';
  searchInput.style.marginBottom = '10px';
  searchInput.style.padding = '8px 10px';
  searchInput.style.fontSize = '1rem';
  searchInput.style.borderRadius = '9px';
  panel.appendChild(searchInput);

  const container = document.createElement('div');
  container.id = 'allLeadsTableContainer';
  panel.appendChild(container);

  searchInput.addEventListener('input', renderAllLeadsTable);

  renderAllLeadsTable();

  return panel;
}

function renderAllLeadsTable() {
  const q = document.getElementById('allSearchLead').value.trim().toLowerCase();
  let container = document.getElementById('allLeadsTableContainer');
  let visibleLeads = (currentUser && currentUser.toLowerCase() === 'sem')
    ? leads
    : leads.filter(l => l.addedBy && l.addedBy.toLowerCase() === currentUser.toLowerCase());

  // Filter by search
  visibleLeads = visibleLeads.filter(lead => {
    return [lead.eventName, lead.email, lead.phone, lead.designation, lead.organisingSociety, lead.category, lead.remarks || '', lead.addedBy]
      .join(' | ')
      .toLowerCase()
      .includes(q);
  });

  if (visibleLeads.length === 0) {
    container.innerHTML = '<em>No matching leads found.</em>';
    return;
  }

  let html = `<table aria-label="All Leads table">
    <thead><tr>
    <th>Event Name</th><th>Email</th><th>Phone</th><th>Designation</th>
    <th>Society</th><th>Category</th><th>Remarks</th>
    <th>Added By</th><th>Added On</th><th>Follow-ups</th>
    </tr></thead><tbody>`;

  visibleLeads.forEach((lead, i) => {
    html += `<tr>
      <td>${lead.eventName}</td>
      <td>${lead.email}</td>
      <td>${lead.phone}</td>
      <td>${lead.designation}</td>
      <td>${lead.organisingSociety}</td>
      <td><span class="tag ${lead.category.split(' ')[0]}">${lead.category}</span></td>
      <td>${lead.remarks || ''}</td>
      <td>${lead.addedBy || ''}</td>
      <td>${new Date(lead.addedOn).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
      <td>
        ${lead.followups?.length || 0}
        <button type="button" onclick="openFollowupModal(${leads.indexOf(lead)})" aria-label="Add follow up to ${lead.eventName}">➕ Add</button>
        <br>
        ${(lead.followups || []).map((f, idx) => {
          let canDelete = (currentUser.toLowerCase() === 'sem');
          return `<div style="font-size:13px;padding:4px 0;">
            📆 ${new Date(f.datetime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            <br><span style="color:#444;">${f.remark}</span>
            <span style="color:${f.done ? '#26b361' : '#d0021b'};font-weight:bold;">[${f.done ? 'Done' : 'Pending'}]</span>
            ${canDelete ? `<button type="button" onclick="deleteFollowup(${leads.indexOf(lead)}, ${idx})" title="Delete follow-up" style="font-size:11px; margin-left:6px;">🗑️</button>` : ''}
          </div>`;
        }).join('')}
      </td>
    </tr>`;
  });

  html += '</tbody></table>';

  container.innerHTML = html;
}

// Follow-up modal handling
const modalBg = document.getElementById('modalBg');
const followupModal = document.getElementById('followupModal');

window.openFollowupModal = function (idx) {
  if (!leads[idx]) return;
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
  let lead = leads[addFollowupForIdx];
  if (!lead) {
    showToast('Lead not found!', false);
    closeFollowupModal();
    return;
  }
  // Authorization check: user can add followups only to their leads or SEM can add on all
  if (currentUser.toLowerCase() !== 'sem' && lead.addedBy !== currentUser) {
    showToast('Not authorized to add follow-up to this lead', false);
    closeFollowupModal();
    return;
  }
  lead.followups.push({ datetime: dt, remark: remark, done: false });
  saveLeads();
  closeFollowupModal();
  renderTabContent(document.querySelector('#user-tabs button.active')?.dataset.tab || 'dashboard');
  renderTodayFollowups(document.getElementById('calendar-list'));
  showToast('Follow-up added!');
};

// Terms & Conditions modal code (unchanged)
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

// On page load
window.onload = function () {
  currentUser = localStorage.getItem(SESSION_KEY);
  leads = getStoredLeads();
  if (currentUser === 'developer') {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('superAdminPanel').style.display = '';
    document.getElementById('devUsername').textContent = currentUser;
    window.superadmin = new SuperAdmin(); // Please insert the full SuperAdmin class code separately
    return;
  }
  if (currentUser) {
    document.getElementById('login-page').style.display = 'none';
    showDashboard();
  }
};

function showDashboard() {
  document.getElementById('welcome-popup').textContent = `Welcome, ${currentUser}!`;
  document.getElementById('welcome-popup').style.display = 'block';
  setTimeout(() => {
    document.getElementById('welcome-popup').style.display = 'none';
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('superAdminPanel').style.display = 'none';
    document.getElementById('dashboard').style.display = '';
    document.getElementById('userNameDash').textContent = currentUser;
    renderUserTabs();
    renderTabContent('dashboard');
  }, 900);
}
