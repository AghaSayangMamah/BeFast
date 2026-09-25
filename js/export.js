function openExportModal() { if (!getCurrentUser()) { openLoginModal(); return; } document.getElementById('exportModal').classList.remove('hidden'); }
function closeExportModal() { document.getElementById('exportModal').classList.add('hidden'); }

window.showChartModal = function(cmd) {
  const modal = document.getElementById('chartModal');
  if (modal) modal.classList.remove('hidden');

  const title = document.getElementById('modalTitle');
  if (title) title.innerText = `Ringkasan Keuangan`;

  const ctx = document.getElementById('financeChart');
  if (!ctx) return;

  // Ambil data transaksi
  let filtered = (typeof transactions !== 'undefined') ? transactions : [];
  if (typeof parseDateScopeFromCommand === 'function' && cmd) {
    let scope = parseDateScopeFromCommand(cmd);
    filtered = filtered.filter(t => scope.label === 'keseluruhan' ? true : scope.func(t));
  }

  let totalIn = filtered.filter(t => t.type === 'pemasukan').reduce((s, t) => s + Number(t.amount), 0);
  let totalEx = filtered.filter(t => t.type === 'pengeluaran').reduce((s, t) => s + Number(t.amount), 0);
  let totalFinance = totalIn + totalEx;
  let netBalance = totalIn - totalEx;

  // Hancurkan grafik lama
  if (window.myChart) {
    window.myChart.destroy();
  }

  // --- PLUGIN KHUSUS: Teks Saldo di Tengah Lingkaran ---
  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: function(chart) {
      if (totalFinance === 0) return;
      let width = chart.width, height = chart.height, ctx = chart.ctx;
      ctx.restore();
      
      // Teks "Saldo Bersih" (Kecil di atas)
      let fontSize2 = (height / 350).toFixed(2);
      ctx.font = "700 " + fontSize2 + "em 'Nunito', sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#94a3b8"; // abu-abu kalem
      let text2 = "Saldo Bersih";
      let text2X = Math.round((width - ctx.measureText(text2).width) / 2);
      ctx.fillText(text2, text2X, (height / 2) - 20);

      // Angka Saldo (Besar di tengah)
      let fontSize1 = (height / 150).toFixed(2);
      ctx.font = "900 " + fontSize1 + "em 'Nunito', sans-serif";
      ctx.fillStyle = netBalance >= 0 ? "#10b981" : "#ef4444";
      let text = "Rp " + Math.abs(netBalance).toLocaleString('id-ID');
      let textX = Math.round((width - ctx.measureText(text).width) / 2);
      ctx.fillText(text, textX, (height / 2) + 10);
      ctx.save();
    }
  };

  window.myChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pemasukan', 'Pengeluaran'],
      datasets: [{
        data: [totalIn, totalEx],
        backgroundColor: ['#10b981', '#ef4444'], // Hijau & Merah BeFAST
        borderWidth: 0,
        borderRadius: 20, // Bikin ujung potongan membulat seperti referensi
        spacing: 8,       // Jarak celah antar potongan warna
        hoverOffset: 8    // Efek pop-up halus saat disentuh
      }]
    },
    plugins: [centerTextPlugin], // Masukkan teks tengah
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '85%', // Cincin super tipis ala UI modern
      layout: { padding: 10 },
      plugins: {
        legend: {
          position: 'bottom', // Pindah ke bawah seperti referensi
          labels: { 
            usePointStyle: true, 
            boxWidth: 8, 
            padding: 20,
            font: { family: "'Nunito', sans-serif", weight: '800', size: 12, color: '#475569' } 
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)', // Tooltip gelap elegan
          titleFont: { family: "'Nunito', sans-serif", size: 13 },
          bodyFont: { family: "'Nunito', sans-serif", size: 14, weight: 'bold' },
          padding: 12,
          cornerRadius: 12,
          callbacks: {
            label: function(context) {
              let val = context.raw;
              let perc = totalFinance > 0 ? Math.round((val / totalFinance) * 100) : 0;
              return ` Rp ${val.toLocaleString('id-ID')} (${perc}%)`;
            }
          }
        },
        // Matikan plugin teks melayang lama (kalau masih aktif) biar bersih
        datalabels: { display: false }
      }
    }
  });

  // Percantik kotak saran AI di bawahnya
  const aiBox = document.getElementById('aiAdvice');
  if (aiBox) {
    if (totalEx > totalIn && totalIn > 0) {
      aiBox.innerHTML = `⚠️ Pengeluaran mencapai <b>${Math.round((totalEx/totalIn)*100)}%</b> dari pemasukan. Rem dikit ya!`;
      aiBox.className = "p-3 bg-red-50 text-red-600 text-xs font-bold text-center rounded-xl mt-4 border border-red-100";
    } else if (totalIn > totalEx) {
      aiBox.innerHTML = "✨ Keuangan sehat! Pertahankan tren positif ini.";
      aiBox.className = "p-3 bg-green-50 text-green-600 text-xs font-bold text-center rounded-xl mt-4 border border-green-100";
    } else {
      aiBox.style.display = 'none';
    }
  }

  if (cmd && typeof cmd === 'string' && !cmd.includes('klik_tombol')) {
    if (window.modalTimer) clearTimeout(window.modalTimer);
    window.modalTimer = setTimeout(() => { 
      const modalToClose = document.getElementById('chartModal');
      if (modalToClose) modalToClose.classList.add('hidden');
    }, 10000);
  }
};
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