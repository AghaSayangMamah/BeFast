window.detectCategory = function(desc, type) {
  if (!desc) return type === 'pemasukan' ? 'Pendapatan' : 'Lain-lain'; 
  const text = desc.toLowerCase();
  
  if (type === 'pemasukan') {
    if (/(gaji|upah|honor|bonus|thr|dividen|uang jajan|sangu|transferan|masuk|nemu|dikasih|jual|omset|laba|dagang|toko|jualan|penjualan|hadiah|giveaway|cashback|undian|angpao|fee|komisi|insentif|proyek|project|freelance|parttime|kembalian|refund|sisa|piutang|modal|cair|bayaran|lunas|beasiswa|pesangon|warisan|arisan|adsense|patungan|sumbangan|santunan|tips|tip|untung|pendapatan|profit|dp|panjar|gajian|endorse|sponsorship|donatur|investasi|deposito|cuan|amplop)/i.test(text)) return 'Pendapatan';
    return 'Pemasukan Lain';
  }
  
  // 1. MAKANAN & MINUMAN (Monster Dataset - 150+ kata)
  if (/(makan|minum|kopi|cafe|resto|mie|nasi|roti|jajan|es|bakso|burger|pizza|gofood|grabfood|shopeefood|bebek|ayam|lele|ikan|seafood|padang|soto|sate|warteg|gorengan|teh|susu|jus|boba|matcha|camilan|snack|chiki|bubur|siomay|batagor|pempek|seblak|martabak|pecel|sosis|nugget|beras|telur|sayur|buah|daging|gula|garam|bumbu|kecap|saos|air|galon|warung|indomie|sarapan|siang|malam|traktiran|kue|cemilan|catering|mendoan|cireng|basreng|makaroni|kfc|mcd|hokben|richeese|starbucks|chatime|mixue|janji jiwa|gule|tongseng|rendang|dendeng|kikil|jeroan|udang|cumi|kerang|kepiting|bawal|gurame|nila|mujair|teri|bandeng|kerupuk|emping|sambal|terasi|tomat|cabe|bawang|jahe|kunyit|lengkuas|serai|santan|minyak goreng|mentega|margarin|keju|meses|selai|madu|sirup|kental manis|yogurt|yakult|cimory|sari roti|silverqueen|cadbury|taro|chitato|lays|doritos|pringles|oreo|biskuit|wafer|permen|yupi|bengbeng|choki|nutella|sereal|quaker|energen|sarden|kornet|abon|terigu|sagu|maizena|agar|jelly|puding|gelato|sorbet|alpukat|mangga|jeruk|apel|pisang|semangka|melon|nanas|pepaya|anggur|stroberi|durian|rambutan|duku|manggis|salak|kelengkeng|kurma|kismis|kacang|kuaci|mete|almond|edamame|tahu|tempe|oncom|kangkung|bayam|brokoli|wortel|kentang|kol|sawi|buncis|terong|pare|labu|timun|jamur)/i.test(text)) return 'Makanan & Minuman';
  
  // 2. TRANSPORTASI (Monster Dataset - 100+ kata)
  if (/(gojek|grab|maxim|ojek|bensin|pertalite|pertamax|spbu|parkir|tol|kereta|krl|mrt|bus|taksi|pesawat|tiket|travel|angkot|kapal|bengkel|tambal|ban|servis|cuci|oli|helm|jas hujan|stnk|pajak|e-toll|gocar|grabcar|indrive|lrt|transjakarta|tj|busway|angkutan|becak|bajaj|bentor|delman|feri|boat|speed boat|perahu|pelabuhan|stasiun|terminal|bandara|airport|boarding pass|bagasi|kargo|paket|ongkir|kurir|jne|jnt|sicepat|anteraja|ninja|gosend|grabexpress|lalamove|deliveree|sewa mobil|rental|carter|elf|hiace|bus pariwisata|ganti oli|tune up|sparepart|kampas rem|aki|busi|rantai|vbelt|shockbreaker|spion|lampu|wiper|klakson|velg|ban dalam|tubeless|nitrogen|spooring|balancing|cuci salju|poles|wax|salon mobil|asuransi mobil|denda tilang|sim|perpanjang sim|mutasi|balik nama|kir|toll|tapcash|flazz|brizzi|otoped|sepeda listrik|selis|moped|vespa|yamaha|honda|suzuki|kawasaki|toyota|daihatsu|mitsubishi|nissan|wuling|hyundai)/i.test(text)) return 'Transportasi';
  
  // 3. BELANJA (Monster Dataset - 150+ kata)
  if (/(belanja|baju|celana|sepatu|shopee|tokped|lazada|skincare|makeup|sabun|odol|deterjen|kaos|indomaret|alfamart|supermarket|mall|pasar|tas|dompet|jaket|topi|sandal|parfum|sampo|tisu|kosmetik|pampers|popok|dandan|kado|perabotan|plastik|grosir|minimarket|kemeja|rok|daster|elektronik|kamera|hp|laptop|charger|kabel|case|blibli|zalora|tiktok shop|bukalapak|hypermart|carrefour|transmart|superindo|lotte|giant|ramayana|matahari|thrift|thrifting|preloved|hoodie|sweater|cardigan|jas|kemeja flanel|jeans|chino|kulot|legging|gamis|tunik|hijab|jilbab|pashmina|mukena|sarung|peci|sajadah|kutang|cd|bh|bra|sempak|kaos kaki|ikat pinggang|sabuk|kacamata|jam tangan|gelang|kalung|cincin|anting|perhiasan|emas|perak|berlian|pelembab|toner|serum|sunscreen|sunblock|facial wash|masker wajah|lipstik|lip balm|foundation|bedak|eyeliner|maskara|pensil alis|blush on|kapas|cutton bud|deodoran|pomade|gel rambut|hairspray|pewarna rambut|catok|hairdryer|sisir|sikat gigi|obat kumur|pembalut|pantyliner|sabun cuci piring|sunlight|mama lemon|rinso|soklin|molto|pewangi|pel|sapu|kemoceng|spons|sikat wc|kapur barus|pengharum ruangan|baygon|hit|raket nyamuk|panci|wajan|teflon|spatula|pisau|telenan|piring|gelas|mangkok|sendok|garpu|tupperware|botol minum|termos|kipas angin|setrika|blender|mixer|kulkas|tv|ac|mesin cuci|lampu led|stop kontak|baterai)/i.test(text)) return 'Belanja';
  
  // 4. TAGIHAN & UTILITAS (Monster Dataset - 100+ kata)
  if (/(listrik|pln|wifi|indihome|internet|pulsa|kuota|pdam|air|bpjs|sewa|kos|kontrakan|cicilan|tagihan|topup|dana|gopay|ovo|shopeepay|linkaja|asuransi|pajak|langganan|iuran|rt|rw|sampah|keamanan|kartu kredit|paylater|pinjaman|utang|bayar|admin|transfer|denda|e-money|flazz|bni|bri|bca|mandiri|token|prabayar|pascabayar|telkomsel|xl|indosat|axis|smartfren|tri|byu|orbit|biznet|first media|myrepublic|mnc|megavision|cbn|oxygen|iconnet|pbb|samsat|aetra|palyja|bpjs kesehatan|bpjs ketenagakerjaan|prudential|allianz|manulife|aia|axa|bni life|bri life|pegadaian|cicilan motor|cicilan mobil|kpr|akulaku|kredivo|spaylater|gopaylater|indodana|tunaiku|pinjol|denda telat|biaya admin|potong saldo|admin bank|admin tf|flip|transfer antar bank|pph|ppn|retribusi|sumbangan wajib|kas rt|kas masjid|sedekah|infaq|zakat|wakaf|qurban|perpuluhan|kolekte|dana darurat|arisan|cicilan panci|sewa gedung|sewa kamera|denda perpus|biaya admin bulanan)/i.test(text)) return 'Tagihan & Utilitas';
  
  // 5. HIBURAN & HOBI (Monster Dataset - 150+ kata)
  if (/(nonton|bioskop|cinema|xxi|cgv|cinepolis|game|topup|diamond|steam|spotify|netflix|healing|nongkrong|liburan|jalan|main|konser|tiket|hotel|penginapan|vila|mainan|hobi|olahraga|gym|futsal|renang|sepeda|raket|bola|buku|komik|novel|premium|donasi|saweria|karaoke|piknik|wisata|disney|viu|hbo|prime video|iqiyi|wev|youtube premium|apple music|joox|mobile legends|pubg|free fire|valorant|genshin|roblox|minecraft|playstation|xbox|nintendo|ps4|ps5|stik ps|kaset ps|pc gaming|mouse|keyboard|headset|kursi gaming|gacha|skin|battle pass|event|festival|pameran|museum|kebun binatang|dufan|ancol|jatimpark|trans studio|waterboom|kolam renang|camping|glamping|tenda|gunung|pantai|curug|airbnb|reddoorz|oyo|traveloka|tiketcom|agoda|booking|pegipegi|biliar|bowling|golf|tenis|badminton|basket|voli|sepatu roda|skateboard|action figure|gundam|hotwheels|tamiya|lego|puzzle|rubik|alat lukis|kanvas|cat air|cat minyak|kuas|gitar|piano|drum|biola|senar|pick|kamera|lensa|tripod|drone|aquarium|ikan hias|aquascape|burung|kucing|anjing|petshop|makanan kucing|whiskas|royal canin|pasir kucing|tanaman hias|aglonema|monstera|pupuk|pot|trakteer)/i.test(text)) return 'Hiburan & Hobi';
  
  // 6. KESEHATAN & EDUKASI (Monster Dataset - 150+ kata)
  if (/(obat|dokter|rumah sakit|klinik|apotek|rs|vitamin|buku|kursus|spp|kuliah|sekolah|bimbel|fotocopy|print|alat tulis|atk|jilid|skripsi|ukt|pendaftaran|les|suplemen|masker|handsanitizer|periksa|gigi|mata|kacamata|lab|rontgen|puskesmas|bidan|seminar|workshop|kertas|pena|pensil|paracetamol|panadol|bodrex|oskadon|promag|mylanta|sangobion|neurobion|antangin|tolak angin|betadine|hansaplast|perban|kapas|minyak kayu putih|telon|balsem|koyo|sirup daktarin|termometer|tensi|tespek|testpack|swab|pcr|antigen|rapid|vaksin|imunisasi|usg|scalling|cabut gigi|tambal gigi|kawat gigi|behel|softlens|tetes mata|operasi|rawat inap|rawat jalan|tebus resep|fisioterapi|pijat|urut|refleksi|bekam|akupuntur|uang pangkal|seragam|lks|buku paket|buku tulis|pensil warna|krayon|spidol|penghapus|penggaris|jangka|busur|kalkulator|map|binder|folio|hvs|jilid spiral|laminating|materai|terjemahan|proofreading|turnitin|wisuda|toga|ujian|uts|uas|snmptn|sbmptn|utbk|tes cpns|toefl|ielts|ruangguru|zenius|quipper|bootcamp|udemy|coursera|edx|prakerja|sertifikasi|pelatihan|webinar|seminar nasional|konferensi|jurnal|buku impor|kamus|ensiklopedia)/i.test(text)) return 'Kesehatan & Edukasi'; 
  
  return 'Lain-lain';
};

