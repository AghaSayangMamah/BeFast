/* =========================================
   FILE: js/auth.js (FIX AUTO THEME & LOGIN)
   ========================================= */

function formatPhoneNumber(phone) { 
  let c = phone.replace(/\D/g, ''); 
  if(c.startsWith('0')) c = '62'+c.slice(1); 
  return c; 
}

if (typeof window.supabaseClient !== 'undefined' && window.supabaseClient) {
  window.supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session && session.user) { 
        localStorage.setItem('bf_user', JSON.stringify(session.user)); 
        
        // --- KUNCI: KEMBALIKAN TEMA TERAKHIR SPESIFIK USER INI ---
        const userTheme = localStorage.getItem('bf_theme_' + session.user.id);
        if (userTheme && typeof window.setTheme === 'function') {
            window.setTheme(userTheme);
        }
        // ----------------------------------------------------------

        if(typeof window.fetchTransactionsFromSupabase === 'function') window.fetchTransactionsFromSupabase(); 
    } else if (event === 'SIGNED_OUT') { 
        localStorage.removeItem('bf_user'); 
        window.transactions = []; 
        if(typeof window.renderData === 'function') window.renderData(); 
    }
    updateAuthUI();
  });
}

function getCurrentUser() { 
  try { return localStorage.getItem('bf_user') ? JSON.parse(localStorage.getItem('bf_user')) : null; } 
  catch(e){return null;} 
}

function updateAuthUI() {
  const user = getCurrentUser(); 
  const loggedOutDiv = document.getElementById('authLoggedOut'); 
  const loggedInDiv = document.getElementById('authLoggedIn'); 
  const greetHead = document.getElementById('userGreetingHeader');
  const greetCent = document.getElementById('userGreetingCenter');
  
  if (user) {
    if (loggedOutDiv) loggedOutDiv.classList.add('hidden'); 
    if (loggedInDiv) { loggedInDiv.classList.remove('hidden'); loggedInDiv.classList.add('flex'); }
    let fname = user.user_metadata?.full_name || 'User';
    if(greetHead) greetHead.innerText = fname;
    if(greetCent) greetCent.innerText = `${fname} 👋`;
  } else {
    if (loggedOutDiv) loggedOutDiv.classList.remove('hidden'); 
    if (loggedInDiv) { loggedInDiv.classList.add('hidden'); loggedInDiv.classList.remove('flex'); }
    if(greetHead) greetHead.innerText = `User`;
    if(greetCent) greetCent.innerText = `User 👋`;
    
    // Paksa tema kembali ke default (Tech Blue) jika belum login
    if(typeof window.setTheme === 'function') window.setTheme('default');
  }
  if(typeof updateSummaryUI === 'function') updateSummaryUI();
}

function openLoginModal() { document.getElementById('loginModal').classList.remove('hidden'); document.getElementById('signupModal').classList.add('hidden'); hideAlert('loginAlert'); }
function closeLoginModal() { document.getElementById('loginModal').classList.add('hidden'); }
function openSignupModal() { document.getElementById('signupModal').classList.remove('hidden'); document.getElementById('loginModal').classList.add('hidden'); hideAlert('signupAlert'); }
function closeSignupModal() { document.getElementById('signupModal').classList.add('hidden'); }
function switchAuthModal(to) { if (to === 'signup') openSignupModal(); else openLoginModal(); }

function showAlert(id, msg, isErr=true) {
  const el = document.getElementById(id); if(!el) return; el.innerText = msg;
  el.className = isErr ? "mb-4 p-3 rounded-xl text-xs font-bold bg-red-100 text-red-700 block text-center" : "mb-4 p-3 rounded-xl text-xs font-bold bg-green-100 text-green-700 block text-center";
}
function hideAlert(id) { const el = document.getElementById(id); if(el) el.className = "hidden"; }

function showVerifyEmailModal() {
  const m = document.getElementById('verifyEmailModal'); 
  const p = document.getElementById('verifyProgressBar'); 
  const c = document.getElementById('verifyCountdown');
  
  if (!m) return; 
  
  m.classList.remove('hidden'); 
  if(p) { p.classList.remove('animate-shrink'); void p.offsetWidth; p.classList.add('animate-shrink'); }
  
  if(typeof speak === 'function') speak("Pendaftaran berhasil. Silakan cek email kamu untuk verifikasi.");
  
  let t = 6; 
  if(c) c.innerText = t;
  
  const iv = setInterval(() => {
    t--; 
    if(c) c.innerText = t;
    if(t <= 0) { 
        clearInterval(iv); 
        m.classList.add('hidden'); 
        openLoginModal(); 
    }
  }, 1000);
}

