function detectCategory(desc, type) {
  if (!desc) return type === 'pemasukan' ? 'Pendapatan' : 'Lain-lain'; const text = desc.toLowerCase();
  if (type === 'pemasukan') {
    if (/(gaji|upah|honor|bonus|thr|dividen|uang jajan|sangu|transferan|masuk)/i.test(text)) return 'Pendapatan';
    if (/(jual|omset|laba|dagang|toko|jualan|penjualan)/i.test(text)) return 'Penjualan / Usaha';
    if (/(hadiah|giveaway|cashback|undian|angpao|bonus)/i.test(text)) return 'Hadiah / Bonus'; return 'Pemasukan Lain';
  }
  if (/(makan|minum|kopi|cafe|resto|mie|nasi|roti|jajan|es|bakso|burger|pizza|gofood|grabfood|shopeefood)/i.test(text)) return 'Makanan & Minuman';
  if (/(gojek|grab|maxim|ojek|bensin|pertalite|pertamax|spbu|parkir|tol|kereta|krl|mrt|bus|taksi|pesawat)/i.test(text)) return 'Transportasi';
  if (/(belanja|baju|celana|sepatu|shopee|tokped|lazada|skincare|makeup|sabun|odol|deterjen|kaos)/i.test(text)) return 'Belanja';
  if (/(listrik|pln|wifi|indihome|internet|pulsa|kuota|pdam|air|bpjs|sewa|kos|kontrakan|cicilan|tagihan)/i.test(text)) return 'Tagihan & Utilitas';
  if (/(nonton|bioskop|cinema|xxi|game|topup|diamond|steam|spotify|netflix|healing|nongkrong|liburan)/i.test(text)) return 'Hiburan & Hobi';
  if (/(obat|dokter|rumah sakit|klinik|apotek|vitamin|buku|kursus|spp|kuliah|sekolah|bimbel|fotocopy|print)/i.test(text)) return 'Kesehatan & Edukasi'; return 'Lain-lain';
}

function updateSyncStatusUI(isSynced, message = '') {
  const badge = document.getElementById('syncStatusBadge'); if (!badge) return;
  if (isSynced) { badge.className = "text-[9px] md:text-[10px] px-2 py-0.5 rounded font-bold bg-[#10b981]/15 text-[#10b981] flex items-center gap-1"; badge.innerHTML = '<i class="fa-solid fa-cloud-check"></i> Tersinkron'; } 
  else { badge.className = "text-[9px] md:text-[10px] px-2 py-0.5 rounded font-bold bg-[#ef4444]/15 text-[#ef4444] flex items-center gap-1"; badge.innerHTML = `<i class="fa-solid fa-cloud-arrow-down"></i> ${message || 'Belum Login'}`; }
}

async function ensurePublicUserExists(user) { try { await supabaseClient.from('users').upsert({ id: user.id, username: user.user_metadata?.full_name || 'User', phone_number: user.user_metadata?.phone_number || '-', email: user.email || '-' }); } catch (e) {} }

async function fetchTransactionsFromSupabase() {
  const user = getCurrentUser(); if (!supabaseClient || !user) { transactions = []; renderData(); updateSyncStatusUI(false, 'Belum Login'); return; }
  await ensurePublicUserExists(user);
  try {
    updateSyncStatusUI(false, 'Menyinkronkan...');
    const { data, error } = await supabaseClient.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false });
    if (error) throw error;
    transactions = (data || []).map(item => ({ id: String(item.id), date: item.date, type: item.type, category: item.category || detectCategory(item.desc, item.type), amount: Number(item.amount), desc: item.desc }));
    renderData(); updateSyncStatusUI(true);
  } catch (err) { updateSyncStatusUI(false, 'Gagal Sinkron'); }
}

