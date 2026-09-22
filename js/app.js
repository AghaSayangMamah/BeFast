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
  
  // Data Chart Dummy (Bisa dikembangkan sesuai transaksi asli)
  miniChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
      datasets: [{
        data: [100, 200, 150, 400, 800, 300, 50], 
        backgroundColor: '#60a5fa', borderRadius: 4, borderSkipped: false
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