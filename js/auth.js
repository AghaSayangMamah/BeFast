function formatPhoneNumber(phone) { let c = phone.replace(/\D/g, ''); if(c.startsWith('0')) c = '62'+c.slice(1); return c; }

if (supabaseClient) {
  supabaseClient.auth.onAuthStateChange((event, session) => {
if (session && session.user) { 
        localStorage.setItem('bf_user', JSON.stringify(session.user)); 
        const userTheme = localStorage.getItem('bf_theme_' + session.user.id);
        if (userTheme && typeof setTheme === 'function') { setTheme(userTheme); }
        if(typeof fetchTransactionsFromSupabase === 'function') fetchTransactionsFromSupabase(); 
        
        // PANGGIL TOUR DI SINI SUPAYA PASTI MUNCUL PAS LOGIN
        if(typeof startOnboarding === 'function' && !localStorage.getItem('befast_tour_seen')) {
            setTimeout(startOnboarding, 1200);
        }
    }else if (event === 'SIGNED_OUT') { 
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
    let fname = user.user_metadata?.full_name || 'User';
    if(greetHead) greetHead.innerText = fname;
    if(greetCent) greetCent.innerText = `${fname} 👋`;
    const savedPic = localStorage.getItem('bf_profile_' + user.id);
    if (typeof updateProfilePicUI === 'function') updateProfilePicUI(savedPic || null);

    // --- KUNCI 1: PANGGIL TEMA SPESIFIK SAAT LOGIN / REFRESH ---
    const userTheme = localStorage.getItem('bf_theme_' + user.id);
    if (userTheme && typeof window.originalSetTheme === 'function') {
        window.originalSetTheme(userTheme);
    } else if (userTheme && typeof setTheme === 'function') {
        setTheme(userTheme);
    }
    // -----------------------------------------------------------

  } else {
    if (loggedOutDiv) loggedOutDiv.classList.remove('hidden'); 
    if (loggedInDiv) { loggedInDiv.classList.add('hidden'); loggedInDiv.classList.remove('flex'); }
    if(greetHead) greetHead.innerText = `User`;
    if(greetCent) greetCent.innerText = `User 👋`;
    
    // --- KUNCI 2: KEMBALIKAN KE DEFAULT SAAT BELUM LOGIN ---
    if(typeof window.originalSetTheme === 'function') {
        window.originalSetTheme('default');
    } else if (typeof setTheme === 'function') {
        setTheme('default');
    }
  }
  if(typeof updateSummaryUI === 'function') updateSummaryUI();
}

function openLoginModal() { document.getElementById('loginModal').classList.remove('hidden'); document.getElementById('signupModal').classList.add('hidden'); hideAlert('loginAlert'); }
function closeLoginModal() { document.getElementById('loginModal').classList.add('hidden'); }
function openSignupModal() { 
  document.getElementById('signupModal').classList.remove('hidden'); 
  document.getElementById('loginModal').classList.add('hidden'); 
  hideAlert('signupAlert'); 
  document.getElementById('signupName').placeholder = "Username unik (misal: izan_99)";
}
function closeSignupModal() { document.getElementById('signupModal').classList.add('hidden'); }
function switchAuthModal(to) { if (to === 'signup') openSignupModal(); else openLoginModal(); }

function showVerifyEmailModal() {
  const m = document.getElementById('verifyEmailModal'); 
  const p = document.getElementById('verifyProgressBar'); 
  const c = document.getElementById('verifyCountdown');
  
  if (!m) return; 
  
  // Munculkan popup
  m.classList.remove('hidden'); 
  
  // Bikin animasi bar berjalan mulus selama 3 detik mundur
  if (p) { 
    p.style.transition = 'none'; 
    p.style.width = '100%'; 
    setTimeout(() => { 
      p.style.transition = 'width 3s linear'; 
      p.style.width = '0%'; 
    }, 50); 
  }
  
  if(typeof speak === 'function') speak("Pendaftaran berhasil. Silakan cek email kamu untuk verifikasi.");
  
  let t = 3; // Diubah jadi 3 detik
  if(c) c.innerText = t;
  
  const iv = setInterval(() => {
    t--; 
    if(c) c.innerText = t;
    if(t <= 0) { 
        clearInterval(iv); 
        m.classList.add('hidden'); // Popup otomatis hilang
        // openLoginModal() sengaja dihapus agar tidak langsung masuk ke form login
    }
  }, 1000);
}

function showAlert(id, msg, isErr=true) {
  const el = document.getElementById(id); if(!el) return; el.innerText = msg;
  el.className = isErr ? "mb-4 p-3 rounded-xl text-xs font-bold bg-red-100 text-red-700 block text-center" : "mb-4 p-3 rounded-xl text-xs font-bold bg-green-100 text-green-700 block text-center";
}
function hideAlert(id) { const el = document.getElementById(id); if(el) el.className = "hidden"; }

async function handleLogin(e) {
  e.preventDefault(); const p = document.getElementById('loginPhone').value.trim(); const pw = document.getElementById('loginPassword').value; const btn = document.getElementById('btnLoginSubmit');
  if(!supabaseClient) return showAlert('loginAlert', 'Koneksi terputus.');
  btn.disabled=true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
  try {
    const { data: u, error: e1 } = await supabaseClient.from('users').select('email, username').eq('phone_number', formatPhoneNumber(p)).maybeSingle();
    if(e1 || !u?.email) throw new Error('Nomor HP tidak terdaftar.');
    const { error: e2 } = await supabaseClient.auth.signInWithPassword({ email: u.email, password: pw });
    if(e2) throw e2; closeLoginModal();
  } catch(err) { showAlert('loginAlert', err.message.includes('Invalid')?'Kata sandi salah.':err.message); } finally { btn.disabled=false; btn.innerHTML = 'Masuk Sekarang'; }
}

async function handleSignup(e) {
  e.preventDefault(); 
  const n = document.getElementById('signupName').value.trim(); 
  const m = document.getElementById('signupEmail').value.trim(); 
  const p = document.getElementById('signupPhone').value.trim(); 
  const pw = document.getElementById('signupPassword').value; 
  const btn = document.getElementById('btnSignupSubmit');

  const usernameRegex = /^\S+$/;
  if(!usernameRegex.test(n)) return showAlert('signupAlert', 'Username tidak boleh mengandung spasi.');

  const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com)$/;
  if(!emailRegex.test(m)) return showAlert('signupAlert', 'Gunakan email format resmi (@gmail.com atau @yahoo.com).');

  btn.disabled=true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
  
  try {
    const fP = formatPhoneNumber(p);
    
    const { data: checkName } = await supabaseClient.from('users').select('id').eq('username', n).maybeSingle();
    if(checkName) throw new Error('Username ini sudah dipakai orang lain. Cari nama unik lain!');

    const { data: checkPhone } = await supabaseClient.from('users').select('id').eq('phone_number', fP).maybeSingle();
    if(checkPhone) throw new Error('Nomor HP ini sudah terdaftar.');
    
    const { data: checkEmail } = await supabaseClient.from('users').select('id').eq('email', m).maybeSingle();
    if(checkEmail) throw new Error('Email ini sudah terdaftar. Silakan gunakan email lain.');

    const { data, error } = await supabaseClient.auth.signUp({ 
      email: m, password: pw, options: { data: { full_name: n, phone_number: fP } } 
    });
    
    if(error) throw error;
    
    if(data.user) {
      await supabaseClient.from('users').upsert({ id: data.user.id, username: n, email: m, phone_number: fP });
      closeSignupModal(); showVerifyEmailModal();
    }
  } catch(err) { 
    showAlert('signupAlert', err.message); 
  } finally { 
    btn.disabled=false; btn.innerHTML = 'Buat Akun'; 
  }
}

async function handleLogout() { 
  // 1. Perintahkan database untuk logout
  try {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      await supabaseClient.auth.signOut(); 
    } else if (window.supabaseClient) {
      await window.supabaseClient.auth.signOut();
    }
  } catch (e) { console.error("Logout error:", e); }

  // 2. Hapus memori user dan tema buatan kita
  localStorage.removeItem('bf_user'); 
  localStorage.removeItem('bf_theme'); 
  
  // 3. SAPU BERSIH kunci sesi Supabase yang nyangkut (Ini akar masalahnya)
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      localStorage.removeItem(key);
    }
  });

  // 4. Refresh halaman otomatis untuk mereset seluruh sistem ke Tech Blue
  window.location.reload();
}

