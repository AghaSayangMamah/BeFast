function openExportModal() { if (!getCurrentUser()) { openLoginModal(); return; } document.getElementById('exportModal').classList.remove('hidden'); }
function closeExportModal() { document.getElementById('exportModal').classList.add('hidden'); }

function showChartModal(cmd) {
  const modal = document.getElementById('chartModal'); modal.classList.remove('hidden');
  let inc = transactions.filter(t => t.type === 'pemasukan').reduce((a,b) => a + b.amount, 0);
  let exp = transactions.filter(t => t.type === 'pengeluaran').reduce((a,b) => a + b.amount, 0);

  const ctx = document.getElementById('financeChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: ['Pemasukan', 'Pengeluaran'], datasets: [{ data: [inc, exp], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 2 }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
  let txt = (inc===0&&exp===0)?"Belum ada data.":(inc>=exp)?"Keuangan sehat!":"Pengeluaran besar, awas boros!";
  document.getElementById('aiAdvice').innerText = txt; 
  if(typeof speak === 'function') speak(txt);
}

function processExport() {
  alert("Fungsi Export CSV dipanggil (Kode export Excel dihilangkan agar script pendek, kamu bisa copy dari sebelumnya jika butuh)");
  closeExportModal();
}