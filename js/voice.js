// --- SISTEM PERSONALISASI SUARA ---
function populateVoiceList() {
  if (typeof speechSynthesis === 'undefined') return;
  const voices = speechSynthesis.getVoices();
  const voiceListEl = document.getElementById('voiceOptionsList');
  if (!voiceListEl) return;
  
  let idVoices = voices.filter(v => v.lang.includes('id') || v.lang.includes('ID'));
  if (idVoices.length === 0) idVoices = voices; 
  
  voiceListEl.innerHTML = '';
  const savedVoiceURI = localStorage.getItem('bf_voice');
  
  idVoices.forEach(voice => {
    const li = document.createElement('li');
    li.className = "px-4 py-2 text-xs font-bold cursor-pointer transition hover:bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-between";
    li.innerHTML = `<span>${voice.name}</span> ${savedVoiceURI === voice.voiceURI ? '<i class="fa-solid fa-check text-[var(--primary)]"></i>' : ''}`;
    
    li.onclick = (e) => {
      e.stopPropagation();
      localStorage.setItem('bf_voice', voice.voiceURI);
      populateVoiceList(); 
      document.querySelectorAll('.options-list').forEach(list => list.classList.add('hidden')); 
      speak("Halo, suaraku sudah diganti ya!");
    };
    voiceListEl.appendChild(li);
  });
  
  if(idVoices.length === 0) {
    voiceListEl.innerHTML = '<li class="px-4 py-2 text-[10px] text-center text-[var(--text-muted)]">Suara tidak ditemukan</li>';
  }
}

function speak(text, callback = null) {
  if (!('speechSynthesis' in window)) return; window.speechSynthesis.cancel(); 
  const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'id-ID'; utterance.rate = 1.05; utterance.pitch = 1.25; 
  
  const voices = window.speechSynthesis.getVoices();
  const savedVoiceURI = localStorage.getItem('bf_voice');
  let selectedVoice = null;
  
  if (savedVoiceURI) {
    selectedVoice = voices.find(v => v.voiceURI === savedVoiceURI);
  }
  if (!selectedVoice) {
     selectedVoice = voices.find(v => (v.lang.includes('id') || v.lang.includes('ID')) && (v.name.includes('Google') || v.name.includes('Female') || v.name.includes('Gadis')));
     if (!selectedVoice) selectedVoice = voices.find(v => v.lang.includes('id') || v.lang.includes('ID'));
  }
  
  if (selectedVoice) utterance.voice = selectedVoice; 
  if (callback) utterance.onend = callback; 
  window.speechSynthesis.speak(utterance);
}

if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoiceList;
}

// --- NLP DARI BEFAST ---
function getLocalDateStr(dateObj = new Date()) {
  const year = dateObj.getFullYear(); const month = String(dateObj.getMonth() + 1).padStart(2, '0'); const day = String(dateObj.getDate()).padStart(2, '0'); return `${year}-${month}-${day}`;
}

function getRelativeDateStr(modifier) {
  let d = new Date(); if (modifier === 'kemarin') d.setDate(d.getDate() - 1); else if (modifier === 'bulan_lalu') d.setMonth(d.getMonth() - 1); else if (modifier === 'tahun_lalu') d.setFullYear(d.getFullYear() - 1);
  const year = d.getFullYear(); const month = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0'); return { full: `${year}-${month}-${day}`, ym: `${year}-${month}`, year: `${year}` };
}
// Set tanggal default untuk form manual saat file ini dimuat
document.addEventListener('DOMContentLoaded', () => {
    const manualDateInput = document.getElementById('manualDate');
    if(manualDateInput) manualDateInput.value = getLocalDateStr();
});


