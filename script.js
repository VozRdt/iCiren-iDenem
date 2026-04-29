/* ============================================================
   iCiren iDe'nem - SPA Navigation & Logic
   ============================================================ */

// ─── SUPABASE INITIALIZATION ─────────────────────────────────
const SUPABASE_URL = 'https://jalxcruyeixswdritzdd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphbHhjcnV5ZWl4c3dkcml0emRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NjUzMjIsImV4cCI6MjA5MzA0MTMyMn0.DWIZk4gUJZ9Gor8QBIo6hzKHKI9_rKGQ6O9CxhUmJE0';

let supabaseClient = null;
try {
  if (typeof supabase !== 'undefined' && supabase.createClient) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client berhasil diinisialisasi.');
  }
} catch (e) {
  console.warn('⚠️ Supabase belum terhubung. Menggunakan mode offline/localStorage.', e);
}

// ─── AUTH STATE ──────────────────────────────────────────────
let currentUser = JSON.parse(localStorage.getItem('iciren_user') || 'null');

// Halaman yang membutuhkan login
const PROTECTED_PAGES = ['sell', 'explore', 'myideas'];

function isLoggedIn() {
  return currentUser !== null;
}

function updateAuthUI() {
  const loginBtn = document.getElementById('navLoginBtn');
  const registerBtn = document.getElementById('navRegisterBtn');
  const userProfile = document.getElementById('navUserProfile');
  const userAvatar = document.getElementById('navUserAvatar');
  const userName = document.getElementById('navUserName');

  if (isLoggedIn()) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (userProfile) {
      userProfile.style.display = 'flex';
      const name = currentUser.name || currentUser.email || 'User';
      if (userName) userName.textContent = name;
      if (userAvatar) userAvatar.textContent = name.charAt(0).toUpperCase();
    }
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-flex';
    if (registerBtn) registerBtn.style.display = 'inline-flex';
    if (userProfile) userProfile.style.display = 'none';
  }
}

// ─── AUTH FORM TABS ──────────────────────────────────────────
function switchAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginTab = document.getElementById('authTabLogin');
  const registerTab = document.getElementById('authTabRegister');

  if (tab === 'login') {
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
    if (loginTab) loginTab.classList.add('active');
    if (registerTab) registerTab.classList.remove('active');
  } else {
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
    if (loginTab) loginTab.classList.remove('active');
    if (registerTab) registerTab.classList.add('active');
  }
}

// ─── LOGIN HANDLER ───────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const submitBtn = document.getElementById('loginSubmitBtn');

  if (!email || !password) {
    showToast('❌ Mohon isi semua field.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

  try {
    // Coba login via Supabase
    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      currentUser = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email.split('@')[0]
      };
    } else {
      // Fallback mode (tanpa Supabase) — simulasi login via localStorage
      const users = JSON.parse(localStorage.getItem('iciren_users') || '[]');
      const found = users.find(u => u.email === email && u.password === password);
      if (!found) {
        throw new Error('Email atau password salah.');
      }
      currentUser = { id: found.id, email: found.email, name: found.name };
    }

    localStorage.setItem('iciren_user', JSON.stringify(currentUser));
    loadUserData();
    updateAuthUI();
    showToast('✅ Login berhasil! Selamat datang, ' + currentUser.name);
    setTimeout(() => navigateTo('home'), 1000);
  } catch (err) {
    showToast('❌ ' + (err.message || 'Login gagal. Coba lagi.'));
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk Sekarang';
  }
}

