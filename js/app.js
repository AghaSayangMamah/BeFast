function toggleManualForm() {
  const modal = document.getElementById('manualInputModal');
  if (modal.classList.contains('hidden')) modal.classList.remove('hidden');
  else modal.classList.add('hidden');
}

function openGuideModal() { document.getElementById('guideModal').classList.remove('hidden'); }
function closeGuideModal() { document.getElementById('guideModal').classList.add('hidden'); }
function closeChartModal() { document.getElementById('chartModal').classList.add('hidden'); if(modalTimer) clearTimeout(modalTimer); }
function togglePassword(inputId, iconId) {
  const input = document.getElementById(inputId); const icon = document.getElementById(iconId);
  if (input.type === "password") { input.type = "text"; icon.classList.replace('fa-eye', 'fa-eye-slash'); } 
  else { input.type = "password"; icon.classList.replace('fa-eye-slash', 'fa-eye'); }
}

function updateSummaryUI() {
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const chartContainer = document.getElementById('chartContainer');
  const emptyState = document.getElementById('emptyStateSummary');
  const emptyText = document.getElementById('emptyStateText');

  if (!user) {
    chartContainer.classList.add('hidden'); emptyState.classList.remove('hidden');
    emptyText.innerText = "Silakan masuk/daftar untuk melihat ringkasan keuanganmu.";
  } else if (typeof transactions !== 'undefined' && transactions.length === 0) {
    chartContainer.classList.add('hidden'); emptyState.classList.remove('hidden');
    emptyText.innerText = "Belum ada transaksi akhir-akhir ini. Yuk catat pengeluaran pertamamu!";
  } else {
    emptyState.classList.add('hidden'); chartContainer.classList.remove('hidden');
    renderMiniBarChart();
  }
  
  if(typeof updateAIInsight === 'function') updateAIInsight();
}

let miniChartInstance = null;
function renderMiniBarChart() {
  const ctx = document.getElementById('miniBarChart'); if(!ctx) return;
  if (miniChartInstance) miniChartInstance.destroy();
  
  const labels = [];
  const dataPoints = [];
  
  for(let i=6; i>=0; i--) {
    let d = new Date();
    d.setDate(d.getDate() - i);
    let dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    let displayDate = `${d.getDate()}/${d.getMonth()+1}`;
    
    let dailyExpense = transactions
        .filter(t => t.type === 'pengeluaran' && t.date === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);
        
    labels.push(displayDate);
    dataPoints.push(dailyExpense);
  }

  miniChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: dataPoints, 
        backgroundColor: '#ef4444', 
        borderRadius: 4, borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, datalabels: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#94a3b8' }, border: {display: false} },
        y: { display: false } 
      }
    }
  });
}

function updateAIInsight() {
  const insightTitle = document.getElementById('insightTitle');
  const insightDesc = document.getElementById('insightDesc');
  const insightIcon = document.getElementById('insightIcon');
  if(!insightTitle || !insightDesc) return;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyExpenses = transactions.filter(t => t.type === 'pengeluaran' && t.date.startsWith(currentMonth));

  if (monthlyExpenses.length === 0) {
    insightTitle.innerText = "Belum Ada Pola";
    insightDesc.innerText = "Yuk catat pengeluaran pertamamu bulan ini agar AI bisa menganalisa.";
    if(insightIcon) insightIcon.innerText = "💡";
    return;
  }

  const categoryTotals = {};
  monthlyExpenses.forEach(t => {
    const cat = t.category || 'Lain-lain';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
  });

  let maxCategory = ''; let maxAmount = 0;
  for (const [cat, amt] of Object.entries(categoryTotals)) {
    if (amt > maxAmount) { maxAmount = amt; maxCategory = cat; }
  }

  if (maxCategory === 'Makanan & Minuman') {
    insightTitle.innerText = "Pengeluaran makanmu mendominasi.";
    insightDesc.innerText = `Kurangi jajan/gofood biar lebih hemat! Kamu udah habis Rp ${maxAmount.toLocaleString('id-ID')} buat makan.`;
    if(insightIcon) insightIcon.innerText = "🍔";
  } else if (maxCategory === 'Belanja') {
    insightTitle.innerText = "Awas lapar mata!";
    insightDesc.innerText = `Pengeluaran belanja kamu tinggi (Rp ${maxAmount.toLocaleString('id-ID')}). Tahan dulu belanjanya ya.`;
    if(insightIcon) insightIcon.innerText = "🛍️";
  } else if (maxCategory === 'Transportasi') {
    insightTitle.innerText = "Biaya mobilitas bengkak.";
    insightDesc.innerText = `Kamu habis Rp ${maxAmount.toLocaleString('id-ID')} buat transportasi. Coba cari opsi lebih hemat.`;
    if(insightIcon) insightIcon.innerText = "🚗";
  } else {
    insightTitle.innerText = `Pengeluaran ${maxCategory} tertinggi.`;
    insightDesc.innerText = `Bulan ini kamu menghabiskan Rp ${maxAmount.toLocaleString('id-ID')} untuk ${maxCategory}. Tetap kontrol pengeluaranmu!`;
    if(insightIcon) insightIcon.innerText = "💡";
  }
}