async function addManualTransaction(e) {
  e.preventDefault(); const user = getCurrentUser(); if (!user) { openLoginModal(); return; }
  const type = document.getElementById('manualType').value; const date = document.getElementById('manualDate').value; const descInput = document.getElementById('manualDesc').value.trim(); const amountInput = parseInt(document.getElementById('manualAmount').value, 10); const catSelect = document.getElementById('manualCategory').value;
  if (!descInput || isNaN(amountInput) || amountInput <= 0 || !date) return alert("Mohon isi dengan benar!");
  const descFormatted = descInput.charAt(0).toUpperCase() + descInput.slice(1); const category = (catSelect === 'Otomatis' || !catSelect) ? detectCategory(descFormatted, type) : catSelect;
  updateSyncStatusUI(false, 'Menyimpan...');
  const { error } = await supabaseClient.from('transactions').insert([{ id: Date.now().toString(), user_id: user.id, date: date, type: type, category: category, amount: amountInput, desc: descFormatted }]);
  if (error) { alert(`Gagal: ${error.message}`); updateSyncStatusUI(false, 'Gagal Menyimpan'); } 
  else { await fetchTransactionsFromSupabase(); document.getElementById('manualDesc').value = ''; document.getElementById('manualAmount').value = ''; if(typeof speak === 'function') speak(`Sip! Catatan ditambahkan.`); }
}

async function deleteSingleItem(id) {
  const user = getCurrentUser(); if (!user) return openLoginModal(); const item = transactions.find(t => String(t.id) === String(id)); if (!item) return;
  if (confirm(`Hapus transaksi "${item.desc}"?`)) {
    updateSyncStatusUI(false, 'Menghapus...');
    const { error } = await supabaseClient.from('transactions').delete().eq('id', id);
    if (error) { alert(`Gagal: ${error.message}`); updateSyncStatusUI(false, 'Gagal Menghapus'); } else { await fetchTransactionsFromSupabase(); if(typeof speak === 'function') speak(`Catatan dihapus.`); }
  }
}

async function editSingleItem(id) {
  const user = getCurrentUser(); if (!user) return openLoginModal(); const item = transactions.find(t => String(t.id) === String(id)); if (!item) return;
  const newDesc = prompt("Ubah keterangan:", item.desc); if (newDesc === null) return;
  const newAmountStr = prompt("Ubah nominal (Rp):", item.amount); if (newAmountStr === null) return;
  const newAmount = parseInt(newAmountStr, 10); if (isNaN(newAmount) || newAmount <= 0) return alert("Nominal tidak valid!");
  const updatedDesc = newDesc.trim() || item.desc; const updatedCat = detectCategory(updatedDesc, item.type);
  updateSyncStatusUI(false, 'Mengubah...');
  const { error } = await supabaseClient.from('transactions').update({ desc: updatedDesc, amount: newAmount, category: updatedCat }).eq('id', id);
  if (error) { alert(`Gagal: ${error.message}`); updateSyncStatusUI(false, 'Gagal Mengubah'); } else { await fetchTransactionsFromSupabase(); if(typeof speak === 'function') speak(`Catatan diperbarui.`); }
}

function getCategoryStyle(category) {
  const styles = {
    'Makanan & Minuman': { bg: 'bg-[#f59e0b]/15 text-[#f59e0b]', icon: 'fa-utensils' }, 'Transportasi': { bg: 'bg-[#3b82f6]/15 text-[#3b82f6]', icon: 'fa-car' },
    'Belanja': { bg: 'bg-[#9333ea]/15 text-[#9333ea]', icon: 'fa-bag-shopping' }, 'Tagihan & Utilitas': { bg: 'bg-[#eab308]/15 text-[#eab308]', icon: 'fa-bolt' },
    'Hiburan & Hobi': { bg: 'bg-[#ec4899]/15 text-[#ec4899]', icon: 'fa-gamepad' }, 'Kesehatan & Edukasi': { bg: 'bg-[#14b8a6]/15 text-[#14b8a6]', icon: 'fa-heart-pulse' },
    'Pendapatan': { bg: 'bg-[#10b981]/15 text-[#10b981]', icon: 'fa-money-bill-wave' }, 'Penjualan / Usaha': { bg: 'bg-[#059669]/15 text-[#059669]', icon: 'fa-store' },
    'Hadiah / Bonus': { bg: 'bg-[#6366f1]/15 text-[#6366f1]', icon: 'fa-gift' }, 'Pemasukan Lain': { bg: 'bg-[#10b981]/15 text-[#10b981]', icon: 'fa-arrow-down' },
    'Lain-lain': { bg: 'bg-[var(--border-color)] text-[var(--text-muted)]', icon: 'fa-tag' }
  }; return styles[category] || styles['Lain-lain'];
}