function parseNominal(str) {
  if (!str) return 0;
  let raw = str.toLowerCase().replace(/tanggal\s*\d{1,2}/gi, '').replace(/tahun\s*\d{4}/gi, '').replace(/rp|rupiah/gi, '').trim();
  
  let formattedMatches = raw.match(/\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d{1,3}(?:,\d{3})+(?:\.\d+)?/g);
  if (formattedMatches && formattedMatches.length > 0) {
    let maxVal = 0;
    for (let match of formattedMatches) { let cleanNumStr = match.split(',')[0].replace(/\./g, ''); let val = parseInt(cleanNumStr, 10); if (!isNaN(val) && val > maxVal) maxVal = val; }
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
      if (dayNum >= 1 && dayNum <= 31) { 
        let target = new Date(); target.setDate(dayNum); transactionDate = getLocalDateStr(target); 
      } 
    } 
  }
  
  let desc = cmd
    .replace(/\b(pemasukan|pengeluaran|masuk|keluar|beli|bayar|dapet|dapat|catat|tambah|tolong|rp|rupiah)\b/gi, '')
    .replace(/\b(kemarin|kemaren|hari ini|tanggal\s*\d{1,2})\b/gi, '')
    .replace(/\b(bulan|tahun)\s+(lalu|kemarin|ini)\b/gi, '')
    .replace(/\b\d{1,3}(\.\d{3})+(,\d+)?\b|\b\d{1,3}(,\d{3})+(\.\d+)?\b/g, '')
    .replace(/\b(nol|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|belas|puluh|ratus|ribu|rb|k|juta|jt|miliar|milyar|setengah|se|sejuta|seribu|seratus)\b/gi, '')
    .replace(/\b\d+\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
    
  if (!desc) { 
    desc = type === 'pemasukan' ? 'Pemasukan Lain' : 'Pengeluaran Lain'; 
  } else { 
    desc = desc.charAt(0).toUpperCase() + desc.slice(1); 
  }
  
  return { amount, desc, date: transactionDate };
}