// ─── REGISTER HANDLER ────────────────────────────────────────
async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  const agreeTerms = document.getElementById('registerAgreeTerms').checked;
  const submitBtn = document.getElementById('registerSubmitBtn');

  if (!name || !email || !password || !confirmPassword) {
    showToast('❌ Mohon isi semua field.');
    return;
  }

  if (password !== confirmPassword) {
    showToast('❌ Password dan konfirmasi tidak cocok.');
    return;
  }

  if (password.length < 6) {
    showToast('❌ Password minimal 6 karakter.');
    return;
  }

  if (!agreeTerms) {
    showToast('❌ Kamu harus menyetujui Syarat & Ketentuan.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

  try {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });
      if (error) throw error;

      // Supabase mengirim email verifikasi — jangan langsung login
      // Tampilkan modal pemberitahuan verifikasi email
      showEmailVerifyModal(email);
      resetAuthForms();
    } else {
      // Fallback mode (tanpa Supabase) — simpan ke localStorage
      const users = JSON.parse(localStorage.getItem('iciren_users') || '[]');
      if (users.some(u => u.email === email)) {
        throw new Error('Email sudah terdaftar.');
      }
      const newUser = { id: Date.now(), email, password, name };
      users.push(newUser);
      localStorage.setItem('iciren_users', JSON.stringify(users));
      currentUser = { id: newUser.id, email, name };

      localStorage.setItem('iciren_user', JSON.stringify(currentUser));
      loadUserData();
      updateAuthUI();
      showToast('🎉 Registrasi berhasil! Selamat datang, ' + name);
      setTimeout(() => navigateTo('home'), 1000);
    }
  } catch (err) {
    showToast('❌ ' + (err.message || 'Registrasi gagal. Coba lagi.'));
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Daftar Sekarang';
  }
}

// ─── GOOGLE LOGIN ────────────────────────────────────────────
async function handleGoogleLogin() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google'
      });
      if (error) throw error;
      // Supabase akan redirect, data akan ditangani saat kembali
    } catch (err) {
      showToast('❌ Google login gagal: ' + (err.message || 'Coba lagi.'));
    }
  } else {
    showToast('ℹ️ Google login memerlukan konfigurasi Supabase. Silakan daftar manual.');
  }
}

// ─── LOGOUT ──────────────────────────────────────────────────
async function logoutUser() {
  try {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
  } catch (e) {
    console.warn('Logout error:', e);
  }
  currentUser = null;
  localStorage.removeItem('iciren_user');
  clearUserData();
  resetAuthForms();
  updateAuthUI();
  showToast('👋 Kamu telah keluar. Sampai jumpa lagi!');
  navigateTo('home');
}

// ─── RESET AUTH FORMS ────────────────────────────────────────
function resetAuthForms() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (loginForm) loginForm.reset();
  if (registerForm) registerForm.reset();
  // Kembali ke tab login
  switchAuthTab('login');
}

// ─── PASSWORD TOGGLE ─────────────────────────────────────────
function togglePassword(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  if (!input || !btn) return;

  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
  } else {
    input.type = 'password';
    btn.innerHTML = '<i class="fas fa-eye"></i>';
  }
}

// ─── AUTH REQUIRED MODAL ─────────────────────────────────────
function showAuthRequiredModal() {
  const modal = document.getElementById('authRequiredModal');
  if (modal) modal.classList.add('show');
}

function closeAuthModal() {
  const modal = document.getElementById('authRequiredModal');
  if (modal) modal.classList.remove('show');
}

// Klik backdrop untuk tutup
document.addEventListener('click', function (e) {
  const modal = document.getElementById('authRequiredModal');
  if (e.target === modal) closeAuthModal();
  const emailModal = document.getElementById('emailVerifyModal');
  if (e.target === emailModal) closeEmailVerifyModal();
});

// ─── EMAIL VERIFICATION MODAL ───────────────────────────────
let lastRegisteredEmail = '';

function showEmailVerifyModal(email) {
  lastRegisteredEmail = email;
  const modal = document.getElementById('emailVerifyModal');
  const emailDisplay = document.getElementById('verifyEmailAddress');
  if (emailDisplay) emailDisplay.textContent = email;
  if (modal) modal.classList.add('show');
}

function closeEmailVerifyModal() {
  const modal = document.getElementById('emailVerifyModal');
  if (modal) modal.classList.remove('show');
}

