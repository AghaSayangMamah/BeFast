function detectCategory(d, t) {
  if(!d) return t==='pemasukan'?'Pendapatan':'Lain-lain'; let x = d.toLowerCase();
  if(t==='pemasukan') {
    if(/(gaji|bonus)/i.test(x)) return 'Pendapatan';
    if(/(jual)/i.test(x)) return 'Penjualan / Usaha'; return 'Pemasukan Lain';
  }
  if(/(makan|minum|kopi)/i.test(x)) return 'Makanan & Minuman';
  if(/(bensin|gojek)/i.test(x)) return 'Transportasi'; return 'Lain-lain';
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
  if(confirm('Hapus transaksi?')) {
    updateSyncStatusUI(false, 'Hapus...');
    await supabaseClient.from('transactions').delete().eq('id',id);
    fetchTransactionsFromSupabase();
  }
}

function renderData() {
  const container = document.getElementById('transactionList'); container.innerHTML = '';
  let inc=0, exp=0;
  transactions.forEach(t=>{
    if(t.type==='pemasukan') inc+=t.amount; else exp+=t.amount;
    const sign = t.type==='pemasukan'?'+':'-'; const col = t.type==='pemasukan'?'text-green-600':'text-red-600';
    const bg = t.type==='pemasukan'?'bg-green-100 text-green-600':'bg-orange-100 text-orange-600';
    const row = document.createElement('div');
    row.className = "flex items-center justify-between p-3 bg-white/50 rounded-xl hover:bg-white transition cursor-pointer mb-2 border border-white/40";
    row.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg flex-shrink-0 ${bg} flex items-center justify-center text-sm"><i class="fa-solid fa-money-bill"></i></div>
        <div class="flex flex-col">
           <h4 class="font-bold text-sm text-gray-800">${t.desc}</h4>
           <p class="text-[10px] text-gray-500">${t.date}</p>
        </div>
      </div>
      <div class="flex flex-col items-end">
         <p class="font-black text-sm ${col}">${sign} Rp ${t.amount.toLocaleString('id-ID')}</p>
         <button onclick="deleteSingleItem('${t.id}')" class="text-[9px] text-red-400 hover:text-red-600 mt-1">Hapus</button>
      </div>`;
    container.appendChild(row);
  });
  if(transactions.length===0) container.innerHTML = '<p class="text-sm text-center text-gray-400 mt-10">Belum ada aktivitas</p>';
  
  document.getElementById('cardIncome').innerText = `Rp ${inc.toLocaleString('id-ID')}`;
  document.getElementById('cardExpense').innerText = `Rp ${exp.toLocaleString('id-ID')}`;
  document.getElementById('cardBalance').innerText = `Rp ${(inc-exp).toLocaleString('id-ID')}`;
  
  if(typeof updateSummaryUI === 'function') updateSummaryUI();
}