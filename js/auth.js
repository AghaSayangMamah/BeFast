function formatPhoneNumber(phone) { let c = phone.replace(/\D/g, ''); if(c.startsWith('0')) c = '62'+c.slice(1); return c; }

if (supabaseClient) {
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session && session.user) { 
        localStorage.setItem('bf_user', JSON.stringify(session.user)); 
        if(typeof fetchTransactionsFromSupabase === 'function') fetchTransactionsFromSupabase(); 
    } else if (event === 'SIGNED_OUT') { 
        localStorage.removeItem('bf_user'); transactions = []; 
        if(typeof renderData === 'function') renderData(); 
    }
    updateAuthUI();
  });
}

function getCurrentUser() { try { return localStorage.getItem('bf_user') ? JSON.parse(localStorage.getItem('bf_user')) : null; } catch(e){return null;} }

function updateAuthUI() {
  const user = getCurrentUser(); 
  const loggedOutDiv = document.getElementById('authLoggedOut'); 
  const loggedInDiv = document.getElementById('authLoggedIn'); 
  
  const greetHead = document.getElementById('userGreetingHeader');
  const greetCent = document.getElementById('userGreetingCenter');
  
  if (user) {
    if (loggedOutDiv) loggedOutDiv.classList.add('hidden'); 
    if (loggedInDiv) { loggedInDiv.classList.remove('hidden'); loggedInDiv.classList.add('flex'); }
    let fname = user.user_metadata?.full_name?.split(' ')[0] || 'User';
    if(greetHead) greetHead.innerText = `Hai, ${fname}`;
    if(greetCent) greetCent.innerText = `${fname} 👋`;
  } else {
    if (loggedOutDiv) loggedOutDiv.classList.remove('hidden'); 
    if (loggedInDiv) { loggedInDiv.classList.add('hidden'); loggedInDiv.classList.remove('flex'); }
    if(greetHead) greetHead.innerText = `Hai, User`;
    if(greetCent) greetCent.innerText = `User 👋`;
  }
  if(typeof updateSummaryUI === 'function') updateSummaryUI();
}

function openLoginModal() { document.getElementById('loginModal').classList.remove('hidden'); document.getElementById('signupModal').classList.add('hidden'); hideAlert('loginAlert'); }
function closeLoginModal() { document.getElementById('loginModal').classList.add('hidden'); }
function openSignupModal() { document.getElementById('signupModal').classList.remove('hidden'); document.getElementById('loginModal').classList.add('hidden'); hideAlert('signupAlert'); }
function closeSignupModal() { document.getElementById('signupModal').classList.add('hidden'); }
function switchAuthModal(to) { if (to === 'signup') openSignupModal(); else openLoginModal(); }

function showVerifyEmailModal() {
  const m = document.getElementById('verifyEmailModal'); const p = document.getElementById('verifyProgressBar'); const c = document.getElementById('verifyCountdown');
  m.classList.remove('hidden'); p.classList.remove('animate-shrink'); void p.offsetWidth; p.classList.add('animate-shrink');
  if(typeof speak === 'function') speak("Pendaftaran berhasil. Silakan cek email kamu untuk verifikasi.");
  let t = 6; c.innerText = t;
  const iv = setInterval(() => {
    t--; c.innerText = t;
    if(t <= 0) { clearInterval(iv); m.classList.add('hidden'); openLoginModal(); }
  }, 1000);
}

function showAlert(id, msg, isErr=true) {
  const el = document.getElementById(id); if(!el) return; el.innerText = msg;
  el.className = isErr ? "mb-4 p-3 rounded-full text-xs font-bold bg-red-100 text-red-700 block" : "mb-4 p-3 rounded-full text-xs font-bold bg-green-100 text-green-700 block";
}
function hideAlert(id) { const el = document.getElementById(id); if(el) el.className = "hidden"; }

async function handleLogin(e) {
  e.preventDefault(); const p = document.getElementById('loginPhone').value.trim(); const pw = document.getElementById('loginPassword').value; const btn = document.getElementById('btnLoginSubmit');
  if(!supabaseClient) return showAlert('loginAlert', 'Koneksi terputus.');
  btn.disabled=true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
  try {
    const { data: u, error: e1 } = await supabaseClient.from('users').select('email, username').eq('phone_number', formatPhoneNumber(p)).single();
    if(e1 || !u?.email) throw new Error('HP tidak terdaftar.');
    const { error: e2 } = await supabaseClient.auth.signInWithPassword({ email: u.email, password: pw });
    if(e2) throw e2; closeLoginModal();
  } catch(err) { showAlert('loginAlert', err.message.includes('Invalid')?'Sandi salah.':err.message); } finally { btn.disabled=false; btn.innerHTML = 'Masuk Sekarang'; }
}

async function handleSignup(e) {
  e.preventDefault(); const n = document.getElementById('signupName').value.trim(); const m = document.getElementById('signupEmail').value.trim(); const p = document.getElementById('signupPhone').value.trim(); const pw = document.getElementById('signupPassword').value; const btn = document.getElementById('btnSignupSubmit');
  if(!['@gmail.com','@yahoo.com'].some(d=>m.toLowerCase().endsWith(d))) return showAlert('signupAlert','Pakai email resmi (@gmail.com)');
  btn.disabled=true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
  try {
    const fP = formatPhoneNumber(p);
    const { data: d1 } = await supabaseClient.from('users').select('id').eq('phone_number', fP).single();
    if(d1) throw new Error('HP sudah terdaftar.');
    const { data, error } = await supabaseClient.auth.signUp({ email: m, password: pw, options: { data: { full_name: n, phone_number: fP } } });
    if(error) throw error;
    if(data.user) {
      await supabaseClient.from('users').upsert({ id: data.user.id, username: n, email: m, phone_number: fP });
      closeSignupModal(); showVerifyEmailModal();
    }
  } catch(err) { showAlert('signupAlert', err.message); } finally { btn.disabled=false; btn.innerHTML = 'Buat Akun'; }
}

async function handleLogout() { if(supabaseClient) await supabaseClient.auth.signOut(); localStorage.removeItem('bf_user'); transactions=[]; if(typeof renderData==='function') renderData(); updateAuthUI(); if(typeof speak==='function') speak("Keluar."); }

updateAuthUI();