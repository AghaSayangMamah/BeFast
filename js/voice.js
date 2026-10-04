// --- MESIN MEMORI AMBIGUITAS ---
window.pendingVoiceAction = null;
let pendingVoiceDeleteIds = [];

window.showAmbiguitySelection = function(items) {
  try {
    const isDesktop = window.innerWidth >= 768;
    const cards = items.map(item => createAmbiguityCard(item, isDesktop));

    if (window.innerWidth < 768) {
      const list = document.getElementById('ambiguityList');
      if (list) list.replaceChildren(...cards);
      const modal = document.getElementById('ambiguityModal');
      if (modal) modal.classList.remove('hidden');
    } else {
      const list = document.getElementById('transactionList');
      if (list) {
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'mb-3 w-full py-2.5 bg-red-500/10 text-red-500 rounded-xl text-xs font-bold hover:bg-red-500/20 border border-red-500/20 transition cursor-pointer';
        cancelButton.textContent = 'Batal Edit/Hapus';
        cancelButton.addEventListener('click', window.cancelAmbiguity);
        list.replaceChildren(cancelButton, ...cards);
      }
    }
  } catch (err) {
    console.error("Crash di UI Ambiguitas:", err);
    speak("Aduh, ada data yang formatnya rusak waktu mau ditampilin.");
  }
};

function createAmbiguityCard(t, isDesktop) {
  const isIncome = t.type === 'pemasukan';
  const safeAmount = Number(t.amount) || 0;
  const isDelete = window.pendingVoiceAction && window.pendingVoiceAction.type === 'delete';
  const card = document.createElement('button');
  card.type = 'button';
  card.className = isDesktop
    ? 'ambiguous-item shrink-0 w-full theme-glass p-4 rounded-2xl flex justify-between items-center cursor-pointer relative overflow-hidden group text-left'
    : 'ambiguous-item theme-glass shrink-0 w-full p-4 rounded-xl flex justify-between items-center border border-gray-400/20 active:scale-95 transition cursor-pointer relative overflow-hidden group text-left';
  card.addEventListener('click', () => window.resolveAmbiguity(t.id));

  const details = document.createElement('span');
  details.className = 'relative z-10 min-w-0 flex-1 pr-2';
  const description = document.createElement('span');
  description.className = 'block font-bold text-sm theme-text truncate';
  description.textContent = t.desc || 'Tanpa Keterangan';
  const metadata = document.createElement('span');
  metadata.className = 'block text-[10px] theme-text-muted mt-1 truncate';
  metadata.textContent = `${t.date || '-'} • ${t.category || '-'}`;
  details.append(description, metadata);

  const amount = document.createElement('span');
  amount.className = 'relative z-10 text-right shrink-0';
  const amountText = document.createElement('span');
  amountText.className = `block font-black text-sm ${isIncome ? 'text-green-500' : 'text-red-500'}`;
  amountText.textContent = `${isIncome ? '+' : '-'} Rp ${safeAmount.toLocaleString('id-ID')}`;
  const actionText = document.createElement('span');
  actionText.className = `mt-1.5 inline-block text-[9px] px-2 py-0.5 rounded-full font-bold ${isDelete ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`;
  actionText.textContent = isDelete ? 'Tap untuk hapus' : 'Tap untuk ubah';
  amount.append(amountText, actionText);
  card.append(details, amount);
  return card;
}
window.resolveAmbiguity = async function(id) {
  const action = window.pendingVoiceAction;
  if(!action) return;
  if (!supabaseClient) {
    updateSyncStatusUI(false, 'Database belum siap');
    speak("Koneksi database belum siap. Coba lagi sebentar.");
    return;
  }
  if(typeof updateSyncStatusUI === 'function') updateSyncStatusUI(false, 'Memproses...');
  
  try {
    let result;
    if (action.type === 'delete') {
      result = await supabaseClient.from('transactions').delete().eq('id', id);
    } else if (action.type === 'edit') {
      result = await supabaseClient.from('transactions').update(action.payload).eq('id', id);
    }
    if (result && result.error) {
      console.error('Gagal memproses transaksi suara:', result.error);
      updateSyncStatusUI(false, 'Gagal');
      speak("Gagal memproses transaksi di server. Coba lagi.");
      return;
    }
    speak(action.type === 'delete' ? "Sip! Berhasil dihapus." : action.successText);
  } catch (error) {
    console.error('Gagal memproses transaksi suara:', error);
    updateSyncStatusUI(false, 'Gagal');
    speak("Koneksi ke server bermasalah. Transaksi belum diproses.");
    return;
  }
  
  cancelAmbiguity();
  if (typeof fetchTransactionsFromSupabase === 'function') await fetchTransactionsFromSupabase();
};