// LOGIKA LOGIN
async function handleLogin(e) {
  e.preventDefault(); 
  const p = document.getElementById('loginPhone').value.trim(); 
  const pw = document.getElementById('loginPassword').value; 
  const btn = document.getElementById('btnLoginSubmit');
  
  if(!window.supabaseClient) return showAlert('loginAlert', 'Koneksi terputus.');
  btn.disabled=true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
  
  try {
    const fP = formatPhoneNumber(p);
    const { data: u, error: e1 } = await window.supabaseClient.from('users').select('email, username').eq('phone_number', fP).maybeSingle();
    
    if(e1 || !u?.email) throw new Error('Nomor HP tidak terdaftar.');
    
    const { error: e2 } = await window.supabaseClient.auth.signInWithPassword({ email: u.email, password: pw });
    if(e2) throw e2; 
    
    closeLoginModal();
    if(typeof window.fetchTransactionsFromSupabase === 'function') window.fetchTransactionsFromSupabase();
  } catch(err) { 
    showAlert('loginAlert', err.message.includes('Invalid') ? 'Kata sandi salah.' : err.message); 
  } finally { 
    btn.disabled=false; btn.innerHTML = 'Masuk Sekarang'; 
  }
}

// LOGIKA SIGNUP
async function handleSignup(e) {
  e.preventDefault(); 
  const n = document.getElementById('signupName').value.trim(); 
  const m = document.getElementById('signupEmail').value.trim(); 
  const p = document.getElementById('signupPhone').value.trim(); 
  const pw = document.getElementById('signupPassword').value; 
  const btn = document.getElementById('btnSignupSubmit');

  const usernameRegex = /^[a-z0-9_]{3,15}$/;
  if(!usernameRegex.test(n)) return showAlert('signupAlert', 'Username hanya boleh huruf kecil, angka, dan garis bawah (_). Tanpa spasi. 3-15 Karakter.');

  const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com)$/;
  if(!emailRegex.test(m)) return showAlert('signupAlert', 'Gunakan email format resmi (@gmail.com atau @yahoo.com).');

  btn.disabled=true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
  
  try {
    const fP = formatPhoneNumber(p);
    
    const { data: checkName } = await window.supabaseClient.from('users').select('id').eq('username', n).maybeSingle();
    if(checkName) throw new Error('Username ini sudah dipakai orang lain. Cari nama unik lain!');

    const { data: checkPhone } = await window.supabaseClient.from('users').select('id').eq('phone_number', fP).maybeSingle();
    if(checkPhone) throw new Error('Nomor HP ini sudah terdaftar.');
    
    const { data: checkEmail } = await window.supabaseClient.from('users').select('id').eq('email', m).maybeSingle();
    if(checkEmail) throw new Error('Email ini sudah terdaftar. Silakan gunakan email lain.');

    const { data, error } = await window.supabaseClient.auth.signUp({ 
      email: m, password: pw, options: { data: { full_name: n, phone_number: fP } } 
    });
    
    if(error) throw error;
    
    if(data.user) {
      await window.supabaseClient.from('users').upsert({ id: data.user.id, username: n, email: m, phone_number: fP });
      closeSignupModal(); 
      showVerifyEmailModal();
    }
  } catch(err) { 
    showAlert('signupAlert', err.message); 
  } finally { 
    btn.disabled=false; btn.innerHTML = 'Buat Akun'; 
  }
}

async function handleLogout() { 
  if(window.supabaseClient) await window.supabaseClient.auth.signOut(); 
  localStorage.removeItem('bf_user'); 
  
  // Hapus memori tema saat logout dan reset ke default
  localStorage.removeItem('bf_theme'); 
  if(typeof window.setTheme === 'function') window.setTheme('default');

  window.transactions=[]; 
  if(typeof window.renderData==='function') window.renderData(); 
  updateAuthUI(); 
  if(typeof speak==='function') speak("Keluar."); 
}

updateAuthUI();

// ==========================================
// PROXY SETTHEME: SIMPAN TEMA SPESIFIK AKUN
// ==========================================
if (typeof window.setTheme === 'function') {
  const originalSetTheme = window.setTheme;
  
  window.setTheme = function(themeName) {
    originalSetTheme(themeName); // Jalankan fungsi ganti tema aslinya (ubah warna, partikel)

    // Jika ada user yang login, simpan nama temanya dengan kunci ID mereka
    const user = getCurrentUser();
    if (user) {
      localStorage.setItem('bf_theme_' + user.id, themeName);
    }
  };
}