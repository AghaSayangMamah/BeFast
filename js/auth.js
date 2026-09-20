function formatPhoneNumber(phone) { let cleaned = phone.replace(/\D/g, ''); if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1); return cleaned; }

if (supabaseClient) {
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session && session.user) { 
        localStorage.setItem('bf_user', JSON.stringify(session.user)); 
        if(typeof fetchTransactionsFromSupabase === 'function') fetchTransactionsFromSupabase(); 
    } 
    else if (event === 'SIGNED_OUT') { 
        localStorage.removeItem('bf_user'); 
        transactions = []; 
        if(typeof renderData === 'function') renderData(); 
    }
    updateAuthUI();
  });
}

function getCurrentUser() { try { return localStorage.getItem('bf_user') ? JSON.parse(localStorage.getItem('bf_user')) : null; } catch (e) { return null; } }

function updateAuthUI() {
  const user = getCurrentUser(); 
  const loggedOutDiv = document.getElementById('authLoggedOut'); 
  const loggedInDiv = document.getElementById('authLoggedIn'); 
  const greetingSpan = document.getElementById('userGreeting');
  if (user) {
    if (loggedOutDiv) loggedOutDiv.classList.add('hidden'); if (loggedInDiv) loggedInDiv.classList.remove('hidden');
    if (greetingSpan) greetingSpan.innerText = `Hai, ${user.user_metadata?.full_name?.split(' ')[0] || 'User'}`;
  } else {
    if (loggedOutDiv) loggedOutDiv.classList.remove('hidden'); if (loggedInDiv) loggedInDiv.classList.add('hidden');
  }
}

function openLoginModal() { document.getElementById('loginModal').classList.remove('hidden'); document.getElementById('signupModal').classList.add('hidden'); hideAuthAlert('loginAlert'); }
function closeLoginModal() { document.getElementById('loginModal').classList.add('hidden'); }
function openSignupModal() { document.getElementById('signupModal').classList.remove('hidden'); document.getElementById('loginModal').classList.add('hidden'); hideAuthAlert('signupAlert'); }
function closeSignupModal() { document.getElementById('signupModal').classList.add('hidden'); }
function switchAuthModal(to) { if (to === 'signup') openSignupModal(); else openLoginModal(); }

function showAuthAlert(id, msg, isError = true) {
  const el = document.getElementById(id); if (!el) return; el.innerText = msg;
  el.className = isError ? "mb-4 p-3 rounded-full text-[11px] md:text-xs font-bold bg-red-100 text-red-700 block" : "mb-4 p-3 rounded-full text-[11px] md:text-xs font-bold bg-green-100 text-green-700 block";
}
function hideAuthAlert(id) { const el = document.getElementById(id); if (el) el.className = "hidden mb-4 p-3 rounded-full text-xs font-semibold"; }

async function handleLogin(e) {
  e.preventDefault(); const phoneInput = document.getElementById('loginPhone').value.trim(); const password = document.getElementById('loginPassword').value; const btn = document.getElementById('btnLoginSubmit');
  if (!supabaseClient) return showAuthAlert('loginAlert', 'Koneksi database terputus.');
  btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
  try {
    const formattedPhone = formatPhoneNumber(phoneInput);
    const { data: userData, error: userError } = await supabaseClient.from('users').select('email, username').eq('phone_number', formattedPhone).single();
    if (userError || !userData || !userData.email) throw new Error('Nomor HP tidak ditemukan. Daftar dahulu.');
    const { error } = await supabaseClient.auth.signInWithPassword({ email: userData.email, password: password });
    if (error) throw error; 
    
    closeLoginModal();
    const userName = userData.username?.split(' ')[0] || 'User';
    if(typeof playWelcomeAnimation === 'function') playWelcomeAnimation(userName);

  } catch (err) { showAuthAlert('loginAlert', err.message.includes('Invalid') ? 'Sandi salah.' : err.message); } finally { btn.disabled = false; btn.innerHTML = 'Masuk Sekarang'; }
}

async function handleSignup(e) {
  e.preventDefault(); const name = document.getElementById('signupName').value.trim(); const email = document.getElementById('signupEmail').value.trim(); const phoneInput = document.getElementById('signupPhone').value.trim(); const password = document.getElementById('signupPassword').value; const btn = document.getElementById('btnSignupSubmit');
  const allowedDomains = ['@gmail.com', '@yahoo.com', '@outlook.com', '@icloud.com', '@student.ac.id'];
  if (!allowedDomains.some(domain => email.toLowerCase().endsWith(domain))) return showAuthAlert('signupAlert', 'Gunakan email resmi (misal: @gmail.com)');
  if (!supabaseClient) return showAuthAlert('signupAlert', 'Koneksi terputus.');
  btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mendaftarkan...';
  try {
    const formattedPhone = formatPhoneNumber(phoneInput);
    const { data: existingUser } = await supabaseClient.from('users').select('id').eq('phone_number', formattedPhone).single();
    if (existingUser) throw new Error('Nomor sudah terdaftar.');
    const { data, error } = await supabaseClient.auth.signUp({ email: email, password: password, options: { data: { full_name: name, phone_number: formattedPhone } } });
    if (error) throw error;
    if (data.user) {
      await supabaseClient.from('users').upsert({ id: data.user.id, username: name, email: email, phone_number: formattedPhone });
      showAuthAlert('signupAlert', 'Pendaftaran berhasil!', false); 
      setTimeout(() => { closeSignupModal(); if(typeof playWelcomeAnimation === 'function') playWelcomeAnimation(name.split(' ')[0]); }, 1000);
    }
  } catch (err) { showAuthAlert('signupAlert', err.message); } finally { btn.disabled = false; btn.innerHTML = 'Buat Akun Sekarang'; }
}

async function handleLogout() { 
    if (supabaseClient) await supabaseClient.auth.signOut(); 
    localStorage.removeItem('bf_user'); 
    transactions = []; 
    if(typeof renderData === 'function') renderData(); 
    updateAuthUI(); 
    if(typeof speak === 'function') speak("Kamu berhasil keluar."); 
}

// Inisialisasi awal auth
updateAuthUI();