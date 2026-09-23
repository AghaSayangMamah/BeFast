function toggleManualForm() {
  const modal = document.getElementById('manualInputModal');
  if (modal.classList.contains('hidden')) modal.classList.remove('hidden');
  else modal.classList.add('hidden');
}

function openGuideModal() { document.getElementById('guideModal').classList.remove('hidden'); }
function closeGuideModal() { document.getElementById('guideModal').classList.add('hidden'); }
function closeChartModal() { document.getElementById('chartModal').classList.add('hidden'); if(modalTimer) clearTimeout(modalTimer); }
function togglePassword(inputId, iconId) {
  const input = document.getElementById(inputId); const icon = document.getElementById(iconId);
  if (input.type === "password") { input.type = "text"; icon.classList.replace('fa-eye', 'fa-eye-slash'); } 
  else { input.type = "password"; icon.classList.replace('fa-eye-slash', 'fa-eye'); }
}

function updateSummaryUI() {
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const chartContainer = document.getElementById('chartContainer');
  const emptyState = document.getElementById('emptyStateSummary');
  const emptyText = document.getElementById('emptyStateText');

  if (!user) {
    chartContainer.classList.add('hidden'); emptyState.classList.remove('hidden');
    emptyText.innerText = "Silakan masuk/daftar untuk melihat ringkasan keuanganmu.";
  } else if (typeof transactions !== 'undefined' && transactions.length === 0) {
    chartContainer.classList.add('hidden'); emptyState.classList.remove('hidden');
    emptyText.innerText = "Belum ada transaksi akhir-akhir ini. Yuk catat pengeluaran pertamamu!";
  } else {
    emptyState.classList.add('hidden'); chartContainer.classList.remove('hidden');
    renderMiniBarChart();
  }
  
  if(typeof updateAIInsight === 'function') updateAIInsight();
}

let miniChartInstance = null;
function renderMiniBarChart() {
  const ctx = document.getElementById('miniBarChart'); if(!ctx) return;
  if (miniChartInstance) miniChartInstance.destroy();
  
  const labels = [];
  const expenseData = [];
  const incomeData = [];
  
  // Ambil 7 hari terakhir
  for(let i=6; i>=0; i--) {
    let d = new Date();
    d.setDate(d.getDate() - i);
    let dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    let displayDate = `${d.getDate()}/${d.getMonth()+1}`;
    
    let dailyExpense = transactions.filter(t => t.type === 'pengeluaran' && t.date === dateStr).reduce((sum, t) => sum + t.amount, 0);
    let dailyIncome = transactions.filter(t => t.type === 'pemasukan' && t.date === dateStr).reduce((sum, t) => sum + t.amount, 0);
        
    labels.push(displayDate);
    expenseData.push(dailyExpense);
    incomeData.push(dailyIncome);
  }

  miniChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Pemasukan',
          data: incomeData, 
          backgroundColor: '#10b981', // Hijau Pemasukan
          borderRadius: 4, borderSkipped: false
        },
        {
          label: 'Pengeluaran',
          data: expenseData, 
          backgroundColor: '#ef4444', // Merah Pengeluaran
          borderRadius: 4, borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, datalabels: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#94a3b8' }, border: {display: false} },
        y: { display: false } 
      }
    }
  });
}

function updateAIInsight() {
  const insightTitle = document.getElementById('insightTitle');
  const insightDesc = document.getElementById('insightDesc');
  const insightIcon = document.getElementById('insightIcon');
  if(!insightTitle || !insightDesc) return;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyExpenses = transactions.filter(t => t.type === 'pengeluaran' && t.date.startsWith(currentMonth));

  if (monthlyExpenses.length === 0) {
    insightTitle.innerText = "Belum Ada Pola";
    insightDesc.innerText = "Yuk catat pengeluaran pertamamu bulan ini agar AI bisa menganalisa.";
    if(insightIcon) insightIcon.innerText = "💡";
    return;
  }

  const categoryTotals = {};
  monthlyExpenses.forEach(t => {
    const cat = t.category || 'Lain-lain';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
  });

  let maxCategory = ''; let maxAmount = 0;
  for (const [cat, amt] of Object.entries(categoryTotals)) {
    if (amt > maxAmount) { maxAmount = amt; maxCategory = cat; }
  }

  if (maxCategory === 'Makanan & Minuman') {
    insightTitle.innerText = "Pengeluaran makanmu mendominasi.";
    insightDesc.innerText = `Kurangi jajan/gofood biar lebih hemat! Kamu udah habis Rp ${maxAmount.toLocaleString('id-ID')} buat makan.`;
    if(insightIcon) insightIcon.innerText = "🍔";
  } else if (maxCategory === 'Belanja') {
    insightTitle.innerText = "Awas lapar mata!";
    insightDesc.innerText = `Pengeluaran belanja kamu tinggi (Rp ${maxAmount.toLocaleString('id-ID')}). Tahan dulu belanjanya ya.`;
    if(insightIcon) insightIcon.innerText = "🛍️";
  } else if (maxCategory === 'Transportasi') {
    insightTitle.innerText = "Biaya mobilitas bengkak.";
    insightDesc.innerText = `Kamu habis Rp ${maxAmount.toLocaleString('id-ID')} buat transportasi. Coba cari opsi lebih hemat.`;
    if(insightIcon) insightIcon.innerText = "🚗";
  } else {
    insightTitle.innerText = `Pengeluaran ${maxCategory} tertinggi.`;
    insightDesc.innerText = `Bulan ini kamu menghabiskan Rp ${maxAmount.toLocaleString('id-ID')} untuk ${maxCategory}. Tetap kontrol pengeluaranmu!`;
    if(insightIcon) insightIcon.innerText = "💡";
  }
}

