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
  let raw = str.toLowerCase().replace(/tanggal\s*\d{1,2}/gi, '').replace(/tahun\s*\d{4}/gi, '').replace(/rp|rupiah/gi, '').trim();
  let matches = raw.match(/\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d{1,3}(?:,\d{3})+(?:\.\d+)?/g);
  if(matches) return parseInt(matches[0].replace(/\./g, ''), 10);
  
  let text = raw.replace(/ribu/g,'000').replace(/juta/g,'000000');
  let num = parseInt(text.replace(/\D/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

function executeVoiceDownload(cmd) { openExportModal(); speak("Silakan download laporannya."); }
function executeVoiceReadout(cmd) { speak("Ini adalah fitur baca laporan. Ringkasannya telah ditampilkan."); }

async function processVoiceCommand(cmd) {
  const user = getCurrentUser(); if (!user) { openLoginModal(); return; }
  if (cmd.includes('download')) { executeVoiceDownload(cmd); return; }
  if (cmd.includes('grafik') || cmd.includes('analisis')) { showChartModal(cmd); return; }
  if (cmd.includes('baca') || cmd.includes('cek')) { executeVoiceReadout(cmd); return; }

  const amount = parseNominal(cmd);
  if (amount > 0) {
    let type = cmd.includes('masuk') || cmd.includes('gaji') ? 'pemasukan' : 'pengeluaran';
    let desc = cmd.replace(/\d+/g, '').replace(/ribu|juta/g, '').trim() || 'Transaksi Suara';
    
    updateSyncStatusUI(false, 'Menyimpan...');
    const { error } = await supabaseClient.from('transactions').insert([{ id: Date.now().toString(), user_id: user.id, date: getLocalDateStr(), type: type, category: detectCategory(desc, type), amount: amount, desc: desc }]);
    if (!error) { await fetchTransactionsFromSupabase(); speak(`Siap, ${type} ${amount} rupiah dicatat.`); }
    return;
  }
  speak("Nominal angkanya belum ketangkap nih.");
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