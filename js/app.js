// --- SETUP TEMA MOOD ---
function setTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName); 
  localStorage.setItem('bf_theme', themeName);
}
const savedTheme = localStorage.getItem('bf_theme'); 
if(savedTheme) setTheme(savedTheme);

// --- SETUP CUSTOM DROPDOWN ---
function setupCustomDropdowns() {
  document.addEventListener('click', e => {
    const isDropdown = e.target.closest('.custom-dropdown');
    document.querySelectorAll('.options-list').forEach(list => { 
      if (!isDropdown || list !== isDropdown.querySelector('.options-list')) list.classList.add('hidden'); 
    });
  });

  document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
    const trigger = dropdown.querySelector('.select-trigger');
    const list = dropdown.querySelector('.options-list');
    if (!trigger || !list) return;

    const textSpan = trigger.querySelector('.selected-text');
    const hiddenInput = dropdown.dataset.id ? document.getElementById(dropdown.dataset.id) : null;

    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      list.classList.toggle('hidden');
    });

    list.querySelectorAll('li').forEach(option => {
      option.addEventListener('click', () => {
        if (textSpan && hiddenInput) {
          textSpan.innerHTML = option.innerHTML;
          hiddenInput.value = option.dataset.value || option.innerText.trim();
        }
        list.classList.add('hidden');
      });
    });
  });
}

// --- ANIMASI MASKOT ---
function playWelcomeAnimation(name) {
  const mascot = document.getElementById('mascotLogo');
  const bubble = document.getElementById('mascotBubble');
  
  let greetingText = name ? `Halo, selamat datang kembali ${name}! 👋` : `Halo, selamat datang! 👋`;
  let speakText = name ? `Halo, selamat datang kembali ${name}!` : `Halo, selamat datang!`;

  if(mascot && bubble) {
    mascot.classList.remove('animate-mascot-wave');
    void mascot.offsetWidth; 
    mascot.classList.add('animate-mascot-wave');
    
    bubble.innerText = greetingText;
    bubble.classList.remove('opacity-0');
    
    setTimeout(() => { bubble.classList.add('opacity-0'); }, 3000);
  }
  // Fungsi speak ada di voice.js
  if(typeof speak === 'function') speak(speakText);
}

// Handler UI Umum
function togglePassword(inputId, iconId) {
  const input = document.getElementById(inputId); const icon = document.getElementById(iconId);
  if (input.type === "password") { input.type = "text"; icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); } 
  else { input.type = "password"; icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
}

function toggleManualForm() {
  const form = document.getElementById('manualFormSection'); const btn = document.getElementById('btnToggleManual');
  if (form.classList.contains('hidden')) { form.classList.remove('hidden'); btn.innerHTML = '<i class="fa-solid fa-chevron-up text-[var(--primary)]"></i> Sembunyikan Input Manual'; } 
  else { form.classList.add('hidden'); btn.innerHTML = '<i class="fa-solid fa-keyboard text-[var(--primary)]"></i> Input manual disini'; }
}

// Modal Handlers (selain Auth & Export)
function openGuideModal() { document.getElementById('guideModal').classList.remove('hidden'); }
function closeGuideModal() { document.getElementById('guideModal').classList.add('hidden'); }
function closeChartModal() { document.getElementById('chartModal').classList.add('hidden'); if (modalTimer) clearTimeout(modalTimer); }

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  setupCustomDropdowns();
  
  setTimeout(() => {
    // getCurrentUser ada di auth.js
    if(typeof getCurrentUser === 'function') {
        const user = getCurrentUser();
        const userName = user ? (user.user_metadata?.full_name?.split(' ')[0] || 'User') : '';
        playWelcomeAnimation(userName);
    }
    
    const tooltip = document.getElementById('onboardingTooltip');
    if (tooltip) {
      tooltip.classList.remove('opacity-0');
      setTimeout(() => { tooltip.classList.add('opacity-0'); }, 6000);
    }
  }, 800);
});