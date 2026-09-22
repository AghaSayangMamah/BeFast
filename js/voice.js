function getLocalDateStr(dateObj = new Date()) { const year = dateObj.getFullYear(); const month = String(dateObj.getMonth() + 1).padStart(2, '0'); const day = String(dateObj.getDate()).padStart(2, '0'); return `${year}-${month}-${day}`; }
function getRelativeDateStr(modifier) {
  let d = new Date(); if (modifier === 'kemarin') d.setDate(d.getDate() - 1); else if (modifier === 'bulan_lalu') d.setMonth(d.getMonth() - 1); else if (modifier === 'tahun_lalu') d.setFullYear(d.getFullYear() - 1);
  const year = d.getFullYear(); const month = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0'); return { full: `${year}-${month}-${day}`, ym: `${year}-${month}`, year: `${year}` };
}

document.addEventListener('DOMContentLoaded', () => { const mDate = document.getElementById('manualDate'); if(mDate) mDate.value = getLocalDateStr(); });

function speak(text) {
  if (!('speechSynthesis' in window)) return; window.speechSynthesis.cancel(); 
  const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'id-ID'; utterance.rate = 1.05; 
  window.speechSynthesis.speak(utterance);
}

function parseNominal(str) {
  if (!str) return 0;
  let raw = str.toLowerCase().replace(/tanggal\s*\d{1,2}/gi, '').replace(/tahun\s*\d{4}/gi, '').replace(/rp|rupiah/gi, '').trim();
  let matches = raw.match(/\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d{1,3}(?:,\d{3})+(?:\.\d+)?/g);
  if(matches && matches.length > 0) {
    let maxVal = 0;
    for (let match of matches) { let cleanNumStr = match.split(',')[0].replace(/\./g, ''); let val = parseInt(cleanNumStr, 10); if (!isNaN(val) && val > maxVal) maxVal = val; }
    if (maxVal > 0) return maxVal;
  }
  
  let text = raw.replace(/ jt /g, 'juta').replace(/ sejuta /g, '1 juta').replace(/ seribu /g, '1 ribu').replace(/ seratus /g, '1 ratus').replace(/ sebelas /g, '11').replace(/ sepuluh /g, '10').replace(/(\d+|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan)?\s*setengah\s*(juta|milyar|miliar|ribu|rb|k)/gi, (m, p1, p2) => {
    let base = 0; if (p1) { if (!isNaN(parseFloat(p1))) base = parseFloat(p1); else { const wMap = { 'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5, 'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9 }; base = wMap[p1] || 0; } } return `${base === 0 ? 0.5 : base + 0.5} ${p2}`;
  });
  const wordMap = { 'nol': 0, 'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5, 'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9 };
  let tokens = text.split(/[\s]+/); let grandTotal = 0; let currentGroup = 0; let tempVal = 0; let foundNumber = false;
  for (let i = 0; i < tokens.length; i++) {
    let t = tokens[i].replace(/[^\w\.]/g, ''); if (!t) continue; let cleanT = t.replace(/\./g, ''); let num = parseFloat(cleanT);
    if (!isNaN(num) && !['juta', 'ribu', 'rb', 'k', 'miliar', 'milyar'].includes(cleanT)) { tempVal += num; foundNumber = true; }
    else if (wordMap[cleanT] !== undefined) { tempVal += wordMap[cleanT]; foundNumber = true; }
    else if (cleanT === 'belas') { if (tempVal === 0) tempVal = 1; currentGroup += tempVal + 10; tempVal = 0; foundNumber = true; }
    else if (cleanT === 'puluh') { if (tempVal === 0) tempVal = 1; currentGroup += tempVal * 10; tempVal = 0; foundNumber = true; }
    else if (cleanT === 'ratus') { if (tempVal === 0) tempVal = 1; currentGroup += tempVal * 100; tempVal = 0; foundNumber = true; }
    else if (cleanT === 'ribu' || cleanT === 'rb' || cleanT === 'k') { let groupSum = currentGroup + tempVal; if (groupSum === 0) groupSum = 1; grandTotal += groupSum * 1000; currentGroup = 0; tempVal = 0; foundNumber = true; }
    else if (cleanT === 'juta') { let groupSum = currentGroup + tempVal; if (groupSum === 0) groupSum = 1; grandTotal += groupSum * 1000000; currentGroup = 0; tempVal = 0; foundNumber = true; }
  }
  grandTotal += currentGroup + tempVal; if (foundNumber && grandTotal > 0) return Math.round(grandTotal); return 0;
}