// FORMATTER UANG REAL-TIME (Agar muncul titik pemisah ribuan)
function formatCurrencyInput(input) {
  // Hapus semua karakter selain angka
  let value = input.value.replace(/\D/g, '');
  // Format dengan titik ala Indonesia (id-ID)
  if (value) {
    value = parseInt(value, 10).toLocaleString('id-ID');
  }
  input.value = value;
}

// SETUP CUSTOM DROPDOWN (Agar UI Dropdown melayang bisa diklik)
function setupCustomDropdowns() {
  document.addEventListener('click', e => {
    const isDropdown = e.target.closest('.custom-dropdown');
    document.querySelectorAll('.options-list').forEach(list => { 
      if (!isDropdown || list !== isDropdown.closest('.custom-dropdown').querySelector('.options-list')) {
        list.classList.add('hidden'); 
      }
    });
  });

  document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
    const trigger = dropdown.querySelector('.select-trigger');
    const list = dropdown.querySelector('.options-list');
    if (!trigger || !list) return;

    const textSpan = trigger.querySelector('.selected-text');
    const hiddenInput = dropdown.dataset.id ? document.getElementById(dropdown.dataset.id) : null;

    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      list.classList.toggle('hidden');
    });

    list.querySelectorAll('li').forEach(option => {
      option.addEventListener('click', () => {
        if (textSpan && hiddenInput) {
          textSpan.innerHTML = option.innerHTML;
          hiddenInput.value = option.dataset.value || option.innerText.trim();
        }
        list.classList.add('hidden');
      });
    });
  });
}

function createCalendarDropdown(container, value, options, onChange) {
  const dropdown = document.createElement('div');
  dropdown.className = 'calendar-dropdown';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'calendar-dropdown-trigger';
  trigger.innerHTML = `<span>${options[value]}</span><span class="calendar-dropdown-chevron">⌄</span>`;

  const list = document.createElement('ul');
  list.className = 'calendar-dropdown-list';

  Object.entries(options).forEach(([optionValue, label]) => {
    const option = document.createElement('li');
    option.className = 'calendar-dropdown-option';
    option.textContent = label;
    option.dataset.value = optionValue;
    if (String(optionValue) === String(value)) option.classList.add('selected');
    option.addEventListener('click', () => {
      onChange(optionValue);
      trigger.firstElementChild.textContent = label;
      list.querySelectorAll('.selected').forEach(item => item.classList.remove('selected'));
      option.classList.add('selected');
      list.classList.remove('open');
    });
    list.appendChild(option);
  });

  trigger.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    document.querySelectorAll('.calendar-dropdown-list.open').forEach(openList => {
      if (openList !== list) openList.classList.remove('open');
    });
    list.classList.toggle('open');
  });

  dropdown.append(trigger, list);
  container.appendChild(dropdown);
  return { dropdown, trigger, list };
}

// SETUP FLATPICKR (Custom Date Picker)
function setupDatePicker() {
  const dateInput = document.getElementById('manualDate');
  if (!dateInput || typeof flatpickr !== 'function') return;

  flatpickr(dateInput, {
      dateFormat: "Y-m-d",      
      defaultDate: "today",     
      locale: "id",             
      disableMobile: true,    
      animate: true,
      
      // Hook untuk merombak UI Tahun menjadi Dropdown
      onReady: function(selectedDates, dateStr, instance) {
        // 1. Sembunyikan pembungkus input tahun bawaan
        const yearWrapper = instance.currentYearElement.parentNode;
        yearWrapper.style.display = 'none';

        // Buat menu tahun custom agar konsisten dengan dropdown aplikasi.
        const currentYear = new Date().getFullYear();
        const years = {};
        for (let i = currentYear; i >= 2000; i--) {
          years[i] = i;
        }
        const monthContainer = instance.monthsDropdownContainer.parentNode;
        const yearDropdown = createCalendarDropdown(monthContainer, instance.currentYear, years, year => {
          instance.changeYear(parseInt(year, 10));
        });
        instance.customYearDropdown = yearDropdown;

        const monthNames = flatpickr.l10ns.id.months.longhand;
        const months = Object.fromEntries(monthNames.map((name, index) => [index, name]));
        const monthDropdown = createCalendarDropdown(monthContainer, instance.currentMonth, months, month => {
          instance.jumpToDate(new Date(instance.currentYear, parseInt(month, 10), 1), false);
        });
        instance.customMonthDropdown = monthDropdown;
      },
      
      // Update otomatis nilai dropdown jika bulan berpindah
      onMonthChange: function(selectedDates, dateStr, instance) {
        syncCalendarDropdowns(instance);
      },
      onYearChange: function(selectedDates, dateStr, instance) {
        syncCalendarDropdowns(instance);
      }
    });
}

function syncCalendarDropdowns(instance) {
  const yearDropdown = instance.customYearDropdown;
  const monthDropdown = instance.customMonthDropdown;
  if (yearDropdown) yearDropdown.trigger.firstElementChild.textContent = instance.currentYear;
  if (monthDropdown) monthDropdown.trigger.firstElementChild.textContent = flatpickr.l10ns.id.months.longhand[instance.currentMonth];
}

document.addEventListener('click', (event) => {
  if (event.target && event.target.closest && event.target.closest('.calendar-dropdown')) {
    return;
  }
  document.querySelectorAll('.calendar-dropdown-list.open').forEach(list => list.classList.remove('open'));
});

document.addEventListener('DOMContentLoaded', () => {
  setupCustomDropdowns();
  setupDatePicker();
});