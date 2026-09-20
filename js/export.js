function openExportModal() { if (!getCurrentUser()) { openLoginModal(); return; } document.getElementById('exportModal').classList.remove('hidden'); }
function closeExportModal() { document.getElementById('exportModal').classList.add('hidden'); }

function getBase64FromUrl(url) {
  return new Promise((resolve) => {
    let img = new Image(); img.crossOrigin = 'Anonymous';
    img.onload = () => { let canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height; let ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0); resolve(canvas.toDataURL('image/png')); };
    img.onerror = () => resolve(null); img.src = url;
  });
}

function getExpenseChartBase64(dataList) {
  return new Promise((resolve) => {
    const expenses = dataList.filter(t => t.type === 'pengeluaran'); if(expenses.length === 0) { resolve(null); return; }
    const catData = {}; expenses.forEach(t => { let c = t.category || detectCategory(t.desc, t.type); catData[c] = (catData[c] || 0) + t.amount; });
    const canvas = document.createElement('canvas'); canvas.width = 500; canvas.height = 350; const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 500, 350); 
    new Chart(ctx, {
      type: 'doughnut',
      data: { labels: Object.keys(catData), datasets: [{ data: Object.values(catData), backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'], borderWidth: 3, borderColor: '#ffffff', borderRadius: 4 }] },
      options: {
        responsive: false, animation: false, cutout: '60%', layout: { padding: 30 },
        plugins: { 
          title: { display: true, text: 'Komposisi Pengeluaran', font: { size: 16, family: 'sans-serif', weight: 'bold' } }, 
          legend: { position: 'right', labels: { usePointStyle: true, font: {family: 'sans-serif'} } },
          datalabels: {
            color: '#ffffff', backgroundColor: (ctx) => ctx.dataset.backgroundColor[ctx.dataIndex], borderRadius: 4, padding: 4,
            font: { weight: 'bold', size: 12 }, anchor: 'end', align: 'end', offset: 5,
            formatter: (value, ctx) => { let sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0); return sum === 0 ? '' : (value * 100 / sum).toFixed(0) + "%"; }
          }
        }
      }
    });
    setTimeout(() => { resolve(canvas.toDataURL('image/png')); }, 250);
  });
}

async function processExport() {
  const periodCmd = document.getElementById('exportPeriod').value; const format = document.querySelector('input[name="exportFormat"]:checked').value;
  let scope = { label: 'semua', func: () => true }; if (periodCmd !== 'semua') scope = parseDateScopeFromCommand(periodCmd);
  let filtered = transactions; if (scope.label !== 'semua') filtered = transactions.filter(scope.func);
  if (filtered.length === 0) return alert(`Tidak ada data transaksi untuk periode: ${scope.label}`);

  const btn = document.getElementById('btnProcessExport'); btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Merender Visual...';
  const logoB64 = await getBase64FromUrl('LOGO FIX.png'); const chartB64 = await getExpenseChartBase64(filtered);

  setTimeout(async () => {
    if (format === 'excel') await generateExcel(filtered, scope.label, logoB64, chartB64); else generatePDF(filtered, scope.label, logoB64, chartB64);
    btn.innerHTML = 'Download Sekarang <i class="fa-solid fa-arrow-down"></i>'; closeExportModal(); 
    if(typeof speak === 'function') speak(`Dokumen visual ${format} untuk periode ${scope.label} berhasil didownload.`);
  }, 300);
}

async function generateExcel(dataList, periodLabel, logoB64, chartB64) {
  const user = getCurrentUser(); const userName = user ? (user.user_metadata?.full_name || 'Pengguna') : 'Pengguna';
  let totalInc = dataList.filter(t => t.type === 'pemasukan').reduce((a,b) => a + b.amount, 0); let totalExp = dataList.filter(t => t.type === 'pengeluaran').reduce((a,b) => a + b.amount, 0);
  const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet('Laporan Keuangan');

  sheet.mergeCells('A1:E3'); const titleCell = sheet.getCell('A1'); titleCell.value = 'LAPORAN KEUANGAN BeFAST'; titleCell.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FFFFFFFF' } }; titleCell.alignment = { vertical: 'middle', horizontal: 'center' }; titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF496AF1' } };
  if (logoB64) { const logoId = workbook.addImage({ base64: logoB64, extension: 'png' }); sheet.addImage(logoId, { tl: { col: 0.2, row: 0.2 }, ext: { width: 55, height: 55 } }); }
  if (chartB64) { const chartId = workbook.addImage({ base64: chartB64, extension: 'png' }); sheet.addImage(chartId, { tl: { col: 6, row: 4 }, ext: { width: 500, height: 350 } }); }

  sheet.getCell('A5').value = 'Nama Pemilik:'; sheet.getCell('B5').value = userName; sheet.getCell('A6').value = 'Periode:'; sheet.getCell('B6').value = periodLabel.toUpperCase(); sheet.getCell('A5').font = { bold: true }; sheet.getCell('A6').font = { bold: true };
  sheet.getCell('D5').value = 'Total Pemasukan:'; sheet.getCell('E5').value = totalInc; sheet.getCell('D6').value = 'Total Pengeluaran:'; sheet.getCell('E6').value = totalExp; sheet.getCell('D7').value = 'Saldo Bersih:'; sheet.getCell('E7').value = totalInc - totalExp;
  ['E5', 'E6', 'E7'].forEach(c => { sheet.getCell(c).numFmt = '"Rp"#,##0'; sheet.getCell(c).font = { bold: true }; });
  sheet.getCell('E5').font.color = { argb: 'FF10B981' }; sheet.getCell('E6').font.color = { argb: 'FFEF4444' }; sheet.getCell('E7').font.color = { argb: 'FF496AF1' };

  const headerRow = sheet.getRow(9); headerRow.values = ['TANGGAL', 'KATEGORI', 'KETERANGAN', 'DEBIT (MASUK)', 'KREDIT (KELUAR)'];
  headerRow.eachCell((cell) => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }; cell.alignment = { horizontal: 'center', vertical: 'middle' }; cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }; });

  let currentRow = 10;
  dataList.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach((t, i) => {
    const row = sheet.getRow(currentRow); row.values = [t.date, t.category || detectCategory(t.desc, t.type), t.desc, t.type === 'pemasukan' ? t.amount : 0, t.type === 'pengeluaran' ? t.amount : 0];
    if(i % 2 === 0) row.eachCell({ includeEmpty: true }, cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }; });
    row.getCell(4).numFmt = '"Rp"#,##0'; row.getCell(5).numFmt = '"Rp"#,##0'; row.eachCell({ includeEmpty: true }, cell => { cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }; }); currentRow++;
  });
  sheet.getColumn(1).width = 15; sheet.getColumn(2).width = 25; sheet.getColumn(3).width = 40; sheet.getColumn(4).width = 20; sheet.getColumn(5).width = 20;

  const buffer = await workbook.xlsx.writeBuffer(); const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `BeFAST_Report_${periodLabel.replace(/\s/g, '_')}.xlsx`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