function extractTransactionDetails(cmd, type) {
  let amount = parseNominal(cmd); let transactionDate = getLocalDateStr();
  
  if (cmd.includes('kemarin') || cmd.includes('kemaren')) { 
    transactionDate = getRelativeDateStr('kemarin').full; 
  } else { 
    let dateMatch = cmd.match(/tanggal\s*(\d{1,2})/i); 
    if (dateMatch) { 
      let dayNum = parseInt(dateMatch[1], 10); 
      if (dayNum >= 1 && dayNum <= 31) { let target = new Date(); target.setDate(dayNum); transactionDate = getLocalDateStr(target); } 
    } 
  }
  
  let desc = cmd
    .replace(/\b(pemasukan|pengeluaran|masuk|keluar|beli|bayar|dapet|dapat|catat|tambah|tolong)\b/gi, '')
    .replace(/\b(kemarin|kemaren|hari ini|tanggal\s*\d{1,2})\b/gi, '')
    .replace(/\b(bulan|tahun)\s+(lalu|kemarin|ini)\b/gi, '')
    .replace(/rp\s*\d+([.,]\d+)?/gi, '') 
    .replace(/\b\d{1,3}(\.\d{3})+(,\d+)?\b|\b\d{1,3}(,\d{3})+(\.\d+)?\b/g, '')
    .replace(/\b(nol|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|belas|puluh|ratus|ribu|rb|k|juta|jt|miliar|milyar|setengah|se|sejuta|seribu|seratus)\b/gi, '')
    .replace(/\b\d+\b/g, '')
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
    
  if (!desc) { desc = type === 'pemasukan' ? 'Pemasukan Lain' : 'Pengeluaran Lain'; } 
  else { desc = desc.charAt(0).toUpperCase() + desc.slice(1); }
  
  return { amount, desc, date: transactionDate };
}

function parseDateScopeFromCommand(cmd) {
  const monthNames = { 'januari': '01', 'jan': '01', 'februari': '02', 'feb': '02', 'maret': '03', 'mar': '03', 'april': '04', 'apr': '04', 'mei': '05', 'juni': '06', 'juli': '07', 'agustus': '08', 'agu': '08', 'september': '09', 'sep': '09', 'oktober': '10', 'okt': '10', 'november': '11', 'nov': '11', 'desember': '12', 'des': '12' };
  let periodLabel = "keseluruhan"; let filterFunc = () => true;
  if (cmd.includes('bulan lalu') || cmd.includes('bulan kemarin')) return { label: "bulan lalu", func: t => t.date.startsWith(getRelativeDateStr('bulan_lalu').ym) };
  if (cmd.includes('tahun lalu') || cmd.includes('tahun kemarin')) return { label: "tahun lalu", func: t => t.date.startsWith(getRelativeDateStr('tahun_lalu').year) };

  let yearMatch = cmd.match(/tahun\s*(\d{4})/i) || cmd.match(/ (20\d{2}) /); let targetYear = yearMatch ? (yearMatch[1] || yearMatch[0]) : null;
  let targetMonth = null; 
  
  for (let mName in monthNames) { 
    if (new RegExp('\\b' + mName + '\\b', 'i').test(cmd)) { 
      targetMonth = monthNames[mName]; break; 
    } 
  }

  let dateMatch = cmd.match(/tanggal\s*(\d{1,2})/i); let targetDay = dateMatch ? dateMatch[1].padStart(2, '0') : null;
  const todayStr = getLocalDateStr();

  if (targetDay && targetMonth && targetYear) return { label: `tanggal ${targetDay} bulan ${targetMonth} tahun ${targetYear}`, func: t => t.date === `${targetYear}-${targetMonth}-${targetDay}` };
  else if (targetDay && targetMonth) return { label: `tanggal ${targetDay} bulan ${targetMonth}`, func: t => t.date === `${todayStr.slice(0, 4)}-${targetMonth}-${targetDay}` };
  else if (targetMonth && targetYear) return { label: `bulan ${targetMonth} tahun ${targetYear}`, func: t => t.date.startsWith(`${targetYear}-${targetMonth}`) };
  else if (targetMonth) return { label: `bulan ${targetMonth}`, func: t => t.date.startsWith(`${todayStr.slice(0, 4)}-${targetMonth}`) };
  else if (targetDay) return { label: `tanggal ${targetDay} bulan ini`, func: t => t.date === `${todayStr.slice(0, 7)}-${targetDay}` };
  else if (targetYear) return { label: `tahun ${targetYear}`, func: t => t.date.startsWith(targetYear) };
  else if (cmd.includes('hari ini')) return { label: "hari ini", func: t => t.date === todayStr };
  else if (cmd.includes('kemarin') || cmd.includes('kemaren')) return { label: "kemarin", func: t => t.date === getRelativeDateStr('kemarin').full };
  else if (cmd.includes('bulan ini')) return { label: "bulan ini", func: t => t.date.startsWith(todayStr.slice(0, 7)) };
  else if (cmd.includes('tahun ini')) return { label: "tahun ini", func: t => t.date.startsWith(todayStr.slice(0, 4)) };
  return { label: periodLabel, func: filterFunc };
}

