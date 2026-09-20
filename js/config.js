// Konfigurasi Supabase
const SUPABASE_URL = "https://tdeqnnyauwsnpfslbhcj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXFubnlhdXdzbnBmc2xiaGNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5Mjc0MTcsImV4cCI6MjEwNDUwMzQxN30.VbEC115BGzCAMsGE9wecXvhXLx3BwMZ1skPP3ibS0ew";

let supabaseClient = null;
let transactions = []; 
let chartInstance = null; 
let modalTimer = null;

try { 
if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { 
    auth: { persistSession: true, autoRefreshToken: true } 
    }); 
} 
} catch (e) {
console.error("Gagal inisialisasi Supabase", e);
}

// Inisialisasi Chart DataLabels secara global
if(typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
Chart.register(ChartDataLabels);
}