async function resendVerificationEmail() {
  const btn = document.getElementById('resendVerifyBtn');
  if (!lastRegisteredEmail) {
    showToast('❌ Tidak ada email untuk dikirim ulang.');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';

  try {
    if (supabaseClient) {
      const { error } = await supabaseClient.auth.resend({
        type: 'signup',
        email: lastRegisteredEmail
      });
      if (error) throw error;
      showToast('✉️ Email verifikasi telah dikirim ulang ke ' + lastRegisteredEmail);
    } else {
      showToast('ℹ️ Mode offline: verifikasi email tidak tersedia.');
    }
  } catch (err) {
    showToast('❌ Gagal mengirim ulang: ' + (err.message || 'Coba lagi nanti.'));
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Ulang Email';
  }
}

// ─── CHECK AUTH ON SUPABASE SESSION ──────────────────────────
async function checkSupabaseSession() {
  if (!supabaseClient) return;
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session && session.user) {
      currentUser = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.email.split('@')[0]
      };
      localStorage.setItem('iciren_user', JSON.stringify(currentUser));
      updateAuthUI();
    }
  } catch (e) {
    console.warn('Session check error:', e);
  }
}

// ─── DATA IDE ────────────────────────────────────────────────
const allIdeas = [
  { id: 1, title: '10 Rahasia TikTok yang Jarang Diketahui', category: 'tiktok', price: 75000, desc: 'Konten edukatif tentang algoritma TikTok, tips untuk pemula hingga pro.', emoji: '🎵', views: 4200, rating: 4.9 },
  { id: 2, title: 'Review Jujur Produk Viral vs Biasa', category: 'youtube', price: 120000, desc: 'Format review komparatif yang terbukti menghasilkan engagement tinggi.', emoji: '📹', views: 8700, rating: 4.8 },
  { id: 3, title: 'Day in My Life: Content Creator Indonesia', category: 'instagram', price: 55000, desc: 'Ide konten storytelling harian yang relatable untuk kreator muda.', emoji: '📸', views: 3100, rating: 4.7 },
  { id: 4, title: 'Podcast: Obrolan Startup Indonesia', category: 'podcast', price: 95000, desc: 'Format podcast diskusi ekosistem startup lokal yang menarik investor & talenta.', emoji: '🎙️', views: 2800, rating: 4.6 },
  { id: 5, title: '5 Resep Masak Viral dari Media Sosial', category: 'youtube', price: 65000, desc: 'Kompilasi resep trending yang bisa dieksekusi dengan mudah dan cepat.', emoji: '🍳', views: 9500, rating: 5.0 },
  { id: 6, title: 'Tantangan 30 Hari Produktivitas', category: 'tiktok', price: 85000, desc: 'Series tantangan harian yang mendorong engagement konsisten dari followers.', emoji: '⚡', views: 6300, rating: 4.8 },
  { id: 7, title: 'Tutorial Blog SEO untuk Pemula', category: 'blog', price: 110000, desc: 'Panduan lengkap membuat artikel yang nangkring di halaman 1 Google.', emoji: '✍️', views: 4100, rating: 4.9 },
  { id: 8, title: 'Reels Outfit Check Aesthetic Murah', category: 'instagram', price: 45000, desc: 'Format konten fashion OOTD budget friendly yang viral di kalangan Gen Z.', emoji: '👗', views: 7200, rating: 4.7 },
  { id: 9, title: 'Unboxing Gadget Terbaru 2026', category: 'youtube', price: 135000, desc: 'Script dan struktur unboxing yang engaging dari intro hingga verdict akhir.', emoji: '📦', views: 11200, rating: 4.9 },
  { id: 10, title: 'Podcast: Mental Health anak Muda', category: 'podcast', price: 80000, desc: 'Topik-topik mental health yang relevan dengan anak muda Indonesia.', emoji: '🧠', views: 3400, rating: 4.8 },
  { id: 11, title: 'Vlog Trip Hemat ke Bali', category: 'youtube', price: 90000, desc: 'Konsep vlog perjalanan budget yang informatif dan entertaining.', emoji: '🏖️', views: 5600, rating: 4.6 },
  { id: 12, title: 'Tips Finansial Gen Z: Mulai Investasi', category: 'tiktok', price: 70000, desc: 'Edukasi finansial yang disampaikan dengan bahasa ringan dan visual menarik.', emoji: '💰', views: 8900, rating: 4.9 },
];

let displayedIdeas = 6;
let currentFilter = 'semua';
let myIdeas = [];
let purchasedIdeas = [];
let myIdeasTab = 'submitted'; // 'submitted' | 'purchased'