async function executeVoiceDelete(cmd) {
  let isIncome = cmd.includes('pemasukan') || cmd.includes('masuk'); let isExpense = cmd.includes('pengeluaran') || cmd.includes('keluar') || cmd.includes('beli') || cmd.includes('bayar');
  let scope = parseDateScopeFromCommand(cmd);
  
  let keyword = cmd.replace(/(hapus|delete|hilangin|bersihin|buang|pemasukan|pengeluaran|masuk|keluar|dapet|dapat|beli|bayar|semua|semuanya)/gi, '').replace(/(kemarin|kemaren|hari ini|bulan ini|bulan lalu|bulan kemarin|tahun ini|tahun lalu|tahun kemarin|tanggal\s*\d{1,2}|tahun\s*\d{4}| 20\d{2} )/gi, '').trim();

  let itemsToDelete = transactions.filter(t => {
    if (isIncome && t.type !== 'pemasukan') return false; if (isExpense && t.type !== 'pengeluaran') return false;
    if (scope.label !== 'keseluruhan' && !scope.func(t)) return false; 
    if (keyword && !t.desc.toLowerCase().includes(keyword.toLowerCase())) return false; 
    return true;
  });

  if (itemsToDelete.length === 0) return speak(`Aduh, tidak ditemukan transaksi yang cocok untuk dihapus.`);
  const user = getCurrentUser();
  if (user && supabaseClient) {
    updateSyncStatusUI(false, 'Menghapus Cloud...');
    const { error } = await supabaseClient.from('transactions').delete().in('id', itemsToDelete.map(i => i.id));
    if (error) return alert(`Gagal hapus Cloud: ${error.message}`);
  }
  await fetchTransactionsFromSupabase(); speak(`Sip! Berhasil menghapus ${itemsToDelete.length} data transaksi.`);
}

async function executeVoiceEdit(cmd) {
  let newAmount = parseNominal(cmd);
  
  let targetType = null; 
  if (/(pemasukan|masuk|dapat|dapet)/i.test(cmd)) targetType = 'pemasukan'; 
  if (/(pengeluaran|keluar|beli|bayar)/i.test(cmd)) targetType = 'pengeluaran';
  
  let scope = parseDateScopeFromCommand(cmd);
  
  let keyword = cmd.replace(/(ubah|edit|ganti|jadi|menjadi|pemasukan|pengeluaran|masuk|keluar|beli|bayar|dapet|dapat)/gi, '')
                   .replace(/(kemarin|kemaren|hari ini|bulan ini|bulan lalu|bulan kemarin|tahun ini|tahun lalu|tahun kemarin|tanggal\s*\d{1,2}|tahun\s*\d{4}| 20\d{2} )/gi, '')
                   .replace(/rp\s*\d+([.,]\d+)?/gi, '')
                   .replace(/\b\d{1,3}(\.\d{3})+(,\d+)?\b|\b\d{1,3}(,\d{3})+(\.\d+)?\b/g, '')
                   .replace(/\b(nol|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|belas|puluh|ratus|ribu|rb|k|juta|jt|miliar|milyar|setengah|se|sejuta|seribu|seratus)\b/gi, '')
                   .replace(/\b\d+\b/g, '')
                   .replace(/[.,]/g, '')
                   .replace(/\s+/g, ' ')
                   .trim();

  let matches = transactions.filter(t => {
    if (targetType && t.type !== targetType) return false; 
    if (scope.label !== 'keseluruhan' && !scope.func(t)) return false; 
    if (keyword && !t.desc.toLowerCase().includes(keyword.toLowerCase())) return false; 
    return true;
  });

  if (matches.length === 0) return speak("Aduh, data transaksi yang mau diedit gak ditemukan nih.");
  let itemToEdit = matches[0]; 
  let user = getCurrentUser(); if (!user) return openLoginModal();

  if (newAmount > 0) {
    updateSyncStatusUI(false, 'Menyimpan Cloud...');
    const { error } = await supabaseClient.from('transactions').update({ amount: newAmount }).eq('id', itemToEdit.id);
    if (!error) { await fetchTransactionsFromSupabase(); speak(`Sip! Nominal diubah jadi ${newAmount.toLocaleString('id-ID')} rupiah.`); }
  } else {
    let parts = cmd.split(/ (jadi|menjadi) /i);
    if (parts.length >= 3) {
      let newDesc = parts.slice(2).join(' ').trim();
      newDesc = newDesc.charAt(0).toUpperCase() + newDesc.slice(1);
      updateSyncStatusUI(false, 'Menyimpan Cloud...');
      const { error } = await supabaseClient.from('transactions').update({ desc: newDesc, category: detectCategory(newDesc, itemToEdit.type) }).eq('id', itemToEdit.id);
      if (!error) { await fetchTransactionsFromSupabase(); speak(`Sip! Keterangan diubah menjadi ${newDesc}.`); }
    } else {
      return speak("Sebutkan nominal baru untuk diedit. Contoh: Edit pengeluaran kopi dua puluh ribu.");
    }
  }
}

