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

// LOGIKA BARU: Meracik dan Mendownload file Excel
async function processExport() {
  if (!transactions || transactions.length === 0) { alert("Tidak ada data transaksi untuk di-export!"); return; }
  
  const btn = document.getElementById('btnProcessExport');
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
  btn.disabled = true;

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Keuangan BeFAST');

    // Header Tabel
    worksheet.columns = [
      { header: 'Tanggal', key: 'date', width: 15 },
      { header: 'Jenis', key: 'type', width: 15 },
      { header: 'Kategori', key: 'category', width: 25 },
      { header: 'Keterangan', key: 'desc', width: 35 },
      { header: 'Nominal (Rp)', key: 'amount', width: 20 }
    ];

    // Styling Warna Header Tabel
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };

    // Isi Data ke Row
    transactions.forEach(t => {
      worksheet.addRow({
        date: t.date,
        type: t.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
        category: t.category,
        desc: t.desc,
        amount: t.amount
      });
    });

    // Proses Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `BeFAST_Laporan_${new Date().toISOString().slice(0,10)}.xlsx`;
    link.click();
    
    if(typeof speak === 'function') speak("Laporan Excel berhasil diunduh.");
    closeExportModal();
  } catch (e) {
    console.error("Gagal export:", e);
    alert("Terjadi kesalahan saat membuat file Excel.");
  } finally {
    btn.innerHTML = 'Download Excel/PDF';
    btn.disabled = false;
  }
}