function detectCategory(desc, type) {
  if (!desc) return type === 'pemasukan' ? 'Pendapatan' : 'Lain-lain'; 
  const text = desc.toLowerCase();
  
  if (type === 'pemasukan') {
    if (/(gaji|upah|honor|bonus|thr|dividen|uang jajan|sangu|transferan|masuk|nemu|dikasih)/i.test(text)) return 'Pendapatan';
    if (/(jual|omset|laba|dagang|toko|jualan|penjualan)/i.test(text)) return 'Penjualan / Usaha';
    if (/(hadiah|giveaway|cashback|undian|angpao)/i.test(text)) return 'Hadiah / Bonus'; return 'Pemasukan Lain';
  }
  if (/(makan|minum|kopi|cafe|resto|mie|nasi|roti|jajan|es|bakso|burger|pizza|gofood|grabfood|shopeefood|sate|soto|gorengan|indomie|warteg)/i.test(text)) return 'Makanan & Minuman';
  if (/(gojek|grab|maxim|ojek|bensin|pertalite|pertamax|spbu|parkir|tol|kereta|krl|mrt|bus|taksi|pesawat)/i.test(text)) return 'Transportasi';
  if (/(belanja|baju|celana|sepatu|shopee|tokped|lazada|skincare|makeup|sabun|odol|deterjen|kaos|indomaret|alfamart|supermarket)/i.test(text)) return 'Belanja';
  if (/(listrik|pln|wifi|indihome|internet|pulsa|kuota|pdam|air|bpjs|sewa|kos|kontrakan|cicilan|tagihan|topup|dana|gopay|ovo)/i.test(text)) return 'Tagihan & Utilitas';
  if (/(nonton|bioskop|cinema|xxi|game|diamond|steam|spotify|netflix|healing|nongkrong|liburan)/i.test(text)) return 'Hiburan & Hobi';
  if (/(obat|dokter|rumah sakit|klinik|apotek|vitamin|buku|kursus|spp|kuliah|sekolah|bimbel|fotocopy|print)/i.test(text)) return 'Kesehatan & Edukasi'; 
  return 'Lain-lain';
}

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
  e.preventDefault(); const user = getCurrentUser(); if(!user){ openLoginModal(); return; }
  const t = document.getElementById('manualType').value, d = document.getElementById('manualDate').value, desc = document.getElementById('manualDesc').value.trim(), a = parseInt(document.getElementById('manualAmount').value,10), c = document.getElementById('manualCategory').value;
  if(!desc || isNaN(a) || a<=0 || !d) return alert("Isi benar!");
  const cat = c==='Otomatis'?detectCategory(desc,t):c;
  updateSyncStatusUI(false, 'Simpan...');
  const { error } = await supabaseClient.from('transactions').insert([{id:Date.now().toString(),user_id:user.id,date:d,type:t,category:cat,amount:a,desc:desc}]);
  if(error) { alert('Gagal'); updateSyncStatusUI(false,'Gagal'); } else { await fetchTransactionsFromSupabase(); document.getElementById('manualForm').reset(); document.getElementById('manualDate').value=getLocalDateStr(); toggleManualForm(); }
}

async function deleteSingleItem(id) {
  if(!getCurrentUser()) return;
  if(confirm('Hapus transaksi ini?')) {
    updateSyncStatusUI(false, 'Hapus...');
    await supabaseClient.from('transactions').delete().eq('id',id);
    fetchTransactionsFromSupabase();
  }
}

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
  const container = document.getElementById('transactionList'); container.innerHTML = '';
  let inc=0, exp=0;
  transactions.forEach(t=>{
    if(t.type==='pemasukan') inc+=t.amount; else exp+=t.amount;
    const sign = t.type==='pemasukan'?'+':'-'; 
    const col = t.type==='pemasukan'?'text-green-600':'text-red-600';
    const bg = t.type==='pemasukan'?'bg-green-100 text-green-600':'bg-orange-100 text-orange-600';
    const catIcon = getCategoryIcon(t.category);
    
    const row = document.createElement('div');
    row.className = "flex items-center justify-between p-3 bg-white/50 rounded-xl hover:bg-white transition cursor-pointer mb-2 border border-white/40 shadow-sm";
    row.innerHTML = `
      <div class="flex items-center gap-3 w-full">
        <div class="w-10 h-10 rounded-lg flex-shrink-0 ${bg} flex items-center justify-center text-sm"><i class="fa-solid ${catIcon}"></i></div>
        <div class="flex flex-col flex-grow min-w-0">
           <h4 class="font-bold text-sm text-gray-800 truncate pr-2">${t.desc}</h4>
           <p class="text-[10px] text-gray-500 font-medium">${t.date} • ${t.category}</p>
        </div>
      </div>
      <div class="flex flex-col items-end flex-shrink-0">
         <p class="font-black text-sm ${col}">${sign} Rp ${t.amount.toLocaleString('id-ID')}</p>
         <button onclick="deleteSingleItem('${t.id}')" class="text-[9px] text-red-400 hover:text-red-600 mt-1 font-bold">Hapus</button>
      </div>`;
    container.appendChild(row);
  });
  if(transactions.length===0) container.innerHTML = '<p class="text-sm text-center text-gray-400 mt-10">Belum ada aktivitas</p>';
  
  document.getElementById('cardIncome').innerText = `Rp ${inc.toLocaleString('id-ID')}`;
  document.getElementById('cardExpense').innerText = `Rp ${exp.toLocaleString('id-ID')}`;
  document.getElementById('cardBalance').innerText = `Rp ${(inc-exp).toLocaleString('id-ID')}`;
  
  if(typeof updateSummaryUI === 'function') updateSummaryUI();
}