function updateSyncStatusUI(ok, msg='') {
  const b = document.getElementById('syncStatusBadge'); if(!b) return;
  if(ok) { b.className="text-[9px] px-2 py-0.5 rounded font-bold bg-green-100 text-green-600"; b.innerHTML='<i class="fa-solid fa-cloud-check"></i> Sinkron'; }
  else { b.className="text-[9px] px-2 py-0.5 rounded font-bold bg-red-100 text-red-600"; b.innerHTML=`<i class="fa-solid fa-cloud-arrow-down"></i> ${msg||'Offline'}`; }
}

async function fetchTransactionsFromSupabase() {
  const user = getCurrentUser(); if(!user) { transactions=[]; renderData(); updateSyncStatusUI(false); return; }
  try {
    updateSyncStatusUI(false, 'Sinkron...');
    const { data, error } = await supabaseClient.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false });
    if(error) throw error;
    transactions = (data||[]).map(i=>({id:String(i.id),date:i.date,type:i.type,category:i.category||detectCategory(i.desc,i.type),amount:Number(i.amount),desc:i.desc}));
    renderData(); updateSyncStatusUI(true);
  } catch(e) { updateSyncStatusUI(false,'Gagal'); }
}

async function addManualTransaction(e) {
  e.preventDefault(); 
  const user = getCurrentUser(); 
  if(!user){ openLoginModal(); return; }
  
  const t = document.getElementById('manualType').value;
  const d = document.getElementById('manualDate').value;
  const desc = document.getElementById('manualDesc').value.trim();
  const c = document.getElementById('manualCategory').value;
  
  // REVISI: Hapus format titik (.) sebelum diubah ke angka (Integer)
  const rawAmount = document.getElementById('manualAmount').value.replace(/\./g, '');
  const a = parseInt(rawAmount, 10);
  
  if(!desc || isNaN(a) || a<=0 || !d) return alert("Mohon isi dengan benar!");
  
  const cat = c === 'Otomatis' ? detectCategory(desc, t) : c;
  
  updateSyncStatusUI(false, 'Menyimpan...');
  const { error } = await supabaseClient.from('transactions').insert([{
    id: Date.now().toString(),
    user_id: user.id,
    date: d,
    type: t,
    category: cat,
    amount: a,
    desc: desc
  }]);
  
  if(error) { 
    alert('Gagal disimpan ke database.'); 
    updateSyncStatusUI(false, 'Gagal'); 
  } else { 
    await fetchTransactionsFromSupabase(); 
    
    // Reset Form Input
    document.getElementById('manualForm').reset(); 
    
    // Reset tampilan custom dropdown kembali ke awal
    document.querySelector('[data-id="manualType"] .selected-text').innerText = 'Pengeluaran';
    document.getElementById('manualType').value = 'pengeluaran';
    document.querySelector('[data-id="manualCategory"] .selected-text').innerText = '✨ Otomatis (AI)';
    document.getElementById('manualCategory').value = 'Otomatis';
    
// Reset kalender Flatpickr ke hari ini
    const dateInput = document.getElementById('manualDate');
    if (dateInput && dateInput._flatpickr) {
      dateInput._flatpickr.setDate(new Date());
    }
        toggleManualForm(); 
  }
}
// Variabel penyimpan ID sementara
let pendingDeleteId = null;