function generatePDF(dataList, periodLabel, logoB64, chartB64) {
  const { jsPDF } = window.jspdf; const doc = new jsPDF();
  const user = getCurrentUser(); const userName = user ? (user.user_metadata?.full_name || 'Pengguna') : 'Pengguna'; const printDate = new Date().toLocaleDateString('id-ID');
  let totalInc = dataList.filter(t => t.type === 'pemasukan').reduce((a,b) => a + b.amount, 0); let totalExp = dataList.filter(t => t.type === 'pengeluaran').reduce((a,b) => a + b.amount, 0);

  doc.setFillColor(73, 106, 241); doc.rect(0, 0, 210, 40, 'F');
  if (logoB64) doc.addImage(logoB64, 'PNG', 15, 10, 20, 20);
  doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("BeFAST FINANCIAL REPORT", 105, 20, { align: "center" }); doc.setFontSize(10); doc.text(`Periode: ${periodLabel.toUpperCase()}`, 105, 28, { align: "center" });
  
  doc.setTextColor(50, 50, 50); doc.setFontSize(10); doc.text(`Nama Akun   : ${userName}`, 14, 50); doc.text(`Tanggal Cetak : ${printDate}`, 14, 55);
  doc.setFont("helvetica", "bold"); doc.text(`Total Pemasukan   : Rp ${totalInc.toLocaleString('id-ID')}`, 14, 65); doc.text(`Total Pengeluaran : Rp ${totalExp.toLocaleString('id-ID')}`, 14, 70); doc.text(`Saldo Bersih      : Rp ${(totalInc - totalExp).toLocaleString('id-ID')}`, 14, 75);

  let tableStartY = 85; if (chartB64) { doc.addImage(chartB64, 'PNG', 115, 45, 80, 56); tableStartY = 110; }

  const tableData = dataList.sort((a,b) => new Date(b.date) - new Date(a.date)).map(t => [t.date, t.category || detectCategory(t.desc, t.type), t.desc, t.type === 'pemasukan' ? `Rp ${t.amount.toLocaleString('id-ID')}` : '-', t.type === 'pengeluaran' ? `Rp ${t.amount.toLocaleString('id-ID')}` : '-']);
  doc.autoTable({ startY: tableStartY, head: [['Tanggal', 'Kategori', 'Keterangan', 'Masuk', 'Keluar']], body: tableData, headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' }, alternateRowStyles: { fillColor: [249, 250, 251] }, columnStyles: { 0: { cellWidth: 25 }, 3: { halign: 'right' }, 4: { halign: 'right' } }, styles: { fontSize: 9 } });
  doc.save(`BeFAST_Report_${periodLabel.replace(/\s/g, '_')}.pdf`);
}

function showChartModal(scopeCmd) {
  const modal = document.getElementById('chartModal'); modal.classList.remove('hidden');
  let scope = parseDateScopeFromCommand(scopeCmd); let filtered = transactions; if (scope.label !== 'keseluruhan') filtered = transactions.filter(scope.func);
  let inc = filtered.filter(t => t.type === 'pemasukan').reduce((a,b) => a + b.amount, 0);
  let exp = filtered.filter(t => t.type === 'pengeluaran').reduce((a,b) => a + b.amount, 0);

  document.getElementById('modalTitle').innerText = `Grafik (${scope.label.toUpperCase()})`;
  const ctx = document.getElementById('financeChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: ['Pemasukan', 'Pengeluaran'], datasets: [{ data: [inc, exp], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 3, borderColor: '#ffffff', borderRadius: 8, hoverOffset: 6 }] },
    options: { 
      responsive: true, maintainAspectRatio: false, cutout: '65%', layout: { padding: 30 },
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { family: "'SF Pro Display', sans-serif", weight: 'bold' }, color: getComputedStyle(document.body).getPropertyValue('--text-main') } },
        datalabels: {
          color: '#ffffff', backgroundColor: (ctx) => ctx.dataset.backgroundColor[ctx.dataIndex], borderRadius: 6, padding: { top: 6, bottom: 6, left: 8, right: 8 },
          font: { weight: 'bold', size: 12 }, anchor: 'end', align: 'end', offset: 5,
          formatter: (value, ctx) => { let sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0); return sum === 0 ? '' : (value * 100 / sum).toFixed(0) + "%"; }
        }
      }
    }
  });

  let adviceText = "";
  if (inc === 0 && exp === 0) adviceText = "Belum ada transaksi pada periode ini.";
  else if (inc >= exp) adviceText = "Keuangan kamu aman banget gaes, sehat sentosa!";
  else adviceText = "Waduh pengeluaran kamu lagi lumayan jebol nih, rem dulu ya!";
  document.getElementById('aiAdvice').innerText = adviceText; 
  if(typeof speak === 'function') speak(`Nih grafik kamu. ${adviceText}`);
  if (modalTimer) clearTimeout(modalTimer); modalTimer = setTimeout(() => { closeChartModal(); }, 30000);
}