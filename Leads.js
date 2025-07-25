<script>
  // User credentials & roles
  const users = {
    'sushant': { password: 'sush@123', role: 'user' },
    'gaurav': { password: 'gaurav@123', role: 'user' },
    'yash': { password: 'yash@123', role: 'user' },
    'shikha': { password: 'shikha@123', role: 'user' },
    'tripti': { password: 'tripti@123', role: 'user' },
    'anshi': { password: 'anshi@123', role: 'user' },
    'sem':    { password: 'semops@123', role: 'sem' },
    'developer': { password: 'dev041228', role: 'superadmin' }
  };
  let currentUser = null;

  // Utility function to show welcome/notification popups
  function showPopup(msg) {
    const popup = document.getElementById('welcomePopup');
    popup.textContent = msg;
    popup.style.display = 'block';
    popup.style.opacity = '1';
    setTimeout(() => { popup.style.opacity = '0'; }, 1100);
    setTimeout(() => { popup.style.display = 'none'; }, 1450);
  }

  // Create tabs based on role
  function buildTabs(role) {
    let tabs = [];
    if (role === 'user') {
      tabs = [
        { name: "User", id: "user" },
        { name: "Add Lead", id: "addlead" },
        { name: "My Leads", id: "myleads" }
      ];
    }
    if (role === 'sem') {
      tabs = [
        { name: "Add and Assign Lead", id: "addassign" },
        { name: "All Leads", id: "allleads" },
        { name: "Report", id: "report" }
      ];
    }
    if (role === 'superadmin') {
      tabs = [
        { name: "Admin Panel", id: "adminpanel" },
        { name: "All Leads", id: "allleads" },
        { name: "Report", id: "report" }
      ];
    }
    return tabs;
  }

  // LocalStorage-backed database mock
  let db = JSON.parse(localStorage.getItem('crmLeadsDB')) || {
    leads: [],
    followups: [],
    usersMeta: {
      sushant:{}, gaurav:{}, yash:{}, shikha:{}, tripti:{}, anshi:{}
    }
  };
  function saveDB() {
    localStorage.setItem('crmLeadsDB', JSON.stringify(db));
  }

  // Main app rendering
  function renderApp(user) {
    const main = document.getElementById('appMain');
    document.getElementById('crmlogin').style.display = 'none';
    main.style.display = '';
    main.innerHTML = '';

    const topBar = document.createElement('div');
    topBar.className = 'top-bar';
    topBar.innerHTML = `<span class="user-info">${user}</span>
      <button class="logout-btn" onclick="logout()">Log Out</button>`;
    main.appendChild(topBar);

    const tabsArr = buildTabs(users[user].role);
    const tabs = document.createElement('div');
    tabs.className = "tabs";
    tabsArr.forEach((tab, i) => {
      const btn = document.createElement('button');
      btn.className = 'tab' + (i===0 ? ' active':'');
      btn.textContent = tab.name;
      btn.onclick = () => selectTab(tab.id, tabs, main, user);
      btn.tabIndex = 0;
      btn.id = `tabbtn-${tab.id}`;
      tabs.appendChild(btn);
    });
    main.appendChild(tabs);

    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';
    tabContent.id = 'tabContent';
    main.appendChild(tabContent);

    selectTab(tabsArr[0].id, tabs, main, user);
  }

  function selectTab(tabid, tabsDiv, main, user) {
    [...tabsDiv.children].forEach(t=>t.classList.remove('active'));
    document.getElementById('tabbtn-'+tabid).classList.add('active');
    renderTab(tabid, user);
  }

  function renderTab(tabid, user) {
    const role = users[user].role;
    const content = document.getElementById('tabContent');
    content.innerHTML = '';

    // Render tabs content by role and tab as detailed in previous code...
    // (Includes User tabs, SEM tabs, Superadmin tabs logic)
  }

  // Function to add follow-up in My Leads (user role)
  window.addFU = function(eventName) {
    const date = prompt("Add followup for '"+eventName+"'. Enter date (yyyy-mm-dd):");
    if(!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return alert('Invalid date');
    db.followups.push({
      lead: eventName,
      date, owner: currentUser,
      completed: false
    });
    saveDB();
    showPopup('Followup added!');
    renderTab('myleads', currentUser);
  };

  // Logout function
  window.logout = function(){
    document.getElementById('appMain').style.display = 'none';
    document.getElementById('crmlogin').style.display = '';
    currentUser = null;
    document.getElementById('loginForm').reset();
  };

  // Login submission handling
  document.getElementById('loginForm').onsubmit = function(e){
    e.preventDefault();
    const username = document.getElementById('userInput').value.trim().toLowerCase();
    const pass = document.getElementById('passInput').value;
    if(!users[username] || users[username].password !== pass) {
      showPopup('Invalid credentials');
      return;
    }
    currentUser = username;
    showPopup(`Welcome ${username.charAt(0).toUpperCase()+username.slice(1)}!`);
    setTimeout(()=>renderApp(username),1000);
  };

  // Keyboard navigation for tabs
  window.addEventListener('keydown', function(e){
    const m = document.getElementById('appMain');
    if(m.style.display==='none') return;
    let active = document.querySelector('.tab.active');
    if(!active) return;
    if(e.key==='ArrowRight' || e.key==='ArrowLeft'){
      let tabs = Array.from(document.querySelectorAll('.tab'));
      let idx = tabs.indexOf(active);
      idx = (e.key==='ArrowRight') ? (idx+1)%tabs.length : (idx-1+tabs.length)%tabs.length;
      tabs[idx].click();
    }
  });
</script>
