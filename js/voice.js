function getLocalDateStr(dateObj = new Date()) { const year = dateObj.getFullYear(); const month = String(dateObj.getMonth() + 1).padStart(2, '0'); const day = String(dateObj.getDate()).padStart(2, '0'); return `${year}-${month}-${day}`; }

document.addEventListener('DOMContentLoaded', () => {
  const mDate = document.getElementById('manualDate'); if(mDate) mDate.value = getLocalDateStr();
});

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
    let d = new Date(); d.setDate(d.getDate() - 1);
    transactionDate = getLocalDateStr(d); 
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

function executeVoiceDownload(cmd) { openExportModal(); speak("Silakan download laporannya."); }
function executeVoiceReadout(cmd) { speak("Ini adalah fitur baca laporan. Ringkasannya telah ditampilkan."); }

async function processVoiceCommand(cmd) {
  const user = getCurrentUser(); if (!user) { openLoginModal(); return; }
  if (cmd.includes('download')) { executeVoiceDownload(cmd); return; }
  if (cmd.includes('grafik') || cmd.includes('analisis')) { showChartModal(cmd); return; }
  if (cmd.includes('baca') || cmd.includes('cek')) { executeVoiceReadout(cmd); return; }

  const nominal = parseNominal(cmd);
  if (nominal > 0) {
    let type = 'pengeluaran'; 
    if (/(pemasukan|masuk|dapet|dapat|gaji|thr|transferan|honor|bonus)/i.test(cmd)) type = 'pemasukan';
    
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