function executeVoiceDownload(cmd) { openExportModal(); speak("Silakan download laporannya."); }
function executeVoiceReadout(cmd) { speak("Ini fitur baca laporan. Cek visualnya ya."); }

async function processVoiceCommand(cmd) {
  const user = getCurrentUser(); if (!user) { openLoginModal(); return; }
  
  if (cmd.includes('edit') || cmd.includes('ubah') || cmd.includes('ganti')) { executeVoiceEdit(cmd); return; }
  if (cmd.includes('hapus') || cmd.includes('delete') || cmd.includes('hilangin') || cmd.includes('buang')) { executeVoiceDelete(cmd); return; }
  if (cmd.includes('download') || cmd.includes('unduh') || cmd.includes('simpan') || cmd.includes('ekspor')) { executeVoiceDownload(cmd); return; }
  if (cmd.includes('grafik') || cmd.includes('analisis') || cmd.includes('chart')) { showChartModal(cmd); return; }
  if (cmd.includes('baca') || cmd.includes('cek') || cmd.includes('spill') || cmd.includes('total')) { executeVoiceReadout(cmd); return; }

  const nominal = parseNominal(cmd);
  if (nominal > 0) {
    let type = 'pengeluaran'; 
    // REVISI: Tambahkan "uang bulanan" ke Pemasukan
    if (/(pemasukan|masuk|dapet|dapat|gaji|thr|transferan|honor|bonus|dikasih|nemu|uang bulanan)/i.test(cmd)) type = 'pemasukan';
    
    let { amount, desc, date } = extractTransactionDetails(cmd, type);

    if (amount > 0) {
      const category = detectCategory(desc, type); 
      updateSyncStatusUI(false, 'Menyimpan...');
      const { error } = await supabaseClient.from('transactions').insert([{ id: Date.now().toString(), user_id: user.id, date: date, type: type, category: category, amount: amount, desc: desc }]);
      if (error) { alert(`Gagal Disimpan: ${error.message}`); updateSyncStatusUI(false, 'Gagal Sinkron'); } 
      else { await fetchTransactionsFromSupabase(); speak(`Siap! Udah dicatat ${type} ${desc} sebesar ${amount.toLocaleString('id-ID')} rupiah.`); }
      return;
    }
  }
  speak("Nominal angkanya belum ketangkap nih. Coba sebutkan nominalnya.");
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null; let isListening = false; let transcript = '';

if (SpeechRecognition) {
  recognition = new SpeechRecognition(); recognition.lang = 'id-ID';
  recognition.onstart = () => { isListening = true; transcript = ''; document.getElementById('btnMic').classList.add('mic-active'); document.getElementById('speechStatus').innerText = "Mendengarkan..."; };
  recognition.onresult = (e) => { transcript = Array.from(e.results).map(r => r[0].transcript).join(''); document.getElementById('transcriptText').innerText = `"${transcript}"`; };
  recognition.onend = () => { isListening = false; document.getElementById('btnMic').classList.remove('mic-active'); document.getElementById('speechStatus').innerText = "Klik mikrofon"; if (transcript.length >= 3) processVoiceCommand(transcript.toLowerCase()); };
}

document.getElementById('btnMic').addEventListener('click', () => {
  if(!getCurrentUser()) { speak("Masuk dulu ya!"); openLoginModal(); return; }
  if(isListening) recognition.stop(); else recognition.start();
});