let isNavigating = false;

// ─── USER-SPECIFIC STORAGE HELPERS ───────────────────────────
function getUserKey(baseName) {
  if (currentUser && currentUser.id) {
    return baseName + '_' + currentUser.id;
  }
  return baseName;
}

function loadUserData() {
  myIdeas = JSON.parse(localStorage.getItem(getUserKey('myIdeas')) || '[]');
  purchasedIdeas = JSON.parse(localStorage.getItem(getUserKey('purchasedIdeas')) || '[]');
}

function clearUserData() {
  myIdeas = [];
  purchasedIdeas = [];
}

// ─── PROGRESS BAR ────────────────────────────────────────────
function startProgress() {
  const bar = document.getElementById('nav-progress');
  bar.style.width = '0%';
  bar.classList.add('running');
  // Force reflow
  void bar.offsetWidth;
  bar.style.width = '70%';
}

function finishProgress() {
  const bar = document.getElementById('nav-progress');
  bar.style.width = '100%';
  setTimeout(() => {
    bar.style.opacity = '0';
    setTimeout(() => {
      bar.style.width = '0%';
      bar.classList.remove('running');
    }, 300);
  }, 200);
}

// ─── SPA NAVIGATION ─────────────────────────────────────────
function navigateTo(page) {
  // Cegah navigasi ganda saat animasi berjalan
  if (isNavigating) return;

  // Proteksi halaman: jika belum login dan halaman dilindungi
  if (PROTECTED_PAGES.includes(page) && !isLoggedIn()) {
    showAuthRequiredModal();
    return;
  }

  const currentActive = document.querySelector('.page.active');
  const target = document.getElementById('page-' + page);

  // Sudah di halaman ini
  if (!target || (currentActive && currentActive.id === 'page-' + page)) return;

  isNavigating = true;

  // Update nav links
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const navLink = document.getElementById('nav-' + page);
  if (navLink) navLink.classList.add('active');

  // Tutup hamburger
  closeHamburger();

  // Scroll ke atas
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Init data halaman lebih awal agar siap saat muncul
  if (page === 'explore') renderIdeas();
  if (page === 'myideas') renderMyIdeas();
  if (page === 'auth') resetAuthForms();

  // Mulai progress bar
  startProgress();

  if (!currentActive) {
    // Load pertama — langsung masuk
    target.classList.add('active');
    finishProgress();
    isNavigating = false;
    return;
  }

  // Animasi KELUAR halaman sekarang
  currentActive.classList.remove('active');
  currentActive.classList.add('exiting');

  // Setelah animasi keluar selesai (220ms), tampilkan halaman baru
  setTimeout(() => {
    currentActive.classList.remove('exiting');

    // Animasi MASUK halaman baru
    target.classList.add('active');

    finishProgress();

    // Izinkan navigasi berikutnya setelah animasi masuk selesai
    setTimeout(() => {
      isNavigating = false;
    }, 430);
  }, 220);
}

// ─── HAMBURGER MENU ──────────────────────────────────────────
function toggleMenu() {
  const menu = document.getElementById('navMenu');
  const ham = document.getElementById('hamburger');
  menu.classList.toggle('open');
  ham.classList.toggle('open');
}

function closeHamburger() {
  document.getElementById('navMenu').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
}

// ─── RENDER IDEA CARDS ───────────────────────────────────────
function renderIdeas() {
  const grid = document.getElementById('ideasGrid');
  if (!grid) return;

  const searchVal = (document.getElementById('searchInput')?.value || '').toLowerCase();
  let filtered = allIdeas.filter(idea => {
    const matchCat = currentFilter === 'semua' || idea.category === currentFilter;
    const matchSearch = idea.title.toLowerCase().includes(searchVal) || idea.desc.toLowerCase().includes(searchVal);
    return matchCat && matchSearch;
  });

  const toShow = filtered.slice(0, displayedIdeas);
  grid.innerHTML = toShow.map(idea => createIdeaCard(idea)).join('');

  // Toggle load more button
  const btn = document.querySelector('.load-more button');
  if (btn) btn.style.display = filtered.length > displayedIdeas ? 'inline-flex' : 'none';
}