// --- KUNCI 3: REKAM TEMA SAAT USER MENGGANTI TEMA ---
if (typeof setTheme === 'function' && !window.setThemeProxied) {
  window.originalSetTheme = setTheme; 
  window.setTheme = function(themeName) {
    window.originalSetTheme(themeName);
    const user = getCurrentUser();
    if (user) {
      // Simpan tema spesifik dengan nama ID user tersebut
      localStorage.setItem('bf_theme_' + user.id, themeName);
    }
  };
  window.setThemeProxied = true;
}

// --- FITUR GANTI FOTO PROFIL ---
function handleProfileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (file.size > 2 * 1024 * 1024) {
    return alert('Ukuran foto terlalu besar. Maksimal 2MB ya!');
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const base64Image = e.target.result;
    const user = getCurrentUser();
    if (user) {
      localStorage.setItem('bf_profile_' + user.id, base64Image);
      updateProfilePicUI(base64Image);
    }
  };
  reader.readAsDataURL(file);
}

function updateProfilePicUI(base64Image) {
  const imgEl = document.getElementById('userProfilePic');
  const iconEl = document.getElementById('userProfileIcon');
  if (imgEl && iconEl) {
    if (base64Image) {
      imgEl.src = base64Image;
      imgEl.classList.remove('hidden');
      iconEl.classList.add('hidden');
    } else {
      imgEl.src = '';
      imgEl.classList.add('hidden');
      iconEl.classList.remove('hidden');
    }
  }
}