window.deleteSingleItem = function(id) {
  if (!getCurrentUser()) return;
  pendingDeleteId = id; // Simpan ID yang mau dihapus
  const modal = document.getElementById('deleteConfirmModal');
  if (modal) modal.classList.remove('hidden'); // Munculkan pop-up cantik
};

window.closeDeleteModal = function() {
  pendingDeleteId = null;
  const modal = document.getElementById('deleteConfirmModal');
  if (modal) modal.classList.add('hidden'); // Tutup pop-up
};

window.confirmDelete = async function() {
  if (!pendingDeleteId) return;
  const id = pendingDeleteId;
  closeDeleteModal(); // Langsung tutup pop-up biar responsif

  updateSyncStatusUI(false, 'Menghapus...');
  const { error } = await supabaseClient.from('transactions').delete().eq('id', id);
  
  if (error) {
    alert('Gagal menghapus data.');
    updateSyncStatusUI(false, 'Gagal');
  } else {
    fetchTransactionsFromSupabase(); // Refresh list otomatis
  }
};

function getCategoryIcon(cat) {
  if(cat.includes('Makanan')) return 'fa-utensils';
  if(cat.includes('Transportasi')) return 'fa-car';
  if(cat.includes('Belanja')) return 'fa-bag-shopping';
  if(cat.includes('Tagihan')) return 'fa-bolt';
  if(cat.includes('Hiburan')) return 'fa-gamepad';
  if(cat.includes('Kesehatan')) return 'fa-heart-pulse';
  if(cat.includes('Pendapatan') || cat.includes('Bonus')) return 'fa-money-bill-wave';
  return 'fa-tag';
}