window.cancelAmbiguity = function() {
  window.pendingVoiceAction = null;
  const modal = document.getElementById('ambiguityModal');
  if (modal) modal.classList.add('hidden');
  
  // Ini yang ngereset tampilan layar sebelah kiri balik ke semula
  if (typeof fetchTransactionsFromSupabase === 'function') fetchTransactionsFromSupabase(); 
};

window.cancelVoiceDeleteConfirmation = function() {
  pendingVoiceDeleteIds = [];
  const modal = document.getElementById('deleteConfirmModal');
  if (modal) modal.classList.add('hidden');
};

window.confirmVoiceDelete = async function() {
  if (!pendingVoiceDeleteIds.length) return;
  if (!supabaseClient) {
    updateSyncStatusUI(false, 'Database belum siap');
    speak("Koneksi database belum siap. Coba lagi sebentar.");
    return;
  }

  const modalButtons = document.querySelectorAll('#deleteConfirmModal button');
  modalButtons.forEach(button => { button.disabled = true; });
  updateSyncStatusUI(false, 'Menghapus data...');

  try {
    const idsToDelete = [...pendingVoiceDeleteIds];
    const { error } = await supabaseClient.from('transactions').delete().in('id', idsToDelete);
    if (error) {
      console.error('Gagal menghapus transaksi melalui perintah suara:', error);
      updateSyncStatusUI(false, 'Gagal');
      speak("Gagal menghapus transaksi dari server. Coba lagi.");
      return;
    }

    window.cancelVoiceDeleteConfirmation();
    if (typeof fetchTransactionsFromSupabase === 'function') await fetchTransactionsFromSupabase();
    speak(idsToDelete.length > 1
      ? `Sip! Berhasil menghapus ${idsToDelete.length} transaksi.`
      : "Sip! Berhasil dihapus.");
  } catch (error) {
    console.error('Gagal menghapus transaksi melalui perintah suara:', error);
    updateSyncStatusUI(false, 'Gagal');
    speak("Koneksi ke server bermasalah. Transaksi belum dihapus.");
  } finally {
    modalButtons.forEach(button => { button.disabled = false; });
  }
};