// --- MODAL KONTROL LUPA SANDI ---
function openForgotEmailModal() {
  closeLoginModal();
  document.getElementById('forgotEmailModal').classList.remove('hidden');
}

function closeForgotEmailModal() {
  document.getElementById('forgotEmailModal').classList.add('hidden');
}

function closeForgotSuccessModal() {
  document.getElementById('forgotSuccessModal').classList.add('hidden');
  openLoginModal();
}

// 1. Kirim Email Reset Password
// 1. Kirim Email Reset Password dengan Validasi Ketat
async function handleSendResetEmail(e) {
  e.preventDefault();
  const email = document.getElementById('forgotEmailInput').value.trim().toLowerCase();
  const btn = document.getElementById('btnSendReset');

  if (!email) return alert('Masukkan email kamu.');

  // Validasi Format Email Resmi (Harus berakhiran @gmail.com atau @yahoo.com)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com)$/;
  if (!emailRegex.test(email)) {
    return alert('Format email tidak valid! Gunakan email yang benar (contoh: nama@gmail.com).');
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memeriksa...';

  try {
    // Validasi Cek Database: Apakah email ini terdaftar di tabel users?
    const { data: checkUser, error: dbError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (dbError || !checkUser) {
      throw new Error('Email ini tidak terdaftar di database kami. Pastikan email yang kamu masukkan benar.');
    }

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';

    // Jika email terbukti asli dan terdaftar, kirim tautan reset via Supabase Auth
    const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.href,
    });

    if (resetError) throw resetError;

    closeForgotEmailModal();
    document.getElementById('forgotSuccessModal').classList.remove('hidden');
    if (typeof speak === 'function') speak("Reset password sudah dikirim ke email kamu.");

  } catch (err) {
    alert(err.message || 'Gagal memproses permintaan.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Kirim Tautan Reset';
  }
}

// 2. Deteksi otomatis jika user membuka link dari email
if (supabaseClient) {
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      // Munculkan modal input sandi baru
      const modal = document.getElementById('newPasswordModal');
      if (modal) modal.classList.remove('hidden');
    }
  });
}

