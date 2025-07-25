// ----- CRM PORTAL SEM Modern Glass Dashboard JS -----

// --- User Database ---
const USERS = [
  {username:'sushant', password:'sush@123', role:'user', name:'Sushant'},
  {username:'gaurav', password:'gaurav@123', role:'user', name:'Gaurav'},
  {username:'yash', password:'yash@123', role:'user', name:'Yash'},
  {username:'shikha', password:'shikha@123', role:'user', name:'Shikha'},
  {username:'tripti', password:'tripti@123', role:'user', name:'Tripti'},
  {username:'anshi', password:'anshi@123', role:'user', name:'Anshi'},
  {username:'SEM', password:'semops@123', role:'sem', name:'SEM (Manager)'},
  {username:'developer', password:'dev041228', role:'developer', name:'Developer'}
];
let currentUser = null;

// --- Login Handler ---
document.getElementById('loginForm').onsubmit = function(e){
  e.preventDefault();
  const uname = document.getElementById('login-username').value.trim();
  const upass = document.getElementById('login-password').value.trim();
  const found = USERS.find(u => u.username === uname && u.password === upass);
  if(found){
    currentUser = found;
    document.getElementById('usernameBar').innerText = found.name || found.username;
    showPopup('Welcome, ' + (found.name || found.username));
    document.getElementById('loginPage').style.display='none';
    document.getElementById('logoutBtn').style.display='';
    setTimeout(renderMain, 800);
  } else {
    showPopup('Invalid login.');
  }
};

// --- Logout Handler ---
document.getElementById('logoutBtn').onclick = function(){
  currentUser = null;
  document.getElementById('mainPage').style.display='none';
  document.getElementById('usernameBar').innerText = '';
  document.getElementById('loginPage').style.display='';
  document.getElementById('logoutBtn').style.display='none';
  document.getElementById('sideMenu').style.left = '-180px';
};

// --- Welcome Popup Utility ---
function showPopup(msg) {
  const pop=document.getElementById('popup');
  pop.innerText=msg;
  pop.classList.add('show');
  setTimeout(()=>pop.classList.remove('show'),1050);
}

// --- Sample Dashboard Data (swap with CRM data as needed) ---
const ACTIVE_GAMES = [
  {
    img: 'https://staticg.sportskeeda.com/editor/2022/09/568d8-16636716693311-1920.jpg',
    title: 'Assassins Creed Valhalla',
    desc: 'PS5 version',
    progress: 60
  },
  {
    img: 'https://i.pinimg.com/originals/0c/fd/80/0cfd8015324a803eb14e4ef1e7b334b4.jpg',
    title: 'Spiderman',
    desc: 'PS5 version',
    progress: 20
  },
  {
    img: 'https://gaming-cdn.com/images/products/8503/orig/sackboy-a-big-adventure-ps5-ps4-game-playstation-store-europe-cover.jpg',
    title: 'Sack Boy - A Big Adventure',
    desc: 'PS5 version',
    progress: 90
  }
];

// --- Main Dashboard Renderer (sample version: replace cards as needed) ---
function renderMain(){
  document.getElementById('mainPage').innerHTML = `
    <h2 style="margin-bottom:22px;text-align:left;color:#7A3AFF;padding-left:7px;background:linear-gradient(120deg,#893cff 10%,#61fde5 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Active Games</h2>
    <div class="searchbar"><input placeholder="Search games..." oninput="filterGames(this.value)">
      <svg width="27" height="27" style="opacity:0.33"><circle cx="12" cy="12" r="11" stroke="#843cff" fill="none" stroke-width="2"/><path d="M19 19 L25 25" stroke="#843cff" stroke-width="2" stroke-linecap="round"/></svg>
    </div>
    <div class="tab-panel" id="gamesPanel"></div>
  `;
  document.getElementById('mainPage').style.display = '';
  renderGameCards('');
  buildSideMenu();
}

function renderGameCards(q){
  let arr = !q
    ? ACTIVE_GAMES
    : ACTIVE_GAMES.filter(g=>g.title.toLowerCase().includes(q.toLowerCase()));
  document.getElementById('gamesPanel').innerHTML = arr.map(gc=>`
    <div class="game-card">
      <img class="gc-thumb" src="${gc.img}">
      <div class="gc-info">
        <div class="gc-title">${gc.title}</div>
        <div class="gc-desc">${gc.desc}</div>
        <div class="gc-progress-wrap">
          <div style="width:100%;display:flex;align-items:center;">
            <div class="gc-progress-bg">
              <div class="gc-progress-bar" style="width:${gc.progress}%;"></div>
            </div>
            <span class="gc-progress-val">${gc.progress}%</span>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}
window.filterGames = renderGameCards;

// --- Side Menu Construction (matches dashboard card theme) ---
function buildSideMenu(){
  let sm = document.getElementById('sideMenu');
  sm.innerHTML = `
    <img src="https://randomuser.me/api/portraits/men/25.jpg">
    <div class="sm-username">${currentUser.name||currentUser.username}</div>
    <a href="#" class="sm-link selected">Games</a>
    <a href="#" class="sm-link">Streams</a>
    <a href="#" class="sm-link">Upcoming</a>
    <a href="#" class="sm-link">Library</a>
    <button class="sm-link" style="background: linear-gradient(90deg,#e8cff2 61%,#b75ffc 100%);color:#885bec">Join pro for free<br>games</button>
  `;
  sm.classList.add('open');
  document.getElementById('menuToggle').style.display='';
}
window.toggleMenu = function(){
  let sm = document.getElementById('sideMenu');
  sm.classList.toggle('open');
};

// --- On Page Load: Only Show Login ---
document.getElementById('mainPage').style.display='none';
document.getElementById('logoutBtn').style.display='none';
document.getElementById('usernameBar').innerText = '';
