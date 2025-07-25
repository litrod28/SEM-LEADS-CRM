// ------- User and Role Data -------
const USERS = [
  {username:'sushant', password:'sush@123', role:'user'},
  {username:'gaurav', password:'gaurav@123', role:'user'},
  {username:'yash', password:'yash@123', role:'user'},
  {username:'shikha', password:'shikha@123', role:'user'},
  {username:'tripti', password:'tripti@123', role:'user'},
  {username:'anshi', password:'anshi@123', role:'user'},
  {username:'SEM', password:'semops@123', role:'sem'},
  {username:'developer', password:'dev041228', role:'developer'}
];
const USERNAMES = USERS.map(u => u.username);

function getData(key)  { return JSON.parse(localStorage.getItem(key)||'[]'); }
function setData(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// ------- App State -------
let currentUser = null;
let leadsDB = getData('leads');
let followupsDB = getData('followups');

// ------- Welcome Popup Utility -------
function showPopup(msg) {
  const pop=document.getElementById('popup');
  pop.innerText=msg;
  pop.classList.add('show');
  setTimeout(()=>pop.classList.remove('show'),1000);
}

// ------- Login Handling -------
document.getElementById('login-form').onsubmit = function(e) {
  e.preventDefault();
  const uname = document.getElementById('login-username').value.trim();
  const upass = document.getElementById('login-password').value.trim();
  const u = USERS.find(x => x.username === uname && x.password === upass);
  if (u) {
    currentUser = { ...u };
    document.getElementById('login-page').style.display = 'none';
    showPopup(`Welcome, ${uname}`);
    setTimeout(loadMainApp, 950);
  } else {
    showPopup('Invalid Credentials');
  }
}

// ------- Main App Logic -------
function loadMainApp() {
  leadsDB = getData('leads');
  followupsDB = getData('followups');
  const uname = currentUser.username;
  let html = `
    <div class="header-bar">
      <div class="user-name">${uname.charAt(0).toUpperCase()+uname.slice(1)}</div>
      <button onclick="logout()" class="logout-btn">Logout</button>
    </div>
  `;
  if(currentUser.role === 'user'){
    html+=renderTabs(['User','Add Lead','My Leads'], 'user');
  } else if(currentUser.role === 'sem'){
    html+=renderTabs(['Add & Assign Lead','All Leads','Report'], 'sem');
  } else if(currentUser.role === 'developer'){
    html+=renderTabs(['Add & Assign Lead','All Leads','Report','Admin'], 'developer');
  }
  document.getElementById('app-page').innerHTML = html;
  document.getElementById('app-page').style.display = 'block';
  handleTabSwitch(0);
}

// ------- Tab Rendering -------
function renderTabs(tabNames, rkey){
  return `
  <div class="tab-nav">
    ${tabNames.map((t,i)=>`<button type="button" class="nav-tab" onclick="handleTabSwitch(${i})">${t}</button>`).join('')}
  </div>
  <div id="tabs-panel"></div>
  `;
}
window.handleTabSwitch = function(idx){
  const tabs = [...document.querySelectorAll('.nav-tab')];
  tabs.forEach((t,i)=>t.classList.toggle('selected',i===idx));
  if(currentUser.role==='user'){
    if(idx===0) loadUserHome();
    else if(idx===1) renderAddLead(false);
    else if(idx===2) loadMyLeads();
  } else if(currentUser.role==='sem'){
    if(idx===0) renderAddLead(true);
    else if(idx===1) loadAllLeads();
    else if(idx===2) renderReport();
  } else if(currentUser.role==='developer'){
    if(idx===0) renderAddLead(true);
    else if(idx===1) loadAllLeads();
    else if(idx===2) renderReport();
    else if(idx===3) renderDeveloperPanel();
  }
}

// ------- User Home Tab -------
function loadUserHome(){
  const uname = currentUser.username;
  const myLeads = leadsDB.filter(l=>l.addedBy===uname);
  const myFupsToday = followupsDB.filter(f=>f.by===uname && isToday(f.date));
  const allFups = followupsDB.filter(f=>f.by===uname);
  const overdueFups = allFups.filter(f=>!f.completed && new Date(f.date)<todayStart());
  const todaysFups = allFups.filter(f=>!f.completed && isToday(f.date));
  document.getElementById('tabs-panel').innerHTML = `
    <div class="panel">
      <div style="display:flex;gap:32px;margin-bottom:24px;">
        <div><b>Leads Added:</b> ${myLeads.length}</div>
        <div><b>Follow Ups Today:</b> ${myFupsToday.length}</div>
      </div>
      <div style="margin-bottom:19px;">
        <b>Overdue Follow Ups</b>
        <ul style="margin:9px 0 0 13px;">
          ${overdueFups.length===0 ? '<li>None</li>' : overdueFups.map(f=>`<li>${showLead(f.leadId)} - ${niceDate(f.date)}</li>`).join('')}
        </ul>
      </div>
      <div>
        <b>Followup Reminders (Today)</b>
        <ul style="margin:8px 0 0 13px;">
          ${todaysFups.length===0? '<li>None</li>' : todaysFups.map(f=>`<li>${showLead(f.leadId)} - ${f.remarks || ''}</li>`).join('')}
        </ul>
      </div>
    </div>`;
}

// ------- Add Lead Tab (for user/sem/dev) -------
function renderAddLead(assignable){
  const event = `
    <div class="panel">
      <form class="form-box" id="add-lead-form">
        <input class="glass-glow" type="text" id="event-name" placeholder="Event Name" required>
        <input class="glass-glow" type="text" id="org-society" placeholder="Organising Society" required>
        <input class="glass-glow" type="text" id="contact-person" placeholder="Contact Person" required>
        <input class="glass-glow" type="tel" id="phone" placeholder="Phone Number" required>
        <input class="glass-glow" type="email" id="email" placeholder="Email" required>
        <select class="glass-glow" required id="lead-stage">
          <option value="">Lead Stage</option>
          <option>hot</option>
          <option>warm</option>
          <option>cold</option>
          <option>ni</option>
          <option>nre</option>
          <option>junk</option>
        </select>
        <textarea id="remarks" class="glass-glow" placeholder="Remarks" rows="2"></textarea>
        <input type="date" class="glass-glow" id="lead-followup" required value="${todayStr()}">
        ${assignable ? `
        <select class="glass-glow" id="assign-to" required>
          <option value="">Assign To</option>
          ${USERS.filter(u=>u.role==='user').map(u=>`<option>${u.username}</option>`).join('')}
        </select>
        ` : ''}
        <button class="primary-btn glass-glow" type="submit">Add Lead</button>
      </form>
    </div>
    `;
  document.getElementById('tabs-panel').innerHTML = event;
  document.getElementById('add-lead-form').onsubmit = function(e){
    e.preventDefault();
    const values = {
      event:document.getElementById('event-name').value,
      society:document.getElementById('org-society').value,
      person:document.getElementById('contact-person').value,
      phone:document.getElementById('phone').value,
      email:document.getElementById('email').value,
      stage:document.getElementById('lead-stage').value,
      remarks:document.getElementById('remarks').value,
      followup:document.getElementById('lead-followup').value,
      addedAt:Date.now(),
      assignedTo: assignable ? document.getElementById('assign-to').value : currentUser.username,
      addedBy: assignable ? currentUser.username : currentUser.username,
      id: 'L'+Date.now()+''+Math.floor(Math.random()*100),
    };
    leadsDB.push(values);
    setData('leads',leadsDB);
    followupsDB.push({
      id:'F'+Date.now()+''+Math.floor(Math.random()*100),
      leadId: values.id,
      by: values.assignedTo,
      date: values.followup,
      completed:false,
      remarks:'Initial followup'
    });
    setData('followups',followupsDB);
    showPopup('Lead Added');
    setTimeout(()=>handleTabSwitch(assignable||currentUser.role==='sem' ? 1 : 2), 700);
  }
}

// ------- My Leads Tab (user) -------
function loadMyLeads(){
  const uname = currentUser.username;
  const myLeads = leadsDB.filter(l=>l.assignedTo===uname);
  let tbody = myLeads.map(lead=>{
    return `<tr>
      <td>${lead.event}</td>
      <td>${lead.society}</td>
      <td>${lead.person}</td>
      <td>${lead.phone}</td>
      <td>${lead.email}</td>
      <td>${lead.stage}</td>
      <td>${lead.remarks}</td>
      <td>${niceDateTime(lead.addedAt)}</td>
      <td><button onclick="addFollowup('${lead.id}')" class="primary-btn glass-glow" style="padding:5px 14px;font-size:0.93rem;">Add Follow Up</button></td>
    </tr>`;
  }).join('');
  if(!tbody) tbody = '<tr><td colspan="9" style="text-align:center;">No leads yet.</td></tr>';
  document.getElementById('tabs-panel').innerHTML = `
    <div class="panel" style="overflow-x:auto">
    <table>
      <thead>
        <tr>
          <th>Event</th><th>Society</th><th>Contact</th><th>Phone</th><th>Email</th><th>Stage</th><th>Remarks</th><th>Added</th><th>Follow Up</th>
        </tr>
      </thead>
      <tbody>${tbody}</tbody>
    </table>
    </div>
  `;
}
window.addFollowup = function(leadId){
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="glass-container" style="max-width:350px;">
      <h2 style="font-size:1.2rem;margin-bottom:9px;">Add Follow Up</h2>
      <form class="form-box" id="followup-form">
        <input type="date" class="glass-glow" value="${todayStr()}" id="followup-date" required>
        <textarea id="followup-remarks" class="glass-glow" placeholder="Remarks" rows="2"></textarea>
        <button class="primary-btn glass-glow" type="submit">Submit</button>
      </form>
    </div>
  `;
  showModal(wrap.innerHTML, ()=>{
    document.getElementById('followup-form').onsubmit = function(e){
      e.preventDefault();
      followupsDB.push({
        id:'F'+Date.now()+''+Math.floor(Math.random()*100),
        leadId,
        by: currentUser.username,
        date: document.getElementById('followup-date').value,
        completed:false,
        remarks: document.getElementById('followup-remarks').value
      });
      setData('followups',followupsDB);
      document.body.removeChild(document.querySelector('.modal-overlay'));
      showPopup('Follow up added');
    }
  });
}

// ------- All Leads Tab (sem/dev) -------
function loadAllLeads(){
  let filterUsers = USERS.filter(u=>u.role==='user');
  let html = `
    <div class="panel">
      <div style="margin-bottom:14px;">
        <select class="glass-glow" id="filter-user">
          <option value="">Filter by User</option>
          ${filterUsers.map(u=>`<option>${u.username}</option>`).join('')}
        </select>
        <input class="glass-glow" type="date" id="filter-date" value="">
        <button class="primary-btn glass-glow" onclick="filterLeads()">Search</button>
      </div>
      <div style="overflow-x:auto">
      <table id="all-leads-table">
        <thead>
          <tr>
            <th>Event</th><th>Society</th><th>Contact</th><th>Phone</th><th>Email</th><th>Stage</th>
            <th>Remarks</th><th>Follow up</th><th>Assigned To</th><th>Added At</th>
          </tr>
        </thead>
        <tbody>
          ${renderLeadsTable(leadsDB)}
        </tbody>
      </table>
      </div>
    </div>
  `;
  document.getElementById('tabs-panel').innerHTML = html;
}
window.filterLeads = function(){
  let valU = document.getElementById('filter-user').value;
  let valD = document.getElementById('filter-date').value;
  let filtered = leadsDB.filter(l=>
    (!valU || l.assignedTo===valU) &&
    (!valD || l.addedAt && niceDateStr(l.addedAt)==valD)
  );
  document.querySelector('#all-leads-table tbody').innerHTML = renderLeadsTable(filtered);
}
function renderLeadsTable(arr){
  if(arr.length === 0) return `<tr><td colspan="10" style="text-align:center;">No leads found.</td></tr>`;
  return arr.map(lead=>{
    return `<tr>
      <td>${lead.event}</td>
      <td>${lead.society}</td>
      <td>${lead.person}</td>
      <td>${lead.phone}</td>
      <td>${lead.email}</td>
      <td>${lead.stage}</td>
      <td>${lead.remarks}</td>
      <td>${renderFollowups(lead.id)}</td>
      <td>${lead.assignedTo}</td>
      <td>${niceDateTime(lead.addedAt)}</td>
    </tr>`;
  }).join('');
}
function renderFollowups(leadId){
  const fups = followupsDB.filter(f=>f.leadId===leadId);
  if(!fups.length) return 'None';
  return `<ul style="padding-left:13px;font-size:0.94rem;">
    ${fups.map(f=>
      `<li>
        ${niceDate(f.date)}: ${f.remarks||''}
        ${f.completed ? '<span style="color:green">✔️</span>' : ''}
      </li>`
    ).join('')}
  </ul>`;
}

// ------- Report Tab (sem/dev) -------
function renderReport(){
  let dates = [...new Set(leadsDB.map(l=>niceDateStr(l.addedAt)))].sort().reverse();
  let html = `
    <div class="panel">
    <select id="report-date" class="glass-glow" onchange="renderReport()">
      <option value="">Select date</option>
      ${dates.map(d=>`<option>${d}</option>`).join('')}
    </select>
    <table>
    <thead>
      <tr><th>User</th><th>No. of Leads</th><th>No. of Followups</th></tr>
    </thead>
    <tbody>
    ${USERS.filter(u=>u.role==='user').map(u=>{
      let leads = leadsDB.filter(l=>l.assignedTo===u.username);
      let dateFilter = document.getElementById('report-date')?.value;
      if(dateFilter) leads = leads.filter(l=>niceDateStr(l.addedAt)===dateFilter);
      let fups = followupsDB.filter(f=>f.by===u.username);
      if(dateFilter) fups = fups.filter(f=>niceDateStr(f.date)===dateFilter);
      return `<tr>
        <td>${u.username}</td>
        <td>${leads.length}</td>
        <td>${fups.length}</td>
      </tr>`;
    }).join('')}
    </tbody>
    </table>
    </div>
  `;
  document.getElementById('tabs-panel').innerHTML = html;
}

// ------- Developer/Admin Tab -------
function renderDeveloperPanel(){
  let html = `
    <div class="panel">
      <h2 style="font-size:1.1rem">Admin Control Panel</h2>
      <div style="margin-bottom:22px;">
        <b>All Users</b>
        <table>
          <thead><tr><th>User</th><th>Role</th><th>Password</th><th>Action</th></tr></thead>
          <tbody>
            ${USERS.map(u=>`
            <tr>
              <td contenteditable="true" onblur="adminUpdateUser('${u.username}','username',this.innerText)">${u.username}</td>
              <td contenteditable="true" onblur="adminUpdateUser('${u.username}','role',this.innerText)">${u.role}</td>
              <td contenteditable="true" onblur="adminUpdateUser('${u.username}','password',this.innerText)">${u.password}</td>
              <td><button onclick="adminDeleteUser('${u.username}')" style="color:#d22c0c;background:none;border:none;cursor:pointer">Delete</button></td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div><button class="primary-btn glass-glow" onclick="adminAddUser()">Add new user</button></div>
    </div>
  `;
  document.getElementById('tabs-panel').innerHTML = html;
}
window.adminUpdateUser = function(username, field, val){
  let idx = USERS.findIndex(u=>u.username===username);
  if(idx>-1){
    USERS[idx][field]=val;
    showPopup('User updated');
    renderDeveloperPanel();
  }
}
window.adminDeleteUser = function(username){
  let idx = USERS.findIndex(u=>u.username===username);
  if(idx>-1){
    USERS.splice(idx,1);
    showPopup('User deleted');
    renderDeveloperPanel();
  }
}
window.adminAddUser = function(){
  USERS.push({username:'newuser','password':'pass','role':'user'});
  renderDeveloperPanel();
}

// ------- Modal Utility -------
function showModal(html, cb){
  const mask = document.createElement('div');
  mask.className = "modal-overlay";
  mask.style='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(30,60,80,0.21);z-index:1009;display:flex;align-items:center;justify-content:center;';
  mask.innerHTML = `<div>${html}</div>`;
  mask.onclick = function(e){ if(e.target===mask)document.body.removeChild(mask);}
  document.body.appendChild(mask);
  if(cb) setTimeout(cb,120);
}

// ------- Logout -------
window.logout = function(){
  currentUser = null;
  document.getElementById('app-page').style.display = 'none';
  document.getElementById('login-page').style.display = 'block';
  document.getElementById('login-form').reset();
}

// ------- Helpers -------
function niceDate(ts) {
  if(!ts) return "";
  const odate = typeof ts === 'string' && ts.length<=10 ? new Date(ts) : new Date(ts);
  return odate.toLocaleDateString('en-IN',{month:'short',day:'2-digit'});
}
function niceDateStr(ts){
  const d = typeof ts === 'number'? new Date(ts) : new Date(ts);
  return d.toISOString().split('T')[0];
}
function niceDateTime(ts){
  const d = new Date(ts);
  const dstr = d.toLocaleDateString('en-IN',{month:'short',day:'2-digit'});
  const tstr = d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
  return dstr+' '+tstr;
}
function todayStr(){
  const d=new Date();
  return d.toISOString().split('T')[0];
}
function todayStart(){
  let d = new Date();
  d.setHours(0); d.setMinutes(0); d.setSeconds(0); d.setMilliseconds(0);
  return d;
}
function isToday(date){
  if(!date) return false;
  let d = typeof date==='string'?new Date(date):new Date(date);
  let now = new Date();
  return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth() && d.getDate()===now.getDate();
}
function showLead(leadId){
  let l = leadsDB.find(l=>l.id===leadId);
  return l ? l.event : leadId;
}

// ------- End of Script -------
