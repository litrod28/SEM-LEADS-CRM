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

// ========== All App logic in this class ==========
class App {
  constructor() {
    this.users = [
      { username: "shikha", password: "shikha@123" },
      { username: "tripti", password: "tripti@123" },
      { username: "anshi",  password: "anshi@123"  },
      { username: "SEM",    password: "sem@ops123" }
    ];
    this.LEADS_KEY = "semleads_leads";
    this.SESSION_KEY = "semleads_user";
    this.currentUser = null;
    this.leads = [];
    this.init();
  }
  init() {
    document.getElementById('loginForm').onsubmit = e => { e.preventDefault(); this.handleLogin(); };
    document.getElementById('loginUser').oninput = document.getElementById('loginPass').oninput
      = ()=> { document.getElementById('error').textContent = ""; };
    document.getElementById('leadForm').onsubmit = e => { e.preventDefault(); this.addLead(); };
    document.getElementById('tabAdmin').onclick = ()=>this.showAdminSection();
    document.getElementById('tabDashboard').onclick = ()=>this.showLeadsSection();
    document.getElementById('tabAllLeads').onclick = ()=>this.showAllLeadsSection();
    document.getElementById('allSearchLead').oninput = ()=>this.renderAllLeadsTable();
    document.getElementById('modalBg').onclick = this.closeFollowupModal.bind(this);
    document.getElementById('followupForm').onsubmit = e => { e.preventDefault(); this.addFollowup(); };
    window.logout = ()=>this.logout();
    document.body.addEventListener("click", e => this.handleListDelegations(e));
    this.currentUser = window.localStorage.getItem(this.SESSION_KEY) || null;
    if (this.currentUser) this.showDashboard();
  }
  toast(msg, ok=true) { showToast(msg,ok); }
  error(msg) { document.getElementById('error').textContent = msg; }
  handleLogin() {
    let u = document.getElementById('loginUser').value.trim(),
        p = document.getElementById('loginPass').value;
    let user = this.users.find(x=>x.username.toLowerCase() === u.toLowerCase() && x.password === p);
    if (!user) return this.error("Invalid username or password.");
    window.localStorage.setItem(this.SESSION_KEY, user.username);
    this.currentUser = user.username;
    this.showDashboard();
  }
  logout() {
    window.localStorage.removeItem(this.SESSION_KEY); location.reload();
  }
  setTabActive(tabId) {
    ['tabAdmin','tabDashboard','tabAllLeads'].forEach(id=>{
      let btn = document.getElementById(id); if(btn) btn.classList.remove("active");
    });
    let btn = document.getElementById(tabId); if(btn) btn.classList.add("active");
  }
  showLeadsSection() {
    this.setTabActive("tabDashboard");
    document.getElementById('admin-section').style.display = 'none';
    document.getElementById('dashboardContentRow').style.display = '';
    document.getElementById('all-leads-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = '';
  }
  showAllLeadsSection() {
    this.setTabActive("tabAllLeads");
    document.getElementById('admin-section').style.display='none';
    document.getElementById('dashboardContentRow').style.display='none';
    document.getElementById('all-leads-section').style.display='';
    document.getElementById('dashboard-section').style.display='';
    this.renderAllLeadsTable();
  }
  showAdminSection() {
    this.setTabActive("tabAdmin");
    document.getElementById('dashboard-section').style.display='';
    document.getElementById('admin-section').style.display='';
    document.getElementById('dashboardContentRow').style.display='none';
    document.getElementById('all-leads-section').style.display='none';
    document.getElementById('adminName').textContent=this.currentUser??"Admin";
    document.getElementById('adminTotalLeads').textContent=this.leads.length;
    document.getElementById('adminTodaysFollowups').textContent=this.countTodayFollowups();
  }
  showDashboard() {
    document.getElementById('welcome-popup').style.display = 'block';
    setTimeout(() => {
      document.getElementById('welcome-popup').style.display = 'none';
      document.getElementById('login-section').style.display = "none";
      document.getElementById('dashboard-section').style.display = "";
      document.getElementById('all-leads-section').style.display = "none";
      document.getElementById('admin-section').style.display = "none";
      document.getElementById('dashboardContentRow').style.display = "";
      document.getElementById('currentUser').textContent = this.currentUser;
      this.leads = this.getStoredLeads();
      this.renderTodayFollowups();
      this.showLeadsSection();
      this.toast(`Welcome, ${this.currentUser}!`, true);
    }, 900);
  }
  getStoredLeads() {
    let arr = JSON.parse(window.localStorage.getItem(this.LEADS_KEY) || "[]");
    arr.forEach(lead => { if (!lead.followups) lead.followups = []; });
    return arr;
  }
  saveLeads() { window.localStorage.setItem(this.LEADS_KEY, JSON.stringify(this.leads)); }
  addLead() {
    let eventName = document.getElementById('leadEventName').value.trim(),
      email = document.getElementById('leadEmail').value.trim(),
      phone = document.getElementById('leadPhone').value.trim(),
      designation = document.getElementById('leadDesignation').value.trim(),
      society = document.getElementById('leadOrgSociety').value.trim(),
      category = document.getElementById('leadCategory').value,
      remarks  = document.getElementById('leadRemarks').value.trim();
    if(!eventName||!email||!designation||!society||!phone||!category)
      return this.toast("Please fill all the fields!", false);
    if(!/^\S+@\S+\.\S+$/.test(email))
      return this.toast("Invalid email", false);
    if(!/^\d{8,}/.test(phone))
      return this.toast("Enter valid phone no.", false);
    if (this.leads.some(l=>l.email.trim().toLowerCase()===email.toLowerCase()))
      return this.toast("Email already exists!", false);
    let now = new Date();
    let istOffset = 5.5*60*60*1000;
    let addedOnIST = new Date(now.getTime() + istOffset - now.getTimezoneOffset()*60000);
    this.leads.push({
      eventName, email, phone, designation, organisingSociety: society,
      category, remarks, addedBy: this.currentUser,
      addedOn: addedOnIST.toISOString(),
      followups: []
    });
    this.saveLeads();
    this.renderTodayFollowups();
    this.renderAllLeadsTable();
    document.getElementById('leadForm').reset();
    this.toast('Lead added!');
  }
  renderAllLeadsTable() {
    let q = document.getElementById('allSearchLead').value.trim().toLowerCase(),
        isAdmin = this.currentUser && this.currentUser.toUpperCase() === "SEM";
    let html = `<table id="allLeadsTable"><tr>
    <th>Event Name</th><th>Email</th><th>Phone</th><th>Designation</th>
    <th>Society</th><th>Category</th><th>Remarks</th>
    <th>Added By</th><th>Added On (IST)</th><th>Follow-ups</th>
    </tr>`;
    let visibleLeads = isAdmin ? this.leads :
      this.leads.filter(l=>l.addedBy && l.addedBy.trim().toLowerCase()===this.currentUser.trim().toLowerCase());
    visibleLeads.filter(lead =>
      [lead.eventName,lead.email,lead.phone,lead.designation,lead.organisingSociety,lead.category,lead.remarks,lead.addedBy].join("|").toLowerCase().includes(q)
    ).sort((a,b)=>(b.addedOn||"").localeCompare(a.addedOn||""))
    .forEach((lead, i) => {
      html += `<tr>
        <td>${lead.eventName}</td>
        <td>${lead.email}</td>
        <td>${lead.phone}</td>
        <td>${lead.designation}</td>
        <td>${lead.organisingSociety}</td>
        <td><span class='tag ${lead.category.split(' ')[0]}'>${lead.category}</span></td>
        <td>${lead.remarks||''}</td>
        <td>${lead.addedBy||""}</td>
        <td>${lead.addedOn ? new Date(lead.addedOn).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"}):""}</td>
        <td>
          ${lead.followups?.length||0}
          <button type="button" data-followup="${this.leads.indexOf(lead)}">➕ Add</button>
          <br>
          ${(lead.followups||[]).map((f,idx) =>
            `<div style="font-size:13px;padding:2px;">
              📆 ${new Date(f.datetime).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}<br>
              <span style="color:#444;">${f.remark}</span>
              <span style="color:${f.done?'#26b361':'#d0021b'};font-weight:bold;">[${f.done?'Done':'Pending'}]</span>
              <button type="button" data-markdone="${this.leads.indexOf(lead)}_${idx}" style="font-size:11px; margin-left:2px;">Mark Done</button>
            </div>`
          ).join('')}
        </td>
      </tr>`;
    });
    html += "</table>";
    document.getElementById('allLeadsTableContainer').innerHTML = html;
  }
  openFollowupModal(idx) {
    this.addFollowupForIdx = idx;
    document.getElementById('fLeadName').textContent = this.leads[idx].eventName;
    document.getElementById('followupDate').value = '';
    document.getElementById('followupRemark').value = '';
    document.getElementById('modalBg').classList.add('open');
    document.getElementById('followupModal').classList.add('open');
  }
  closeFollowupModal() {
    document.getElementById('modalBg').classList.remove('open');
    document.getElementById('followupModal').classList.remove('open');
  }
  addFollowup() {
    let dt = document.getElementById('followupDate').value,
        remark = document.getElementById('followupRemark').value.trim();
    if (!dt) return this.toast('Date and time required!', false);
    if (!remark) return this.toast('Please enter remark!', false);
    this.leads[this.addFollowupForIdx].followups.push({ datetime: dt, remark: remark, done: false });
    this.saveLeads();
    this.closeFollowupModal();
    this.renderTodayFollowups();
    this.renderAllLeadsTable();
    this.toast('Follow-up added!');
  }
  markFollowupDone(leadIdx, fIdx) {
    let f = this.leads[leadIdx].followups[fIdx];
    if (!f || f.done) return this.toast("Already done.", false);
    if (!confirm("Mark this follow-up as done?")) return;
    f.done = true;
    this.saveLeads();
    this.renderTodayFollowups();
    this.renderAllLeadsTable();
    this.toast('Marked done.', true);
  }
  handleListDelegations(e) {
    let t = e.target;
    if (t.dataset && t.dataset.followup)
      this.openFollowupModal(Number(t.dataset.followup));
    if (t.dataset && t.dataset.markdone) {
      let [leadIdx, fIdx] = t.dataset.markdone.split("_").map(Number);
      this.markFollowupDone(leadIdx, fIdx);
    }
  }
  renderTodayFollowups() {
    let now = new Date(), yyyy = now.getFullYear(), mm = now.getMonth(), dd = now.getDate();
    let todayStart = new Date(yyyy,mm,dd,0,0,0).getTime(), todayEnd = new Date(yyyy,mm,dd,23,59,59).getTime(), html = '';
    this.leads.forEach((lead, i) => {
      (lead.followups||[]).forEach((f, idx) => {
        let ts = new Date(f.datetime).getTime();
        if(ts>=todayStart && ts<=todayEnd) {
          html += `<div class="flex" style="align-items:center; margin-bottom:7px;">
            <span class="tag ${lead.category.split(' ')[0]}" style="min-width:40px;">${lead.category}</span>
            <b style="color:#25a">${lead.eventName}</b>
            <span>${new Date(f.datetime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
            <span>${f.remark}</span>
            <span style="color:${f.done?'#26b361':'#d0021b'};font-size:.98em;">[${f.done?'Done':'Pending'}]</span>
            <button type="button" onclick="app.markFollowupDone(${i},${idx});" style="font-size:13px;">Mark Done</button>
          </div>`;
        }
      });
    });
    document.getElementById('calendar-list').innerHTML = html || "<em>No follow-ups scheduled for today.</em>";
  }
  countTodayFollowups() {
    let now = new Date(),
      yyyy = now.getFullYear(), mm = now.getMonth(), dd = now.get