function renderData() {
  // --- LOGIKA SORTING BARU (Paling atas) ---
  // Urutkan dari Tanggal terbaru. Jika tanggal sama, urutkan dari ID (Waktu Pembuatan) terbaru.
  transactions.sort((a, b) => {
    const dateDiff = new Date(b.date) - new Date(a.date);
    if (dateDiff !== 0) return dateDiff;
    return Number(b.id) - Number(a.id); 
  });

  const container = document.getElementById('transactionList'); 
  if (container) container.innerHTML = '';
  
  let inc = 0, exp = 0;
  
  transactions.forEach(t => {
    if (t.type === 'pemasukan') inc += t.amount; else exp += t.amount;
    const sign = t.type === 'pemasukan' ? '+' : '-'; 
    const col = t.type === 'pemasukan' ? 'text-green-500' : 'text-red-500';
    const bg = t.type === 'pemasukan' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500';
    const catIcon = getCategoryIcon(t.category);
    
    const row = document.createElement('div');
    row.className = "flex items-center justify-between p-3 theme-bg-light rounded-xl hover:opacity-80 transition cursor-pointer mb-2 border border-gray-400/10 shadow-sm shrink-0 group";
    
    row.innerHTML = `
      <div class="flex items-center gap-3 w-full">
        <div class="w-10 h-10 rounded-lg flex-shrink-0 ${bg} flex items-center justify-center text-sm"><i class="fa-solid ${catIcon}"></i></div>
        <div class="flex flex-col flex-grow min-w-0">
           <h4 class="font-bold text-sm theme-text truncate pr-2">${t.desc}</h4>
           <p class="text-[10px] theme-text-muted font-medium">${t.date} • ${t.category}</p>
        </div>
      </div>
      <div class="flex flex-col items-end flex-shrink-0">
         <p class="font-black text-sm ${col} whitespace-nowrap">${sign} Rp ${t.amount.toLocaleString('id-ID')}</p>
         <button onclick="deleteSingleItem('${t.id}')" class="text-[9px] text-red-500/70 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1 font-bold">Hapus</button>
      </div>`;
    if(container) container.appendChild(row);
  });
  
  if (transactions.length === 0 && container) {
      container.innerHTML = '<p class="text-sm text-center theme-text-muted mt-10">Belum ada aktivitas</p>';
  }
  
  const elInc = document.getElementById('cardIncome');
  const elExp = document.getElementById('cardExpense');
  const elBal = document.getElementById('cardBalance');
  
  if (elInc) elInc.innerText = `Rp ${inc.toLocaleString('id-ID')}`;
  if (elExp) elExp.innerText = `Rp ${exp.toLocaleString('id-ID')}`;
  if (elBal) elBal.innerText = `Rp ${(inc-exp).toLocaleString('id-ID')}`;
  
  if (typeof updateSummaryUI === 'function') updateSummaryUI();
}

// =====================================================================
// TRIGGER AUTO-LOAD (MEMPERBAIKI BUG BLANK SAAT RELOAD / BACK PAGE)
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Mengecek apakah user sudah login di local storage saat halaman selesai dimuat
  if (getCurrentUser()) {
    fetchTransactionsFromSupabase();
  }
});