function showVoiceDeleteConfirmation(items) {
  pendingVoiceDeleteIds = items.map(item => item.id);
  const modal = document.getElementById('deleteConfirmModal');
  const title = document.getElementById('deleteConfirmTitle');
  const message = document.getElementById('deleteConfirmMessage');
  const confirmButton = document.getElementById('voiceDeleteConfirmButton');
  if (!modal || !title || !message || !confirmButton) {
    pendingVoiceDeleteIds = [];
    speak("Tidak bisa menampilkan konfirmasi hapus. Transaksi tidak dihapus.");
    return;
  }

  title.textContent = items.length > 1 ? 'Hapus Semua Transaksi?' : 'Hapus Transaksi?';
  const itemSummary = items.slice(0, 3).map(item => {
    const amount = Number(item.amount) || 0;
    return `${item.desc || 'Tanpa Keterangan'} (Rp ${amount.toLocaleString('id-ID')})`;
  }).join(', ');
  const remainingCount = items.length - 3;
  const remainingText = remainingCount > 0 ? ` dan ${remainingCount} transaksi lainnya` : '';
  message.textContent = items.length > 1
    ? `Yakin mau menghapus semua ${items.length} transaksi ini: ${itemSummary}${remainingText}?`
    : `Yakin mau menghapus transaksi ${itemSummary}? Tindakan ini tidak bisa dibatalkan.`;
  confirmButton.disabled = false;
  modal.classList.remove('hidden');
}

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
  
  // BERSIHKAN PENGECOH: Buang angka yang diikuti kata porsi, bungkus, piring, atau orang agar tidak terbaca sebagai uang
  raw = raw.replace(/\b\d+\s*(porsi|bungkus|piring|orang|buah|butir)\b/gi, '');

  // 1. JURUS PEMISAH: "20ribu" otomatis jadi "20 ribu"
  raw = raw.replace(/(\d+)([a-z]+)/gi, '$1 $2');
  
  // 2. KAMUS SLANG: Supaya sistem lokal paham bahasa tongkrongan tanpa butuh AI!
  const slangMap = { 'gocap': '50 ribu', 'cepek': '100 ribu', 'gopek': '500 ribu', 'seceng': '1 ribu', 'goceng': '5 ribu', 'ceban': '10 ribu', 'goban': '50 ribu', 'pekgo': '150 ribu', 'tigo': '30 ribu' };
  for (const [slang, value] of Object.entries(slangMap)) {
    raw = raw.replace(new RegExp(`\\b${slang}\\b`, 'gi'), value);
  }

  let matches = raw.match(/\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d{1,3}(?:,\d{3})+(?:\.\d+)?/g);
  if(matches && matches.length > 0) {
    let maxVal = 0;
    for (let match of matches) { 
      let val = 0;
      if (/(?:\.\d{3})/.test(match)) {
        let clean = match.split(',')[0].replace(/\./g, '');
        val = parseInt(clean, 10);
      } else {
        let clean = match.split('.')[0].replace(/,/g, '');
        val = parseInt(clean, 10);
      }
      if (!isNaN(val) && val > maxVal) maxVal = val; 
    }
    if (maxVal > 0) return maxVal;
  }
  
  let text = raw.replace(/\bjt\b/gi, 'juta')
                .replace(/\bsejuta\b/gi, '1 juta')
                .replace(/\bseribu\b/gi, '1 ribu')
                .replace(/\bseratus\b/gi, '1 ratus')
                .replace(/\bsebelas\b/gi, '11')
                .replace(/\bsepuluh\b/gi, '10')
                .replace(/(\d+|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan)?\s*setengah\s*(juta|milyar|miliar|ribu|rb|k)/gi, (m, p1, p2) => {
    let base = 0; if (p1) { if (!isNaN(parseFloat(p1))) base = parseFloat(p1); else { const wMap = { 'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5, 'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9 }; base = wMap[p1] || 0; } } return `${base === 0 ? 0.5 : base + 0.5} ${p2}`;
  });
  
  const wordMap = { 'nol': 0, 'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5, 'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9 };
  let tokens = text.split(/[\s]+/); let grandTotal = 0; let currentGroup = 0; let tempVal = 0; let foundNumber = false;
  
  for (let i = 0; i < tokens.length; i++) {
    let t = tokens[i].replace(/[^\w.,]/g, ''); if (!t) continue;
    let cleanT = t.replace(/[.,]/g, '');
    let num = /^\d+(?:[.,]\d+)?$/.test(t) ? parseFloat(t.replace(',', '.')) : NaN;
    
    if (!isNaN(num) && !['juta', 'ribu', 'rb', 'k', 'miliar', 'milyar'].includes(cleanT)) { tempVal += num; foundNumber = true; }
    else if (wordMap[cleanT] !== undefined) { tempVal += wordMap[cleanT]; foundNumber = true; }
    else if (cleanT === 'belas') { if (tempVal === 0) tempVal = 1; currentGroup += tempVal + 10; tempVal = 0; foundNumber = true; }
    else if (cleanT === 'puluh') { if (tempVal === 0) tempVal = 1; currentGroup += tempVal * 10; tempVal = 0; foundNumber = true; }
    else if (cleanT === 'ratus') { if (tempVal === 0) tempVal = 1; currentGroup += tempVal * 100; tempVal = 0; foundNumber = true; }
    else if (cleanT === 'ribu' || cleanT === 'rb' || cleanT === 'k') { let groupSum = currentGroup + tempVal; if (groupSum === 0) groupSum = 1; grandTotal += groupSum * 1000; currentGroup = 0; tempVal = 0; foundNumber = true; }
    else if (cleanT === 'juta') { let groupSum = currentGroup + tempVal; if (groupSum === 0) groupSum = 1; grandTotal += groupSum * 1000000; currentGroup = 0; tempVal = 0; foundNumber = true; }
    else if (cleanT === 'miliar' || cleanT === 'milyar') { let groupSum = currentGroup + tempVal; if (groupSum === 0) groupSum = 1; grandTotal += groupSum * 1000000000; currentGroup = 0; tempVal = 0; foundNumber = true; }
  }
  grandTotal += currentGroup + tempVal; 
  if (foundNumber && grandTotal > 0) {
    // Jika user hanya sebut angka kecil (misal "15" atau "20") tanpa kata "ribu", kita asumsikan ribuan
    if (grandTotal <= 100) grandTotal *= 1000;
    return Math.round(grandTotal); 
  }
  return 0;
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
    .replace(/\b(pemasukan|pengeluaran|masuk|keluar|beli|membeli|bayar|membayar|dapet|dapat|mendapat|catat|tambah|tolong|tadi|saya|aku)\b/gi, '')
    .replace(/\b(kemarin|kemaren|hari ini|tanggal\s*\d{1,2})\b/gi, '')
    .replace(/\b(bulan|tahun)\s+(lalu|kemarin|ini)\b/gi, '')
    .replace(/\b\d+[.,]\d+\s*(ribu|rb|k|juta|jt|miliar|milyar)\b/gi, '')
    .replace(/rp\s*[.,]?\s*\d+([.,]\d+)?/gi, '') 
    // HANYA HAPUS ANGKA YANG MENJADI NOMINAL HARGA (yang ada titik ribuan atau nominal besar), 
    // biarkan angka kecil seperti "2" atau "10" yang melekat pada porsi tetap ada di deskripsi.
    .replace(/\b\d{1,3}(\.\d{3})+(,\d+)?\b|\b\d{1,3}(,\d{3})+(\.\d+)?\b/g, '')
    .replace(/\b(satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|\d+)\s*(ratus|puluh|belas)?\s*(ribu|rb|k|juta|jt)?\b/gi, '')
    .replace(/\b(sejuta|seribu|seratus)\b/gi, '')
    .replace(/\b(gocap|cepek|gopek|seceng|goceng|ceban|goban|pekgo|tigo)\b/gi, '')
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
  let isIncome = cmd.includes('pemasukan') || cmd.includes('masuk'); 
  let isExpense = cmd.includes('pengeluaran') || cmd.includes('keluar') || cmd.includes('beli') || cmd.includes('bayar');
  
  // SENSOR KATA "SEMUA": Kalau ada kata ini, anggap user mau hapus massal
  let isBulkDelete = cmd.includes('semua') || cmd.includes('semuanya'); 
  
  let scope = parseDateScopeFromCommand(cmd);
  let keyword = cmd.replace(/(hapus|delete|hilangin|bersihin|buang|kategori|pemasukan|pengeluaran|masuk|keluar|dapet|dapat|beli|bayar|semua|semuanya)/gi, '').replace(/(kemarin|kemaren|hari ini|bulan ini|bulan lalu|bulan kemarin|tahun ini|tahun lalu|tahun kemarin|tanggal\s*\d{1,2}|tahun\s*\d{4}| 20\d{2} )/gi, '').trim();

  let itemsToDelete = transactions.filter(t => {
    if (isIncome && t.type !== 'pemasukan') return false; 
    if (isExpense && t.type !== 'pengeluaran') return false;
    if (scope.label !== 'keseluruhan' && !scope.func(t)) return false; 
    const normalizedKeyword = keyword.toLowerCase();
    if (normalizedKeyword && !t.desc.toLowerCase().includes(normalizedKeyword) && !(t.category || '').toLowerCase().includes(normalizedKeyword)) return false;
    return true;
  });

  if (itemsToDelete.length === 0) return speak(`Aduh, tidak ditemukan transaksi yang cocok untuk dihapus.`);
  
  // Hapus semua hasil atau satu-satunya hasil hanya setelah pengguna mengonfirmasi.
  if (isBulkDelete || itemsToDelete.length === 1) {
    showVoiceDeleteConfirmation(itemsToDelete);
  } else {
    // TERDETEKSI GANDA & TIDAK ADA KATA "SEMUA" -> Minta user milih
    window.pendingVoiceAction = { type: 'delete' };
    showAmbiguitySelection(itemsToDelete);
    speak(`Ada ${itemsToDelete.length} data yang cocok. Tolong tap mana yang mau dihapus di layar.`);
  }
}

