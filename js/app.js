/* =========================================
   MESIN PARTIKEL HYBRID (CANVAS 60FPS)
   ========================================= */
const canvas = document.createElement('canvas');
canvas.id = 'themeFX';
document.body.insertBefore(canvas, document.body.firstChild);
const ctx = canvas.getContext('2d');

const imgSakura = new Image(); imgSakura.src = 'sakura.png';

let particlesArray = [];
let currentThemeFX = 'default';

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas); resizeCanvas();

class HybridParticle {
  constructor(theme) {
    this.theme = theme;
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.angle = Math.random() * 360;
    this.spin = (Math.random() * 0.02) - 0.01; 
    this.opacity = Math.random() * 0.6 + 0.2;

    if (theme === 'pink') { 
      this.y = (Math.random() * canvas.height) - canvas.height;
      this.speedY = Math.random() * 1.5 + 0.5; this.speedX = Math.random() * 1.5 - 0.5; this.size = Math.random() * 25 + 15; 
    } else if (theme === 'dark') { 
      this.isMeteor = Math.random() > 0.8;
      this.speedY = this.isMeteor ? (Math.random() * 2 + 2) : (Math.random() * 0.2 - 0.1); 
      this.speedX = this.isMeteor ? -(Math.random() * 2 + 2) : -(Math.random() * 0.2 - 0.1); 
      this.size = this.isMeteor ? (Math.random() * 30 + 20) : (Math.random() * 2 + 1); 
    }
  }

  update() {
    this.x += this.speedX; this.y += this.speedY; this.angle += this.spin;
    if (this.theme === 'pink' && this.y > canvas.height + 50) { this.y = -50; this.x = Math.random() * canvas.width; } 
    else if (this.theme === 'dark' && (this.y > canvas.height + 50 || this.x < -50)) { this.y = -50; this.x = Math.random() * canvas.width + canvas.width/2; }
  }