// 3. Simpan Password Baru & Konfirmasi
async function handleUpdateNewPassword(e) {
  e.preventDefault();
  const pass1 = document.getElementById('newPasswordInput').value;
  const pass2 = document.getElementById('confirmPasswordInput').value;
  const btn = document.getElementById('btnUpdatePassword');

  if (pass1.length < 6) {
    return alert('Kata sandi minimal harus 6 karakter.');
  }

  if (pass1 !== pass2) {
    return alert('Konfirmasi kata sandi tidak cocok! Pastikan keduanya sama.');
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

  try {
    const { error } = await supabaseClient.auth.updateUser({ password: pass1 });
    if (error) throw error;

    alert('Kata sandi berhasil diperbarui! Silakan masuk kembali menggunakan sandi baru.');
    document.getElementById('newPasswordModal').classList.add('hidden');
    if (typeof speak === 'function') speak("Kata sandi berhasil diperbarui.");
    
    // Logout otomatis agar user login ulang dengan aman
    await handleLogout();
  } catch (err) {
    alert('Gagal memperbarui sandi: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Simpan Sandi Baru';
  }
}

// --- MODAL KONTROL LUPA SANDI ---
function openForgotEmailModal() {
  closeLoginModal();
  document.getElementById('forgotEmailModal').classList.remove('hidden');
  hideAlert('forgotAlert'); // Bersihkan pesan error sebelumnya jika ada
}

function closeForgotEmailModal() {
  document.getElementById('forgotEmailModal').classList.add('hidden');
}

function closeForgotSuccessModal() {
  document.getElementById('forgotSuccessModal').classList.add('hidden');
  openLoginModal();
}

// Fungsi helper penampil error khusus untuk modal Lupa Sandi
function showForgotAlert(msg) {
  let alertEl = document.getElementById('forgotAlert');
  if (!alertEl) {
    // Jika elemen alert belum ada di HTML modal, buat secara dinamis di atas form
    const formEl = document.querySelector('#forgotEmailModal form');
    alertEl = document.createElement('div');
    alertEl.id = 'forgotAlert';
    formEl.insertBefore(alertEl, formEl.firstChild);
  }
  alertEl.innerText = msg;
  alertEl.className = "mb-4 p-3 rounded-xl text-xs font-bold bg-red-100 text-red-700 block text-center";
}

// 1. Kirim Email Reset Password dengan Pop-up UI (Bukan Alert Browser)
async function handleSendResetEmail(e) {
  e.preventDefault();
  const email = document.getElementById('forgotEmailInput').value.trim().toLowerCase();
  const btn = document.getElementById('btnSendReset');

  if (!email) return showForgotAlert('Masukkan email kamu.');

  const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com)$/;
  if (!emailRegex.test(email)) {
    return showForgotAlert('Format email tidak valid! Gunakan email yang benar (contoh: nama@gmail.com).');
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memeriksa...';

  try {
    const { data: checkUser, error: dbError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (dbError || !checkUser) {
      throw new Error('Email ini tidak terdaftar di database kami. Pastikan email yang kamu masukkan benar.');
    }

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';

    const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    });

    if (resetError) throw resetError;

    closeForgotEmailModal();
    document.getElementById('forgotSuccessModal').classList.remove('hidden');
    if (typeof speak === 'function') speak("Reset password sudah dikirim ke email kamu.");
  } catch (err) {
    showForgotAlert(err.message || 'Gagal memproses permintaan.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Kirim Tautan Reset';
  }
}

// 2. DETEKSI TOKEN HASH DARI URL EMAIL SUPABASE (Agar modal sandi baru langsung muncul)
window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash;
  if (hash && hash.includes('type=recovery')) {
    const modal = document.getElementById('newPasswordModal');
    if (modal) modal.classList.remove('hidden');
  }
});

if (supabaseClient) {
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      const modal = document.getElementById('newPasswordModal');
      if (modal) modal.classList.remove('hidden');
    }
  });
}

// 3. Simpan Password Baru & Konfirmasi
async function handleUpdateNewPassword(e) {
  e.preventDefault();
  const pass1 = document.getElementById('newPasswordInput').value;
  const pass2 = document.getElementById('confirmPasswordInput').value;
  const btn = document.getElementById('btnUpdatePassword');

  if (pass1.length < 6) {
    return alert('Kata sandi minimal harus 6 karakter.');
  }

  if (pass1 !== pass2) {
    return alert('Konfirmasi kata sandi tidak cocok! Pastikan keduanya sama.');
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

  try {
    const { error } = await supabaseClient.auth.updateUser({ password: pass1 });
    if (error) throw error;

    alert('Kata sandi berhasil diperbarui! Silakan masuk kembali menggunakan sandi baru.');
    document.getElementById('newPasswordModal').classList.add('hidden');
    if (typeof speak === 'function') speak("Kata sandi berhasil diperbarui.");
    
    // Hapus hash token dari URL agar bersih
    history.replaceState(null, null, window.location.pathname);
    
    await handleLogout();
  } catch (err) {
    alert('Gagal memperbarui sandi: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Simpan Sandi Baru';
  }
}

updateAuthUI();