async function executeVoiceEdit(cmd) {
  let newAmount = parseNominal(cmd);
  const descriptionChange = newAmount === 0 ? cmd.match(/\b(?:jadi|menjadi)\b\s+(.+)$/i) : null;
  const searchCommand = descriptionChange ? cmd.slice(0, descriptionChange.index) : cmd;
  let targetType = null; 
  if (/(pemasukan|masuk|dapat|dapet)/i.test(cmd)) targetType = 'pemasukan'; 
  if (/(pengeluaran|keluar|beli|bayar)/i.test(cmd)) targetType = 'pengeluaran';
  let scope = parseDateScopeFromCommand(cmd);
  let keyword = searchCommand.replace(/\b(ubah|edit|ganti|jadi|menjadi|kategori|keterangan|deskripsi|transaksi|nama|pemasukan|pengeluaran|masuk|keluar|beli|bayar|dapet|dapat)\b/gi, '')
                     .replace(/(kemarin|kemaren|hari ini|bulan ini|bulan lalu|bulan kemarin|tahun ini|tahun lalu|tahun kemarin|tanggal\s*\d{1,2}|tahun\s*\d{4}| 20\d{2} )/gi, '')
                     .replace(/rp\s*\d+([.,]\d+)?/gi, '')
                     .replace(/\b\d{1,3}(\.\d{3})+(,\d+)?\b|\b\d{1,3}(,\d{3})+(\.\d+)?\b/g, '')
                     .replace(/\b(nol|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|belas|puluh|ratus|ribu|rb|k|juta|jt|miliar|milyar|setengah|se|sejuta|seribu|seratus)\b/gi, '')
                     .replace(/\b\d+\b/g, '')
                     .replace(/[.,]/g, '').replace(/\s+/g, ' ').replace(/\bkategori\b/gi, '').trim();

  let matches = transactions.filter(t => {
    if (targetType && t.type !== targetType) return false; 
    if (scope.label !== 'keseluruhan' && !scope.func(t)) return false; 
    const normalizedKeyword = keyword.toLowerCase();
    if (normalizedKeyword && !t.desc.toLowerCase().includes(normalizedKeyword) && !(t.category || '').toLowerCase().includes(normalizedKeyword)) return false;
    return true;
  });

  if (matches.length === 0) return speak("Aduh, data transaksi yang mau diedit gak ditemukan nih.");
  
  let payload = null;
  let speakText = "";
  if (newAmount > 0) {
    payload = { amount: newAmount };
    speakText = `Sip! Nominal diubah jadi ${newAmount.toLocaleString('id-ID')} rupiah.`;
  } else {
    if (descriptionChange) {
      let newDesc = descriptionChange[1].trim().replace(/[.,!?]+$/, '');
      newDesc = newDesc.charAt(0).toUpperCase() + newDesc.slice(1);
      payload = { desc: newDesc, category: typeof detectCategory === 'function' ? detectCategory(newDesc, matches[0].type) : 'Lain-lain' };
      speakText = `Sip! Keterangan diubah menjadi ${newDesc}.`;
    } else {
      return speak("Sebutkan nominal baru atau nama baru. Contoh: Edit kopi jadi tiga puluh ribu.");
    }
  }

  if (matches.length === 1) {
    if(typeof updateSyncStatusUI === 'function') updateSyncStatusUI(false, 'Menyimpan Cloud...');
    try {
      const { error } = await supabaseClient.from('transactions').update(payload).eq('id', matches[0].id);
      if (error) {
        console.error('Gagal mengedit transaksi melalui perintah suara:', error);
        updateSyncStatusUI(false, 'Gagal');
        speak("Gagal mengedit transaksi di server. Coba lagi.");
        return;
      }
      await fetchTransactionsFromSupabase();
      speak(speakText);
    } catch (error) {
      console.error('Gagal mengedit transaksi melalui perintah suara:', error);
      updateSyncStatusUI(false, 'Gagal');
      speak("Koneksi ke server bermasalah. Transaksi belum diubah.");
    }
  } else {
    // TERDETEKSI GANDA -> LEMPAR KE MODE AMBIGUITAS MEMBAWA MEMORI BARU
    window.pendingVoiceAction = { type: 'edit', payload: payload, successText: speakText };
    showAmbiguitySelection(matches);
    speak(`Ada ${matches.length} data yang cocok. Tolong tap mana yang mau diedit di layar.`);
  }
}
function executeVoiceDownload(cmd) { openExportModal(); speak("Silakan download laporannya."); }
function executeVoiceReadout(cmd) {
  // 1. Deteksi niat pengguna
  let isIncome = /(pemasukan|masuk|pendapatan|gaji)/i.test(cmd);
  let isExpense = /(pengeluaran|keluar|belanja)/i.test(cmd);
  let scope = parseDateScopeFromCommand(cmd);

  // 2. Filter data sesuai tanggal dan jenis
  let filtered = transactions.filter(t => {
    if (scope.label !== 'keseluruhan' && !scope.func(t)) return false;
    if (isIncome && !isExpense && t.type !== 'pemasukan') return false;
    if (isExpense && !isIncome && t.type !== 'pengeluaran') return false;
    return true;
  });

  if (filtered.length === 0) {
    return speak(`Tidak ada catatan transaksi untuk ${scope.label === 'keseluruhan' ? 'saat ini' : scope.label}.`);
  }

  // 3. Pisahkan pemasukan dan pengeluaran agar gampang dibacakan
  let incomes = filtered.filter(t => t.type === 'pemasukan');
  let expenses = filtered.filter(t => t.type === 'pengeluaran');

  let inTotal = incomes.reduce((sum, t) => sum + t.amount, 0);
  let exTotal = expenses.reduce((sum, t) => sum + t.amount, 0);
  let netBalance = inTotal - exTotal;

  // 4. Rakit kalimat laporan mendetail
  let speech = `Laporan ${scope.label === 'keseluruhan' ? 'keseluruhan' : scope.label}. `;

  if (incomes.length > 0) {
    speech += "Rincian pemasukan: ";
    let inDetails = incomes.map(t => `${t.desc} ${t.amount.toLocaleString('id-ID')} rupiah`).join(', ');
    speech += inDetails + ". ";
  }

  if (expenses.length > 0) {
    speech += "Rincian pengeluaran: ";
    let exDetails = expenses.map(t => `${t.desc} ${t.amount.toLocaleString('id-ID')} rupiah`).join(', ');
    speech += exDetails + ". ";
  }

  // 5. Kesimpulan (Total dan Saldo Bersih)
  if (isIncome && !isExpense) {
    speech += `Total pemasukan kamu adalah ${inTotal.toLocaleString('id-ID')} rupiah.`;
  } else if (isExpense && !isIncome) {
    speech += `Total pengeluaran kamu adalah ${exTotal.toLocaleString('id-ID')} rupiah.`;
  } else {
    speech += `Jadi, total pemasukan ${inTotal.toLocaleString('id-ID')} rupiah, total pengeluaran ${exTotal.toLocaleString('id-ID')} rupiah. Sisa saldo bersih kamu adalah ${netBalance.toLocaleString('id-ID')} rupiah.`;
  }

  // Eksekusi pembacaan
  speak(speech.trim());
}
async function processVoiceCommand(cmd) {
  const user = getCurrentUser(); if (!user) { openLoginModal(); return; }
  
  if (cmd.includes('edit') || cmd.includes('ubah') || cmd.includes('ganti')) { executeVoiceEdit(cmd); return; }
  if (cmd.includes('hapus') || cmd.includes('delete') || cmd.includes('hilangin') || cmd.includes('buang')) { executeVoiceDelete(cmd); return; }
  if (cmd.includes('download') || cmd.includes('unduh') || cmd.includes('simpan') || cmd.includes('ekspor')) { executeVoiceDownload(cmd); return; }
  if (cmd.includes('grafik') || cmd.includes('analisis') || cmd.includes('chart')) { showChartModal(cmd); return; }
  if (cmd.includes('baca') || cmd.includes('cek') || cmd.includes('spill') || cmd.includes('total')) { executeVoiceReadout(cmd); return; }

  // --- FITUR BATCH / MULTI-TRANSACTION PARSING ---
  const splitCommands = cmd.split(/\s+(?:dan|terus|lalu|serta)\s+|(?<!\d),|,(?!\d)/g).map(part => part.trim()).filter(Boolean);
  const subCommands = splitCommands.length > 1 && splitCommands.every(part => parseNominal(part) > 0)
    ? splitCommands
    : [cmd];
  let successCount = 0;
  let failedCount = 0;

  updateSyncStatusUI(false, 'Memproses banyak data...');

  for (let subCmd of subCommands) {
    subCmd = subCmd.trim();
    if (!subCmd) continue;

    const nominal = parseNominal(subCmd);
    if (nominal > 0) {
      let type = 'pengeluaran'; 
      if (/(pemasukan|masuk|dapet|dapat|gaji|thr|transferan|honor|bonus|dikasih|nemu|uang bulanan)/i.test(subCmd)) type = 'pemasukan';
      
      let { amount, desc, date } = extractTransactionDetails(subCmd, type);

      if (amount > 0) {
        const category = detectCategory(desc, type); 
        
        // Simpan ke database Supabase secara beruntun (looping)
        try {
          const { error } = await supabaseClient.from('transactions').insert([{
            id: Date.now().toString() + Math.floor(Math.random() * 1000),
            user_id: user.id,
            date: date,
            type: type,
            category: category,
            amount: amount,
            desc: desc
          }]);

          if (error) {
            console.error('Gagal menyimpan transaksi suara:', error);
            failedCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error('Gagal menyimpan transaksi suara:', error);
          failedCount++;
        }
      }
    }
  }

  if (successCount > 0) {
    await fetchTransactionsFromSupabase();
    speak(failedCount > 0
      ? `Berhasil mencatat ${successCount} transaksi, tetapi ${failedCount} gagal disimpan.`
      : `Siap! Berhasil mencatat ${successCount} transaksi.`);
  } else if (failedCount > 0) {
    updateSyncStatusUI(false, 'Gagal menyimpan');
    speak(`Gagal menyimpan ${failedCount} transaksi ke server. Periksa koneksi lalu coba lagi.`);
  } else {
    speak("Nominal angkanya belum ketangkap nih. Coba sebutkan nominalnya dengan jelas.");
  }
}

// --- KAMUS KOREKSI SUARA (AUTO-CORRECT) ---
function applyVoiceCorrections(text) {
  let corrected = text.toLowerCase();
  
  // DAFTAR KATA YANG SERING SALAH DENGER SAMA BROWSER
  // Tambahkan kata baru di sini kalau ada feedback dari user lagi
  const corrections = {
    'grab foot': 'grabfood',
    'grab food': 'grabfood',
    'go foot': 'gofood',
    'go food': 'gofood',
    'sopee': 'shopee',
    'shope': 'shopee',
    'mekdi': 'mcd',
    'go-jek': 'gojek',
    'gojekin': 'gojek',
    'baso': 'bakso',
    'baskso': 'bakso',
    'ojack': 'ojek',
    'oblek': 'ojek',
    'objek': 'ojek',
    'tolong': 'tolong',
    'catat': 'catat',
    'bensir': 'bensin'
  };
  
  for (const [wrong, right] of Object.entries(corrections).sort(([left], [right]) => right.length - left.length)) {
    const escapedWrong = wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedWrong}\\b`, 'gi');
    corrected = corrected.replace(regex, right);
  }
  return corrected;
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null; let isListening = false; let isStarting = false; let transcript = '';
let recognitionFailed = false;
const micButton = document.getElementById('btnMic');
const speechStatus = document.getElementById('speechStatus');
const transcriptText = document.getElementById('transcriptText');

if (SpeechRecognition) {
  try {
    recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
  } catch (error) {
    console.error('Gagal menginisialisasi speech recognition:', error);
  }
}

if (recognition) {
  
  // Animasi saat mulai mendengarkan (Mic aktif)
  recognition.onstart = () => { 
    isListening = true;
    isStarting = false;
    recognitionFailed = false;
    transcript = '';
    if (micButton) { micButton.classList.remove('mic-idle'); micButton.classList.add('mic-listening'); }
    if (speechStatus) speechStatus.innerText = 'Mendengarkan...';
  };
  
  recognition.onresult = (e) => { 
    let rawTranscript = Array.from(e.results).map(r => r[0].transcript).join(''); 
    
    // KUNCI PERBAIKAN: Bersihkan teks raw pakai kamus sebelum nampil di layar
    transcript = applyVoiceCorrections(rawTranscript); 
    
    if (transcriptText) transcriptText.innerText = `"${transcript}"`;
  };
  
  // Animasi saat selesai (Mic bernapas lambat)
  recognition.onend = () => { 
    isListening = false; 
    isStarting = false;
    if (micButton) { micButton.classList.add('mic-idle'); micButton.classList.remove('mic-listening'); }
    if (!recognitionFailed && speechStatus) speechStatus.innerText = 'Klik mikrofon';
    if (!recognitionFailed && transcript.length >= 3) processVoiceCommand(transcript.toLowerCase());
  };

  recognition.onerror = (event) => {
    isListening = false;
    isStarting = false;
    recognitionFailed = true;
    if (micButton) { micButton.classList.add('mic-idle'); micButton.classList.remove('mic-listening'); }
    const errorMessages = {
      'not-allowed': 'Izin mikrofon ditolak. Izinkan akses mikrofon di browser.',
      'service-not-allowed': 'Layanan pengenalan suara tidak diizinkan browser.',
      'audio-capture': 'Mikrofon tidak ditemukan atau sedang digunakan aplikasi lain.',
      'no-speech': 'Suara belum terdengar. Coba bicara lebih jelas.',
      'network': 'Koneksi bermasalah. Periksa internet lalu coba lagi.',
      'aborted': 'Perekaman suara dibatalkan.'
    };
    const message = errorMessages[event.error] || 'Pengenalan suara gagal. Coba lagi.';
    if (speechStatus) speechStatus.innerText = message;
    if (event.error !== 'aborted') console.error('Speech recognition error:', event.error);
    if (event.error !== 'aborted') speak(message);
  };
} else if (speechStatus) {
  speechStatus.innerText = 'Browser ini belum mendukung pengenalan suara.';
  if (micButton) {
    micButton.disabled = true;
    micButton.title = 'Pengenalan suara tidak didukung browser ini';
    micButton.classList.add('opacity-50', 'cursor-not-allowed');
  }
}

if (micButton) micButton.addEventListener('click', () => {
  if (!getCurrentUser()) { speak("Masuk dulu ya!"); openLoginModal(); return; }
  if (!recognition) {
    if (speechStatus) speechStatus.innerText = 'Browser ini belum mendukung pengenalan suara.';
    return;
  }

  try {
    if (isStarting) return;
    if (isListening) recognition.stop();
    else {
      isStarting = true;
      recognition.start();
    }
  } catch (error) {
    isStarting = false;
    console.error('Gagal menjalankan speech recognition:', error);
    if (speechStatus) speechStatus.innerText = 'Mikrofon tidak dapat dimulai. Coba lagi.';
  }
});