function createIdeaCard(idea) {
  const stars = '⭐'.repeat(Math.round(idea.rating));
  const categoryLabel = { youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', podcast: 'Podcast', blog: 'Blog' }[idea.category] || idea.category;
  return `
    <div class="idea-card" onclick="openModal(${idea.id})">
      <div class="idea-image">
        <span style="font-size:5rem;">${idea.emoji}</span>
      </div>
      <div class="idea-content">
        <span class="category-badge">${categoryLabel}</span>
        <h3 class="idea-title">${idea.title}</h3>
        <p class="idea-description">${idea.desc}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem;">
          <span class="idea-price">Rp ${idea.price.toLocaleString('id-ID')}</span>
          <span style="color:#a3a3a3; font-size:0.85rem;">${idea.views.toLocaleString()} views</span>
        </div>
        <div style="margin-top:0.8rem; color:#FBBF24; font-size:0.85rem;">${stars} ${idea.rating}</div>
      </div>
    </div>`;
}

function setFilter(filter, btn) {
  currentFilter = filter;
  displayedIdeas = 6;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderIdeas();
}

function filterIdeas() {
  displayedIdeas = 6;
  renderIdeas();
}

function loadMoreIdeas() {
  displayedIdeas += 3;
  renderIdeas();
}

// ─── MODAL ───────────────────────────────────────────────────
function openModal(ideaId) {
  const idea = allIdeas.find(i => i.id === ideaId);
  if (!idea) return;
  const modal = document.getElementById('ideaModal');
  const body = document.getElementById('modalBody');
  const categoryLabel = { youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', podcast: 'Podcast', blog: 'Blog' }[idea.category] || idea.category;

  body.innerHTML = `
    <div style="text-align:center; margin-bottom:1.5rem; font-size:5rem;">${idea.emoji}</div>
    <span class="category-badge">${categoryLabel}</span>
    <h2 style="color:#f8fafc; font-size:1.6rem; margin:1rem 0;">${idea.title}</h2>
    <p style="color:#a3a3a3; line-height:1.8; margin-bottom:2rem;">${idea.desc}</p>
    <div style="display:flex; justify-content:space-between; align-items:center; padding:1.5rem; background:rgba(245,158,11,0.05); border:1px solid rgba(245,158,11,0.2); border-radius:16px; margin-bottom:2rem;">
      <div>
        <div style="color:#a3a3a3; font-size:0.85rem;">Harga</div>
        <div style="font-size:2rem; font-weight:800; background:linear-gradient(135deg,#F59E0B,#FBBF24); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">Rp ${idea.price.toLocaleString('id-ID')}</div>
      </div>
      <div style="text-align:right;">
        <div style="color:#FBBF24; font-size:1.1rem; margin-bottom:0.2rem;">${'⭐'.repeat(Math.round(idea.rating))} ${idea.rating}</div>
        <div style="color:#a3a3a3; font-size:0.85rem;">${idea.views.toLocaleString()} kali dilihat</div>
      </div>
    </div>
    <button class="btn btn-primary" style="width:100%;" onclick="buyIdea(${idea.id})">
      <i class="fas fa-shopping-cart"></i> Beli Ide Ini
    </button>`;

  modal.classList.add('show');
}

function closeModal() {
  document.getElementById('ideaModal').classList.remove('show');
}

function buyIdea(ideaId) {
  // Cek apakah sudah login
  if (!isLoggedIn()) {
    closeModal();
    showAuthRequiredModal();
    return;
  }

  // Cek apakah sudah pernah dibeli
  purchasedIdeas = JSON.parse(localStorage.getItem(getUserKey('purchasedIdeas')) || '[]');
  if (purchasedIdeas.some(i => i.id === ideaId)) {
    closeModal();
    showToast('ℹ️ Kamu sudah membeli ide ini sebelumnya.');
    return;
  }

  const idea = allIdeas.find(i => i.id === ideaId);
  if (!idea) return;

  const bought = {
    ...idea,
    boughtDate: new Date().toLocaleDateString('id-ID'),
  };

  purchasedIdeas.unshift(bought);
  localStorage.setItem(getUserKey('purchasedIdeas'), JSON.stringify(purchasedIdeas));

  closeModal();
  showToast('✅ Ide berhasil dibeli! Lihat di Ide Saya → Tab Dibeli.');
  setTimeout(() => { navigateTo('myideas'); switchMyIdeasTab('purchased'); }, 1500);
}

// ─── SELL FORM ───────────────────────────────────────────────
function submitIdea(e) {
  e.preventDefault();
  const title = document.getElementById('ideaTitle').value;
  const category = document.getElementById('ideaCategory').value;
  const price = parseInt(document.getElementById('ideaPrice').value);
  const desc = document.getElementById('ideaDesc').value;
  const tags = document.getElementById('ideaTags').value;

  const newIdea = {
    id: Date.now(),
    title, category, price, desc, tags,
    status: 'pending',
    date: new Date().toLocaleDateString('id-ID'),
  };

  myIdeas.unshift(newIdea);
  localStorage.setItem(getUserKey('myIdeas'), JSON.stringify(myIdeas));

  // Reset form
  document.getElementById('sellForm').reset();
  showToast('🎉 Ide berhasil disubmit! Tim kami akan segera mereview.');

  // Redirect to myideas after delay
  setTimeout(() => navigateTo('myideas'), 1500);
}

// ─── MY IDEAS PAGE ───────────────────────────────────────────
function switchMyIdeasTab(tab) {
  myIdeasTab = tab;
  document.querySelectorAll('.myideas-tab').forEach(t => t.classList.remove('active'));
  const activeTab = document.getElementById('tab-' + tab);
  if (activeTab) activeTab.classList.add('active');
  renderMyIdeasList();
}

function renderMyIdeas() {
  myIdeas = JSON.parse(localStorage.getItem(getUserKey('myIdeas')) || '[]');
  purchasedIdeas = JSON.parse(localStorage.getItem(getUserKey('purchasedIdeas')) || '[]');

  // Update dashboard stats
  document.getElementById('totalIdeasCount').textContent = myIdeas.length;
  const approved = myIdeas.filter(i => i.status === 'approved').length;
  document.getElementById('approvedCount').textContent = approved;
  const earnings = myIdeas.filter(i => i.status === 'approved').reduce((s, i) => s + i.price, 0);
  document.getElementById('totalEarnings').textContent = 'Rp ' + earnings.toLocaleString('id-ID');
  document.getElementById('totalViews').textContent = purchasedIdeas.length.toLocaleString();

  // Inject tab UI if not yet rendered
  const list = document.getElementById('myIdeasList');
  if (!document.getElementById('myideas-tabs')) {
    list.insertAdjacentHTML('beforebegin', `
      <div id="myideas-tabs" style="display:flex; gap:0.75rem; margin-bottom:1.5rem;">
        <button id="tab-submitted" class="filter-tab myideas-tab active" onclick="switchMyIdeasTab('submitted')">
          <i class="fas fa-paper-plane"></i> Disubmit (${myIdeas.length})
        </button>
        <button id="tab-purchased" class="filter-tab myideas-tab" onclick="switchMyIdeasTab('purchased')">
          <i class="fas fa-shopping-bag"></i> Dibeli (${purchasedIdeas.length})
        </button>
      </div>`);
  } else {
    // Update badge counts
    const subTab = document.getElementById('tab-submitted');
    const purTab = document.getElementById('tab-purchased');
    if (subTab) subTab.innerHTML = `<i class="fas fa-paper-plane"></i> Disubmit (${myIdeas.length})`;
    if (purTab) purTab.innerHTML = `<i class="fas fa-shopping-bag"></i> Dibeli (${purchasedIdeas.length})`;
  }

  // Set active tab button
  document.querySelectorAll('.myideas-tab').forEach(t => t.classList.remove('active'));
  const active = document.getElementById('tab-' + myIdeasTab);
  if (active) active.classList.add('active');

  renderMyIdeasList();
}

function renderMyIdeasList() {
  const list = document.getElementById('myIdeasList');
  const empty = document.getElementById('emptyState');
  const catLabel = { youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', podcast: 'Podcast', blog: 'Blog' };

  if (myIdeasTab === 'submitted') {
    if (myIdeas.length === 0) {
      list.innerHTML = '';
      const emptyHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="fas fa-paper-plane"></i></div>
          <h3>Belum Ada Ide Disubmit</h3>
          <p>Kamu belum pernah submit ide apapun. Mulai sekarang dan hasilkan uang!</p>
          <button class="btn btn-primary" onclick="navigateTo('sell')">
            <i class="fas fa-lightbulb"></i> Submit Ide Pertamamu
          </button>
        </div>`;
      list.innerHTML = emptyHTML;
      return;
    }
    list.innerHTML = myIdeas.map(idea => `
      <div class="my-idea-item">
        <div class="my-idea-info">
          <h4>${idea.title}</h4>
          <span>${catLabel[idea.category] || idea.category} &bull; Disubmit ${idea.date}</span>
        </div>
        <div style="display:flex; align-items:center; gap:1rem; flex-shrink:0;">
          <span class="my-idea-status ${idea.status === 'approved' ? 'status-approved' : 'status-pending'}">
            ${idea.status === 'approved' ? '✓ Disetujui' : '⏳ Review'}
          </span>
          <span class="my-idea-price">Rp ${idea.price.toLocaleString('id-ID')}</span>
          <button onclick="deleteIdea(${idea.id})" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#ef4444; border-radius:8px; padding:0.4rem 0.8rem; cursor:pointer; font-family:inherit; font-size:0.85rem;">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>`).join('');

  } else {
    // Tab: Dibeli
    if (purchasedIdeas.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="fas fa-shopping-bag"></i></div>
          <h3>Belum Ada Ide Dibeli</h3>
          <p>Kamu belum membeli ide apapun. Jelajahi ribuan ide kreatif sekarang!</p>
          <button class="btn btn-primary" onclick="navigateTo('explore')">
            <i class="fas fa-compass"></i> Jelajahi Ide
          </button>
        </div>`;
      return;
    }
    list.innerHTML = purchasedIdeas.map(idea => `
      <div class="my-idea-item">
        <div style="font-size:2rem; flex-shrink:0;">${idea.emoji || '💡'}</div>
        <div class="my-idea-info">
          <h4>${idea.title}</h4>
          <span>${catLabel[idea.category] || idea.category} &bull; Dibeli ${idea.boughtDate}</span>
        </div>
        <div style="display:flex; align-items:center; gap:1rem; flex-shrink:0;">
          <span class="my-idea-status status-approved">✓ Dimiliki</span>
          <span class="my-idea-price">Rp ${idea.price.toLocaleString('id-ID')}</span>
          <button onclick="deletePurchased(${idea.id})" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#ef4444; border-radius:8px; padding:0.4rem 0.8rem; cursor:pointer; font-family:inherit; font-size:0.85rem;">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>`).join('');
  }
}

function deleteIdea(id) {
  myIdeas = myIdeas.filter(i => i.id !== id);
  localStorage.setItem(getUserKey('myIdeas'), JSON.stringify(myIdeas));
  renderMyIdeas();
  showToast('🗑️ Ide berhasil dihapus.');
}

function deletePurchased(id) {
  purchasedIdeas = purchasedIdeas.filter(i => i.id !== id);
  localStorage.setItem(getUserKey('purchasedIdeas'), JSON.stringify(purchasedIdeas));
  renderMyIdeas();
  showToast('🗑️ Ide dibeli berhasil dihapus.');
}

// ─── TOAST ───────────────────────────────────────────────────
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ─── NAVBAR SCROLL EFFECT ────────────────────────────────────
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (window.scrollY > 20) {
    navbar.style.background = 'rgba(5,5,5,0.98)';
  } else {
    navbar.style.background = 'rgba(10,10,10,0.95)';
  }
});

// ─── MODAL CLOSE ON BACKDROP ─────────────────────────────────
document.getElementById('ideaModal').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Update auth UI berdasarkan state login
  updateAuthUI();
  // Load data per-user jika sudah login
  if (isLoggedIn()) loadUserData();
  // Cek session Supabase
  checkSupabaseSession();
  // Navigasi awal
  navigateTo('home');
});
