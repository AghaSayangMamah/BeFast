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
}

let miniChartInstance = null;
function renderMiniBarChart() {
  const ctx = document.getElementById('miniBarChart'); if(!ctx) return;
  if (miniChartInstance) miniChartInstance.destroy();
  
  // LOGIKA BARU: Kalkulasi Pengeluaran 7 Hari Terakhir
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
        backgroundColor: '#ef4444', // Merah (Khas Pengeluaran)
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