  draw() {
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
    if (this.theme === 'pink') {
      if (imgSakura.complete && imgSakura.naturalHeight !== 0) { ctx.globalAlpha = this.opacity; ctx.drawImage(imgSakura, -this.size/2, -this.size/2, this.size, this.size); }
    } else if (this.theme === 'dark') {
      ctx.globalAlpha = this.opacity; ctx.fillStyle = '#ffffff';
      if (this.isMeteor) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(this.size, -this.size); ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`; ctx.lineWidth = 1.5; ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 0, this.isMeteor ? 1.5 : this.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}

function initParticles(theme) {
  currentThemeFX = theme; particlesArray = [];
  if (theme === 'default') return; 
  let particleCount = theme === 'dark' ? 15 : 20; 
  for (let i = 0; i < particleCount; i++) particlesArray.push(new HybridParticle(theme));
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < particlesArray.length; i++) { particlesArray[i].update(); particlesArray[i].draw(); }
  requestAnimationFrame(animateParticles);
}
animateParticles();

// --- KONTROL TEMA YANG DIPERBAIKI ---
function setTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName); // HARUS element ini agar CSS jalan
  localStorage.setItem('bf_theme', themeName);
  initParticles(themeName);
}
const savedTheme = localStorage.getItem('bf_theme') || 'default';
setTheme(savedTheme);


/* =========================================
   LOGIKA APLIKASI UTAMA
   ========================================= */
function toggleUserMenu(event) { if (event) event.stopPropagation(); const m = document.getElementById('userDropdownMenu'); if (m) { m.classList.toggle('hidden'); m.classList.toggle('flex'); } }
function toggleThemeMenu(event) { if (event) event.stopPropagation(); const m = document.getElementById('themeDropdownMenu'); if (m) { m.classList.toggle('hidden'); m.classList.toggle('flex'); } }

document.addEventListener('click', (e) => {
  const u = document.getElementById('userDropdownMenu'); if(u && !u.classList.contains('hidden') && !e.target.closest('#userDropdownMenu')) { u.classList.add('hidden'); u.classList.remove('flex'); }
  const t = document.getElementById('themeDropdownMenu'); if(t && !t.classList.contains('hidden') && !e.target.closest('#themeDropdownMenu')) { t.classList.add('hidden'); t.classList.remove('flex'); }
});

function toggleManualForm() { const m = document.getElementById('manualInputModal'); if (m.classList.contains('hidden')) m.classList.remove('hidden'); else m.classList.add('hidden'); }
function openGuideModal() { document.getElementById('guideModal').classList.remove('hidden'); }
function closeGuideModal() { document.getElementById('guideModal').classList.add('hidden'); }
function closeChartModal() { document.getElementById('chartModal').classList.add('hidden'); if(modalTimer) clearTimeout(modalTimer); }
function togglePassword(i, ic) { const input = document.getElementById(i); const icon = document.getElementById(ic); if (input.type === "password") { input.type = "text"; icon.classList.replace('fa-eye', 'fa-eye-slash'); } else { input.type = "password"; icon.classList.replace('fa-eye-slash', 'fa-eye'); } }

function updateSummaryUI() {
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null; const cc = document.getElementById('chartContainer'); const es = document.getElementById('emptyStateSummary'); const et = document.getElementById('emptyStateText');
  if (!user) { cc.classList.add('hidden'); es.classList.remove('hidden'); et.innerText = "Silakan masuk untuk melihat ringkasan keuanganmu."; } 
  else if (typeof transactions !== 'undefined' && transactions.length === 0) { cc.classList.add('hidden'); es.classList.remove('hidden'); et.innerText = "Belum ada transaksi akhir-akhir ini."; } 
  else { es.classList.add('hidden'); cc.classList.remove('hidden'); renderMiniBarChart(); }
  if(typeof updateAIInsight === 'function') updateAIInsight();
}

let miniChartInstance = null;
function renderMiniBarChart() {
  const ctx = document.getElementById('miniBarChart'); if(!ctx) return; if (miniChartInstance) miniChartInstance.destroy();
  const labels = []; const expenseData = []; const incomeData = [];
  
  for(let i=6; i>=0; i--) {
    let d = new Date(); 
    d.setDate(d.getDate() - i); 
    let dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    
    // Perbaikan format label: menggunakan padStart agar menjadi DD/MM
    labels.push(`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`);
    
    expenseData.push(transactions.filter(t => t.type === 'pengeluaran' && t.date === dateStr).reduce((s, t) => s + t.amount, 0));
    incomeData.push(transactions.filter(t => t.type === 'pemasukan' && t.date === dateStr).reduce((s, t) => s + t.amount, 0));
  }
  
  miniChartInstance = new Chart(ctx, { 
    type: 'bar', 
    data: { 
      labels: labels, 
      datasets: [ 
        { label: 'Pemasukan', data: incomeData, backgroundColor: '#10b981', borderRadius: 4 }, 
        { label: 'Pengeluaran', data: expenseData, backgroundColor: '#ef4444', borderRadius: 4 } 
      ] 
    }, 
    options: { 
      responsive: true, 
      maintainAspectRatio: false, 
      plugins: { legend: { display: false }, datalabels: { display: false } }, 
      scales: { 
        x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#94a3b8' }, border: {display: false} }, 
        // MEMPERBAIKI MASALAH TERTINDIH (Logarithmic Scale)
        y: { 
          display: false, 
          type: 'logarithmic', 
          min: 1 // Angka minimal tidak boleh 0 jika logaritmik, kita set 1
        } 
      } 
    } 
  });
}
function updateAIInsight() {
  const it = document.getElementById('insightTitle'); const id = document.getElementById('insightDesc'); const ic = document.getElementById('insightIcon'); if(!it || !id) return;
  const currentMonth = new Date().toISOString().slice(0, 7); const monthlyExp = transactions.filter(t => t.type === 'pengeluaran' && t.date.startsWith(currentMonth));
  if (monthlyExp.length === 0) { it.innerText = "Belum Ada Pola"; id.innerText = "Yuk catat pengeluaran pertamamu bulan ini."; if(ic) ic.innerText = "💡"; return; }
  const totals = {}; monthlyExp.forEach(t => { const c = t.category || 'Lain-lain'; totals[c] = (totals[c] || 0) + t.amount; });
  let maxCat = ''; let maxAmt = 0; for (const [c, a] of Object.entries(totals)) { if (a > maxAmt) { maxAmt = a; maxCat = c; } }
  if (maxCat === 'Makanan & Minuman') { it.innerText = "Pengeluaran makan mendominasi."; id.innerText = `Kurangi jajan biar hemat! Kamu udah habis Rp ${maxAmt.toLocaleString('id-ID')}.`; if(ic) ic.innerText = "🍔"; } 
  else if (maxCat === 'Belanja') { it.innerText = "Awas lapar mata!"; id.innerText = `Pengeluaran belanja kamu tinggi (Rp ${maxAmt.toLocaleString('id-ID')}).`; if(ic) ic.innerText = "🛍️"; } 
  else { it.innerText = `Pengeluaran ${maxCat} tertinggi.`; id.innerText = `Kamu menghabiskan Rp ${maxAmt.toLocaleString('id-ID')} untuk ${maxCat}.`; if(ic) ic.innerText = "💡"; }
}

function formatCurrencyInput(input) { let v = input.value.replace(/\D/g, ''); if (v) v = parseInt(v, 10).toLocaleString('id-ID'); input.value = v; }

function setupCustomDropdowns() {
  document.addEventListener('click', e => { const isD = e.target.closest('.custom-dropdown'); document.querySelectorAll('.options-list').forEach(l => { if (!isD || l !== isD.closest('.custom-dropdown').querySelector('.options-list')) l.classList.add('hidden'); }); });
  document.querySelectorAll('.custom-dropdown').forEach(d => {
    const t = d.querySelector('.select-trigger'); const l = d.querySelector('.options-list'); if (!t || !l) return;
    const s = t.querySelector('.selected-text'); const h = d.dataset.id ? document.getElementById(d.dataset.id) : null;
    t.addEventListener('click', (e) => { e.stopPropagation(); l.classList.toggle('hidden'); });
    l.querySelectorAll('li').forEach(o => { o.addEventListener('click', () => { if (s && h) { s.innerHTML = o.innerHTML; h.value = o.dataset.value || o.innerText.trim(); } l.classList.add('hidden'); }); });
  });
}

function setupDatePicker() {
  const d = document.getElementById('manualDate'); if (!d || typeof flatpickr !== 'function') return;
  flatpickr(d, { dateFormat: "Y-m-d", defaultDate: "today", locale: "id", disableMobile: true, animate: true, onReady: function(s, ds, i) { try { const yw = i.currentYearElement.parentNode; yw.style.display = 'none'; const mc = yw.parentNode; const ys = document.createElement('select'); ys.className = 'flatpickr-monthDropdown-months flatpickr-custom-year-select'; const cy = new Date().getFullYear(); for (let j = cy; j >= 2000; j--) { let o = document.createElement('option'); o.value = j; o.text = j; ys.appendChild(o); } ys.value = i.currentYear; mc.appendChild(ys); ys.addEventListener('change', function(e) { i.changeYear(parseInt(e.target.value)); }); i.customYearSelect = ys; } catch (err) {} }, onMonthChange: function(s, ds, i) { if(i.customYearSelect) i.customYearSelect.value = i.currentYear; }, onYearChange: function(s, ds, i) { if(i.customYearSelect) i.customYearSelect.value = i.currentYear; } });
}
document.addEventListener('DOMContentLoaded', () => { setupCustomDropdowns(); setupDatePicker(); });