function renderData() {
  const listContainer = document.getElementById('transactionList'); listContainer.innerHTML = '';
  let totalInc = 0; let totalExp = 0;

  transactions.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach((item) => {
    if (item.type === 'pemasukan') totalInc += item.amount;
    if (item.type === 'pengeluaran') totalExp += item.amount;
    const cat = item.category || detectCategory(item.desc, item.type); const style = getCategoryStyle(cat);
    const amountSign = item.type === 'pemasukan' ? '+' : '-'; const amountColor = item.type === 'pemasukan' ? 'text-[#10b981]' : 'text-[#ef4444]';
    
    const row = document.createElement('div');
    row.className = "flex items-center justify-between p-4 bg-[var(--bg-sec)] rounded-2xl border border-[var(--border-color)] hover:border-[var(--primary)] transition-colors group";
    row.innerHTML = `
      <div class="flex items-center gap-4 w-full">
        <div class="w-12 h-12 rounded-full flex-shrink-0 ${style.bg} flex items-center justify-center text-lg"><i class="fa-solid ${style.icon}"></i></div>
        <div class="flex flex-col flex-grow min-w-0">
           <h4 class="font-bold text-[var(--text-main)] text-sm md:text-base truncate pr-2">${item.desc}</h4>
           <p class="text-[11px] text-[var(--text-muted)] font-medium">${item.date} • ${cat}</p>
        </div>
        <div class="flex flex-col items-end flex-shrink-0 gap-1">
           <p class="font-black text-sm md:text-base ${amountColor}">${amountSign} Rp ${item.amount.toLocaleString('id-ID')}</p>
           <div class="hidden md:group-hover:flex gap-1">
              <button onclick="editSingleItem('${item.id}')" class="w-7 h-7 rounded-full bg-[#3b82f6]/15 text-[#3b82f6] flex items-center justify-center hover:bg-blue-200 transition"><i class="fa-solid fa-pen text-[10px]"></i></button>
              <button onclick="deleteSingleItem('${item.id}')" class="w-7 h-7 rounded-full bg-[#ef4444]/15 text-[#ef4444] flex items-center justify-center hover:bg-red-200 transition"><i class="fa-solid fa-trash text-[10px]"></i></button>
           </div>
           <div class="flex md:hidden gap-1">
              <button onclick="editSingleItem('${item.id}')" class="w-6 h-6 rounded-full bg-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center"><i class="fa-solid fa-pen text-[9px]"></i></button>
              <button onclick="deleteSingleItem('${item.id}')" class="w-6 h-6 rounded-full bg-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center"><i class="fa-solid fa-trash text-[9px]"></i></button>
           </div>
        </div>
      </div>
    `; listContainer.appendChild(row);
  });
  document.getElementById('cardIncome').innerText = `Rp ${totalInc.toLocaleString('id-ID')}`;
  document.getElementById('cardExpense').innerText = `Rp ${totalExp.toLocaleString('id-ID')}`;
  document.getElementById('cardBalance').innerText = `Rp ${(totalInc - totalExp).toLocaleString('id-ID')}`;
}

// Inisialisasi awal fetch data
if (getCurrentUser()) fetchTransactionsFromSupabase();