function parseDateScopeFromCommand(cmd) {
  const monthNames = { 'januari': '01', 'jan': '01', 'februari': '02', 'feb': '02', 'maret': '03', 'mar': '03', 'april': '04', 'apr': '04', 'mei': '05', 'juni': '06', 'juli': '07', 'agustus': '08', 'agu': '08', 'september': '09', 'sep': '09', 'oktober': '10', 'okt': '10', 'november': '11', 'nov': '11', 'desember': '12', 'des': '12' };
  let periodLabel = "keseluruhan"; let filterFunc = () => true;
  if (cmd.includes('bulan lalu') || cmd.includes('bulan kemarin')) return { label: "bulan lalu", func: t => t.date.startsWith(getRelativeDateStr('bulan_lalu').ym) };
  if (cmd.includes('tahun lalu') || cmd.includes('tahun kemarin')) return { label: "tahun lalu", func: t => t.date.startsWith(getRelativeDateStr('tahun_lalu').year) };

  let yearMatch = cmd.match(/tahun\s*(\d{4})/i) || cmd.match(/ (20\d{2}) /); let targetYear = yearMatch ? (yearMatch[1] || yearMatch[0]) : null;
  let targetMonth = null; for (let mName in monthNames) { if (cmd.includes(mName)) { targetMonth = monthNames[mName]; break; } }
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

function executeVoiceDownload(cmd) { 
  if(typeof openExportModal === 'function') {
      openExportModal(); 
      speak("Pilih periode dan format laporannya ya."); 
  }
}

async function processVoiceCommand(cmd) {
  const user = getCurrentUser(); if (!user) { openLoginModal(); return; }
  if (cmd.includes('edit') || cmd.includes('ubah') || cmd.includes('ganti')) { executeVoiceEdit(cmd); return; }
  if (cmd.includes('hapus') || cmd.includes('delete') || cmd.includes('hilangin') || cmd.includes('bersihin') || cmd.includes('buang')) { executeVoiceDelete(cmd); return; }
  if (cmd.includes('download') || cmd.includes('unduh') || cmd.includes('simpan') || cmd.includes('ekspor') || cmd.includes('laporan pdf') || cmd.includes('laporan excel')) { executeVoiceDownload(cmd); return; }
  if (cmd.includes('grafik') || cmd.includes('chart')) { if(typeof showChartModal === 'function') showChartModal(cmd); return; }

  const nominal = parseNominal(cmd);
  const isExplicitReadout = cmd.includes('baca') || cmd.includes('bacakan') || cmd.includes('spill') || cmd.includes('cek') || cmd.includes('lihat') || cmd.includes('berapa') || cmd.includes('laporan') || cmd.includes('laporkan') || cmd.includes('total') || cmd.includes('sebutkan') || cmd.includes('informasikan') || cmd.includes('suarakan');
  const isQueryWithoutNominal = (nominal === 0) && (cmd.includes('pengeluaran') || cmd.includes('pemasukan') || cmd.includes('transaksi') || cmd.includes('catatan') || cmd.includes('keuangan'));

  if (isExplicitReadout || isQueryWithoutNominal) { executeVoiceReadout(cmd); return; }

  if (nominal > 0) {
    let type = 'pengeluaran'; if (cmd.includes('pemasukan') || cmd.includes('masuk') || cmd.includes('dapet') || cmd.includes('dapat') || cmd.includes('gaji') || cmd.includes('thr') || cmd.includes('transferan') || cmd.includes('honor') || cmd.includes('bonus')) type = 'pemasukan';
    let { amount, desc, date } = extractTransactionDetails(cmd, type);

    if (amount > 0) {
      const category = detectCategory(desc, type); updateSyncStatusUI(false, 'Menyimpan ke Cloud...');
      const { error } = await supabaseClient.from('transactions').insert([{ id: Date.now().toString(), user_id: user.id, date: date, type: type, category: category, amount: amount, desc: desc }]);
      if (error) { alert(`Gagal Disimpan: ${error.message}`); updateSyncStatusUI(false, 'Gagal Sinkron'); } 
      else { await fetchTransactionsFromSupabase(); speak(`Siap! Udah dicatat ${type} ${desc} sebesar ${amount.toLocaleString('id-ID')} rupiah.`); }
      return;
    }
  }
  speak("Nominal angkanya belum ketangkap nih. Coba sebutkan nominalnya.");
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null; let isListening = false; let finalAccumulatedTranscript = '';

if (SpeechRecognition) {
  recognition = new SpeechRecognition(); recognition.lang = 'id-ID'; recognition.continuous = false; recognition.interimResults = true;
  
  recognition.onstart = () => { 
    isListening = true; 
    finalAccumulatedTranscript = ''; 
    document.getElementById('btnMic').classList.add('mic-active', '!bg-[#DC2626]', '!text-white', '!shadow-[0_10px_30px_rgba(220,38,38,0.4)]'); 
    document.getElementById('speechStatus').innerText = "Sedang mendengarkan... Ngomong santai aja!"; 
  };
  
  recognition.onresult = (event) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalAccumulatedTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }
    const liveText = (finalAccumulatedTranscript + interimTranscript).trim();
    if (liveText) document.getElementById('transcriptText').innerText = `"${liveText}"`;
  };
  
  recognition.onerror = (event) => { 
    console.warn("Speech recognition error:", event.error);
    if (event.error === 'no-speech') {
      document.getElementById('speechStatus').innerText = "Belum terdengar suara nih."; 
    }
  };
  
  recognition.onend = () => {
    isListening = false; 
    document.getElementById('btnMic').classList.remove('mic-active', '!bg-[#DC2626]', '!text-white', '!shadow-[0_10px_30px_rgba(220,38,38,0.4)]'); 
    document.getElementById('speechStatus').innerText = "Klik mic lalu ngomong santai aja!";
    const cmd = finalAccumulatedTranscript.toLowerCase().trim(); 
    if (cmd && cmd.length >= 3) processVoiceCommand(cmd);
  };
}

document.getElementById('btnMic').addEventListener('click', () => {
  const user = getCurrentUser(); 
  if (!user) { speak("Eits, kamu harus masuk atau daftar dulu ya!"); openLoginModal(); return; }
  if (!recognition) return alert("Browser belum mendukung perekaman suara."); 
  if (isListening) { recognition.stop(); } else { recognition.start(); }
});