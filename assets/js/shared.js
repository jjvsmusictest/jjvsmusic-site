/* ═══════════════════════════════════════
   高職音樂學習網 · 共用 JavaScript
   AI問答 + Firebase進度追蹤
   ═══════════════════════════════════════ */

// ── Firebase Config (填入你的設定) ──
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAqs_LkwWJUmmgT4Sx8DH9oacMCv0gpjEg",
  authDomain: "music-19b1e.firebaseapp.com",
  projectId: "music-19b1e",
  storageBucket: "music-19b1e.firebasestorage.app",
  messagingSenderId: "203285137000",
  appId: "1:203285137000:web:429fbd669aa6b591a0dddd"
};

// ═══════════════════════════════════════
//  Firebase 進度追蹤
// ═══════════════════════════════════════
let db = null, auth = null, currentUser = null;

function initFirebase() {
  // Firebase is loaded via CDN in HTML
  if (typeof firebase === 'undefined') return;
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    db   = firebase.firestore();
    auth = firebase.auth();

    // Google sign-in
    auth.onAuthStateChanged(user => {
      currentUser = user;
      updateUserUI(user);
      if (user) loadProgress();
    });
  } catch(e) { console.log('Firebase not configured yet'); }
}

function googleSignIn() {
  if (!auth) return;
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(console.error);
}

function googleSignOut() {
  auth?.signOut();
}

function updateUserUI(user) {
  const loginBtn  = document.getElementById('login-btn');
  const userInfo  = document.getElementById('user-info');
  const userName  = document.getElementById('user-name');
  if (!loginBtn) return;
  if (user) {
    loginBtn.style.display = 'none';
    if (userInfo)  userInfo.style.display = 'flex';
    if (userName)  userName.textContent = user.displayName?.split(' ')[0] || '同學';
  } else {
    loginBtn.style.display = 'flex';
    if (userInfo) userInfo.style.display = 'none';
  }
}

async function saveProgress(unitId, data) {
  if (!db || !currentUser) {
    // Fallback to localStorage
    const key = `music_progress_${unitId}`;
    localStorage.setItem(key, JSON.stringify({ ...data, timestamp: Date.now() }));
    return;
  }
  try {
    await db.collection('progress').doc(currentUser.uid)
      .collection('units').doc(unitId)
      .set({ ...data, timestamp: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  } catch(e) { console.error('Save progress failed:', e); }
}

async function loadProgress() {
  const progressMap = {};
  if (!db || !currentUser) {
    // Load from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('music_progress_')) {
        const unitId = key.replace('music_progress_', '');
        try { progressMap[unitId] = JSON.parse(localStorage.getItem(key)); } catch {}
      }
    }
    renderProgressDots(progressMap);
    return progressMap;
  }
  try {
    const snap = await db.collection('progress').doc(currentUser.uid)
      .collection('units').get();
    snap.forEach(doc => { progressMap[doc.id] = doc.data(); });
    renderProgressDots(progressMap);
    return progressMap;
  } catch { return {}; }
}

function renderProgressDots(progressMap) {
  document.querySelectorAll('[data-unit-id]').forEach(el => {
    const uid = el.dataset.unitId;
    const p = progressMap[uid];
    const dots = el.querySelectorAll('.up-dot');
    if (!p || !dots.length) return;
    if (p.quizDone) dots.forEach(d => d.classList.add('done'));
    else if (p.visited) dots[0]?.classList.add('current');
  });
}

// ═══════════════════════════════════════
//  Quiz Helpers
// ═══════════════════════════════════════
function markUnitVisited(unitId) {
  saveProgress(unitId, { visited: true });
}

function markQuizDone(unitId, score, total) {
  saveProgress(unitId, { visited: true, quizDone: true, score, total, pct: Math.round(score/total*100) });
}

// ═══════════════════════════════════════
//  Panel / Tab switchers (shared logic)
// ═══════════════════════════════════════
function showPanel(id, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('act'));
  document.querySelectorAll('.side-btn').forEach(b => b.classList.remove('act'));
  document.getElementById('panel-' + id)?.classList.add('act');
  btn?.classList.add('act');
  const pct = { 1:16, 2:33, 3:50, 4:66, 5:83, 6:100 };
  const idx = btn ? [...document.querySelectorAll('.side-btn')].indexOf(btn) + 1 : 1;
  const prog = document.getElementById('prog');
  if (prog) prog.style.width = (pct[idx] || 16) + '%';
}

function stab(btn, containerId, tabId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('act'));
  const parentCard = btn.closest('.card');
  parentCard?.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('act'));
  btn.classList.add('act');
  document.getElementById('tab-' + tabId)?.classList.add('act');
}

// ═══════════════════════════════════════
//  Init on DOM ready
// ═══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

  // Mark current page as active in nav
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    if (path.includes(link.dataset.page || '___NONE___')) {
      link.classList.add(link.dataset.active || 'active-h');
    }
  });
});

// ═══════════════════════════════════════
//  教師登入（簡易密碼驗證，不需要 Firebase Auth）
//  老師在 shared.js 這裡設定密碼即可
// ═══════════════════════════════════════
const TEACHER_PASSWORD = "jonghe2020";  // ← 改成你要的教師密碼

function teacherLogin() {
  const pwd = prompt("請輸入教師密碼：");
  if (!pwd) return;
  if (pwd === TEACHER_PASSWORD) {
    sessionStorage.setItem('isTeacher', '1');
    sessionStorage.setItem('teacherName', '老師');
    updateTeacherUI(true);
    // Trigger teacher mode on resource pages
    if (typeof isTeacher !== 'undefined') {
      isTeacher = true;
      if (typeof loadAndRender === 'function') loadAndRender();
      const bar = document.getElementById('admin-bar');
      if (bar) bar.style.display = 'flex';
    }
    alert('✅ 教師模式已開啟！');
  } else {
    alert('密碼錯誤，請重試。');
  }
}

function teacherLogout() {
  sessionStorage.removeItem('isTeacher');
  sessionStorage.removeItem('teacherName');
  updateTeacherUI(false);
  if (typeof isTeacher !== 'undefined') {
    isTeacher = false;
    if (typeof loadAndRender === 'function') loadAndRender();
    const bar = document.getElementById('admin-bar');
    if (bar) bar.style.display = 'none';
  }
}

function updateTeacherUI(loggedIn) {
  const loginBtn  = document.getElementById('login-btn');
  const userInfo  = document.getElementById('user-info');
  const userName  = document.getElementById('user-name');
  if (!loginBtn) return;
  if (loggedIn) {
    loginBtn.style.display  = 'none';
    if (userInfo) { userInfo.style.display = 'flex'; }
    if (userName) userName.textContent = sessionStorage.getItem('teacherName') || '老師';
  } else {
    loginBtn.style.display  = 'flex';
    if (userInfo) userInfo.style.display = 'none';
  }
}

// Auto-restore teacher session on page load
document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('isTeacher') === '1') {
    updateTeacherUI(true);
    setTimeout(() => {
      if (typeof isTeacher !== 'undefined') {
        isTeacher = true;
        if (typeof loadAndRender === 'function') loadAndRender();
        const bar = document.getElementById('admin-bar');
        if (bar) bar.style.display = 'flex';
      }
    }, 300);
  }
});
