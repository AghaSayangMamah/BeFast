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

  if (window.myChart) {
    window.myChart.destroy();
  }

  // --- PLUGIN KHUSUS: Duel Angka ---
  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: function(chart) {
      if (totalFinance === 0) return;
      let ctx = chart.ctx;
      ctx.save();
      
      let width = chart.chartArea.right - chart.chartArea.left;
      let height = chart.chartArea.bottom - chart.chartArea.top;
      let centerX = chart.chartArea.left + width / 2;
      let centerY = chart.chartArea.top + height / 2;

      let isIncomeWin = totalIn >= totalEx;
      let domVal = isIncomeWin ? totalIn : totalEx;
      let subVal = isIncomeWin ? totalEx : totalIn;
      
      let domColor = isIncomeWin ? "#10b981" : "#ef4444"; 
      let subColor = isIncomeWin ? "#ef4444" : "#10b981";

      let domText = (isIncomeWin ? "+ Rp " : "- Rp ") + domVal.toLocaleString('id-ID');
      let subText = (isIncomeWin ? "- Rp " : "+ Rp ") + subVal.toLocaleString('id-ID');

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.font = "800 13px 'Nunito', sans-serif";
      ctx.fillStyle = subColor;
      ctx.fillText(subText, centerX, centerY - 14);

      let domFontSize = (domText.length > 15) ? 18 : 22; 
      ctx.font = "900 " + domFontSize + "px 'Nunito', sans-serif";
      ctx.fillStyle = domColor;
      ctx.fillText(domText, centerX, centerY + 12);

      ctx.restore();
    }
  };

  window.myChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pemasukan', 'Pengeluaran'],
      datasets: [{
        data: [totalIn, totalEx],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 0,
        borderRadius: 20, 
        spacing: 8,       
        hoverOffset: 8    
      }]
    },
    plugins: [centerTextPlugin], 
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '85%', 
      layout: { padding: 10 },
      plugins: {
        // 1. MATIKAN LEGENDA BAWAAN CHART.JS YANG KAKU
        legend: { display: false }, 
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)', 
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
        datalabels: { display: false }
      }
    }
  });

  // 2. INJEKSI LEGENDA MANUAL (POSISI PRESISI DI TENGAH)
  let customLegend = document.getElementById('customChartLegend');
  if (!customLegend) {
    customLegend = document.createElement('div');
    customLegend.id = 'customChartLegend';
    // Menempatkan legenda dengan padding vertikal (py-4) dan jarak yang pas (gap-8)
    customLegend.className = 'flex justify-center items-center gap-8 py-5'; 
    ctx.parentElement.insertAdjacentElement('afterend', customLegend);
    
    // Hapus margin dasar kanvas agar jarak atas dan bawah seimbang
    ctx.parentElement.style.marginBottom = '0px'; 
  }
  
  // Tampilan UI Legenda Baru
// Tampilan UI Legenda Baru
  customLegend.innerHTML = `
    <div class="flex items-center gap-2">
      <div class="w-3.5 h-3.5 rounded-full bg-[#10b981]"></div>
      <span class="text-xs font-black theme-text">Pemasukan</span>
    </div>
    <div class="flex items-center gap-2">
      <div class="w-3.5 h-3.5 rounded-full bg-[#ef4444]"></div>
      <span class="text-xs font-black theme-text">Pengeluaran</span>
    </div>
  `;

// 3. LOGIKA INSIGHT AI BAWAH
  const aiBox = document.getElementById('aiAdvice');
  if (aiBox) {
    if (totalEx > totalIn && totalIn > 0) {
      aiBox.innerHTML = `⚠️ Pengeluaran mencapai <b>${Math.round((totalEx/totalIn)*100)}%</b> dari pemasukan. Rem dikit ya!`;
      // Tetap warna merah untuk bahaya, tapi pakai transparansi agar masuk di tema gelap
      aiBox.className = "p-3 bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-bold text-center rounded-xl mt-2";
    } else if (totalIn > totalEx) {
      aiBox.innerHTML = "✨ Keuangan sehat! Pertahankan tren positif ini.";
      // Bunglon: Mengikuti warna tema yang sedang aktif
      aiBox.className = "p-3 theme-bg-light theme-primary border border-gray-400/20 text-xs font-bold text-center rounded-xl mt-2";
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