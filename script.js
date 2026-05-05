/* ============================================================
   iCiren iDe'nem - SPA Navigation & Logic
   ============================================================ */

// ─── LENIS SMOOTH SCROLL INSTANCE ────────────────────────────
let lenis = null;

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
    // Load data dari database (async)
    await loadUserData();
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
  stopLenisScroll();
}

function closeAuthModal() {
  const modal = document.getElementById('authRequiredModal');
  if (modal) modal.classList.remove('show');
  startLenisScroll();
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
  stopLenisScroll();
}

function closeEmailVerifyModal() {
  const modal = document.getElementById('emailVerifyModal');
  if (modal) modal.classList.remove('show');
  startLenisScroll();
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

// ─── TERMS & PRIVACY MODAL ──────────────────────────────────
function showTermsModal(tab) {
  const modal = document.getElementById('termsModal');
  if (modal) modal.classList.add('show');
  if (tab) switchTermsTab(tab);
  stopLenisScroll();
}

function closeTermsModal() {
  const modal = document.getElementById('termsModal');
  if (modal) modal.classList.remove('show');
  startLenisScroll();
}

function switchTermsTab(tab) {
  const termsContent = document.getElementById('termsContentTerms');
  const privacyContent = document.getElementById('termsContentPrivacy');
  const termsTab = document.getElementById('termsTabTerms');
  const privacyTab = document.getElementById('termsTabPrivacy');

  if (tab === 'terms') {
    if (termsContent) termsContent.style.display = 'block';
    if (privacyContent) privacyContent.style.display = 'none';
    if (termsTab) termsTab.classList.add('active');
    if (privacyTab) privacyTab.classList.remove('active');
  } else {
    if (termsContent) termsContent.style.display = 'none';
    if (privacyContent) privacyContent.style.display = 'block';
    if (termsTab) termsTab.classList.remove('active');
    if (privacyTab) privacyTab.classList.add('active');
  }

  // Scroll body ke atas saat ganti tab
  const body = document.getElementById('termsModalBody');
  if (body) body.scrollTop = 0;
}

// Klik backdrop untuk tutup terms modal
document.addEventListener('click', function (e) {
  const termsModal = document.getElementById('termsModal');
  if (e.target === termsModal) closeTermsModal();
});

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
      // Load data dari database saat session valid
      await loadUserData();
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

// Load data user dari Supabase, fallback ke localStorage
async function loadUserData() {
  if (supabaseClient && currentUser && currentUser.id) {
    try {
      // Load ide yang dijual dari Supabase
      const { data: ideasData, error: ideasErr } = await supabaseClient
        .from('ideas')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (!ideasErr && ideasData) {
        myIdeas = ideasData.map(row => ({
          id: row.id,
          title: row.title,
          category: row.category,
          price: row.price,
          desc: row.description,
          tags: row.tags || '',
          status: row.status || 'pending',
          date: new Date(row.created_at).toLocaleDateString('id-ID'),
        }));
        // Sync ke localStorage sebagai cache
        localStorage.setItem(getUserKey('myIdeas'), JSON.stringify(myIdeas));
      } else {
        console.warn('⚠️ Gagal load ideas dari DB, pakai localStorage:', ideasErr);
        myIdeas = JSON.parse(localStorage.getItem(getUserKey('myIdeas')) || '[]');
      }

      // Load ide yang dibeli dari Supabase
      const { data: purchData, error: purchErr } = await supabaseClient
        .from('purchases')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('purchased_at', { ascending: false });

      if (!purchErr && purchData) {
        purchasedIdeas = purchData.map(row => ({
          id: row.idea_id,
          dbId: row.id, // UUID dari tabel purchases, untuk delete
          title: row.idea_title,
          category: row.idea_category,
          price: row.idea_price,
          desc: row.idea_desc,
          emoji: row.idea_emoji || '💡',
          rating: row.idea_rating || 0,
          views: row.idea_views || 0,
          boughtDate: new Date(row.purchased_at).toLocaleDateString('id-ID'),
        }));
        // Sync ke localStorage sebagai cache
        localStorage.setItem(getUserKey('purchasedIdeas'), JSON.stringify(purchasedIdeas));
      } else {
        console.warn('⚠️ Gagal load purchases dari DB, pakai localStorage:', purchErr);
        purchasedIdeas = JSON.parse(localStorage.getItem(getUserKey('purchasedIdeas')) || '[]');
      }

      console.log(`✅ Data loaded from Supabase: ${myIdeas.length} ideas, ${purchasedIdeas.length} purchases`);
    } catch (e) {
      console.warn('⚠️ DB load error, fallback localStorage:', e);
      myIdeas = JSON.parse(localStorage.getItem(getUserKey('myIdeas')) || '[]');
      purchasedIdeas = JSON.parse(localStorage.getItem(getUserKey('purchasedIdeas')) || '[]');
    }
  } else {
    // Fallback: localStorage only
    myIdeas = JSON.parse(localStorage.getItem(getUserKey('myIdeas')) || '[]');
    purchasedIdeas = JSON.parse(localStorage.getItem(getUserKey('purchasedIdeas')) || '[]');
  }
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

  // Scroll ke atas — gunakan Lenis jika aktif
  if (lenis) {
    lenis.scrollTo(0, { duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 4) });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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
    // Trigger GSAP animations for initial page
    animateCurrentPage(page);
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

    // Trigger GSAP animations for new page
    animateCurrentPage(page);

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
  const cta = document.querySelector('.nav-cta');
  menu.classList.toggle('open');
  ham.classList.toggle('open');
  if (cta) cta.classList.toggle('open');
}

function closeHamburger() {
  document.getElementById('navMenu').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
  const cta = document.querySelector('.nav-cta');
  if (cta) cta.classList.remove('open');
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
  stopLenisScroll();
}

function closeModal() {
  document.getElementById('ideaModal').classList.remove('show');
  startLenisScroll();
}

async function buyIdea(ideaId) {
  // Cek apakah sudah login
  if (!isLoggedIn()) {
    closeModal();
    showAuthRequiredModal();
    return;
  }

  // Cek apakah sudah pernah dibeli (dari memori + DB)
  if (purchasedIdeas.some(i => i.id === ideaId)) {
    closeModal();
    showToast('ℹ️ Kamu sudah membeli ide ini sebelumnya.');
    return;
  }

  const idea = allIdeas.find(i => i.id === ideaId);
  if (!idea) return;

  // Simpan ke Supabase jika tersedia
  if (supabaseClient && currentUser && currentUser.id) {
    try {
      const { data, error } = await supabaseClient
        .from('purchases')
        .insert({
          user_id: currentUser.id,
          idea_id: idea.id,
          idea_title: idea.title,
          idea_category: idea.category,
          idea_price: idea.price,
          idea_desc: idea.desc,
          idea_emoji: idea.emoji || '💡',
          idea_rating: idea.rating || 0,
          idea_views: idea.views || 0,
        })
        .select()
        .single();

      if (error) throw error;

      const bought = {
        id: idea.id,
        dbId: data.id,
        title: idea.title,
        category: idea.category,
        price: idea.price,
        desc: idea.desc,
        emoji: idea.emoji,
        rating: idea.rating,
        views: idea.views,
        boughtDate: new Date(data.purchased_at).toLocaleDateString('id-ID'),
      };
      purchasedIdeas.unshift(bought);
      localStorage.setItem(getUserKey('purchasedIdeas'), JSON.stringify(purchasedIdeas));

      console.log('✅ Purchase saved to Supabase:', data.id);
    } catch (e) {
      console.warn('⚠️ DB purchase insert error, saving to localStorage:', e);
      // Fallback: localStorage
      const bought = { ...idea, boughtDate: new Date().toLocaleDateString('id-ID') };
      purchasedIdeas.unshift(bought);
      localStorage.setItem(getUserKey('purchasedIdeas'), JSON.stringify(purchasedIdeas));
    }
  } else {
    // Fallback: localStorage only
    const bought = { ...idea, boughtDate: new Date().toLocaleDateString('id-ID') };
    purchasedIdeas.unshift(bought);
    localStorage.setItem(getUserKey('purchasedIdeas'), JSON.stringify(purchasedIdeas));
  }

  closeModal();
  showToast('✅ Ide berhasil dibeli! Lihat di Ide Saya → Tab Dibeli.');
  setTimeout(() => { navigateTo('myideas'); switchMyIdeasTab('purchased'); }, 1500);
}

// ─── SELL FORM ───────────────────────────────────────────────
async function submitIdea(e) {
  e.preventDefault();
  const title = document.getElementById('ideaTitle').value;
  const category = document.getElementById('ideaCategory').value;
  const price = parseInt(document.getElementById('ideaPrice').value);
  const desc = document.getElementById('ideaDesc').value;
  const tags = document.getElementById('ideaTags').value;

  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
  }

  // Simpan ke Supabase jika tersedia
  if (supabaseClient && currentUser && currentUser.id) {
    try {
      const { data, error } = await supabaseClient
        .from('ideas')
        .insert({
          user_id: currentUser.id,
          title,
          category,
          price,
          description: desc,
          tags: tags || '',
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      const newIdea = {
        id: data.id,
        title, category, price, desc, tags,
        status: data.status || 'pending',
        date: new Date(data.created_at).toLocaleDateString('id-ID'),
      };
      myIdeas.unshift(newIdea);
      localStorage.setItem(getUserKey('myIdeas'), JSON.stringify(myIdeas));

      console.log('✅ Idea saved to Supabase:', data.id);
    } catch (e) {
      console.warn('⚠️ DB idea insert error, saving to localStorage:', e);
      // Fallback: localStorage
      const newIdea = {
        id: Date.now(),
        title, category, price, desc, tags,
        status: 'pending',
        date: new Date().toLocaleDateString('id-ID'),
      };
      myIdeas.unshift(newIdea);
      localStorage.setItem(getUserKey('myIdeas'), JSON.stringify(myIdeas));
    }
  } else {
    // Fallback: localStorage only
    const newIdea = {
      id: Date.now(),
      title, category, price, desc, tags,
      status: 'pending',
      date: new Date().toLocaleDateString('id-ID'),
    };
    myIdeas.unshift(newIdea);
    localStorage.setItem(getUserKey('myIdeas'), JSON.stringify(myIdeas));
  }

  // Reset form & button
  document.getElementById('sellForm').reset();
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Ide Sekarang';
  }
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

async function deleteIdea(id) {
  // Hapus dari Supabase jika tersedia
  if (supabaseClient && currentUser && currentUser.id) {
    try {
      const { error } = await supabaseClient
        .from('ideas')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      console.log('✅ Idea deleted from Supabase:', id);
    } catch (e) {
      console.warn('⚠️ DB idea delete error:', e);
    }
  }

  myIdeas = myIdeas.filter(i => i.id !== id);
  localStorage.setItem(getUserKey('myIdeas'), JSON.stringify(myIdeas));
  renderMyIdeas();
  showToast('🗑️ Ide berhasil dihapus.');
}

async function deletePurchased(id) {
  // Cari dbId (UUID dari Supabase) untuk dihapus
  const item = purchasedIdeas.find(i => i.id === id);
  const dbId = item?.dbId;

  // Hapus dari Supabase jika tersedia
  if (supabaseClient && currentUser && currentUser.id && dbId) {
    try {
      const { error } = await supabaseClient
        .from('purchases')
        .delete()
        .eq('id', dbId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      console.log('✅ Purchase deleted from Supabase:', dbId);
    } catch (e) {
      console.warn('⚠️ DB purchase delete error:', e);
    }
  }

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

// ============================================================
//   LENIS SMOOTH SCROLL SYSTEM
// ============================================================

function initLenis() {
  if (typeof Lenis === 'undefined') {
    console.warn('⚠️ Lenis not loaded. Using default scroll.');
    return;
  }

  // Create Lenis instance with elegant tuning
  lenis = new Lenis({
    duration: 1.4,               // Scroll duration — higher = smoother & more elegant
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential ease-out
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.9,        // Slightly reduce scroll speed for elegance
    touchMultiplier: 1.5,        // Better touch responsiveness
    infinite: false,
  });

  // Connect Lenis to GSAP ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);

  // Use GSAP ticker for Lenis RAF loop (syncs perfectly with GSAP animations)
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000); // GSAP ticker uses seconds, Lenis expects ms
  });
  gsap.ticker.lagSmoothing(0); // Prevent lag smoothing for buttery feel

  console.log('✅ Lenis smooth scroll initialized.');
}

// Helper: Stop Lenis scroll (for modals)
function stopLenisScroll() {
  if (lenis) lenis.stop();
}

// Helper: Resume Lenis scroll
function startLenisScroll() {
  if (lenis) lenis.start();
}

// ============================================================
//   GSAP ANIMATION SYSTEM
// ============================================================

function initGSAP() {
  // Register ScrollTrigger plugin
  if (typeof gsap === 'undefined') {
    console.warn('⚠️ GSAP not loaded. Animations skipped.');
    // Fallback: make everything visible
    document.querySelectorAll('[data-gsap="hero"], [data-gsap-section] .section-title, [data-gsap-section] .section-subtitle, [data-gsap-section] .step-card, [data-gsap-section] .benefit-item, [data-gsap-section] .testimonial-card, .about-heading, .about-text p, .about-stats, .about-card-visual, .team-card, .value-card, .footer-content, .footer-bottom, .form-card, .sell-benefit-card, .dash-stat-card, .auth-card, .auth-deco-card, .page-hero-title, .page-hero-subtitle').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Set GSAP defaults for smooth feel
  gsap.defaults({
    ease: 'power3.out',
    duration: 0.8
  });

  // ─── INITIALIZE LENIS (after GSAP + ScrollTrigger ready) ─
  initLenis();

  // ─── NAVBAR SMART ANIMATION (only once on load) ──────────
  animateNavbar();

  // ─── MAGNETIC BUTTON HOVER ───────────────────────────────
  initMagneticButtons();

  // Note: page-specific animations (hero, sections, footer, parallax)
  // are triggered via animateCurrentPage() inside navigateTo().
}

// ─── HERO ENTRANCE ──────────────────────────────────────────
function animateHero() {
  const heroElements = document.querySelectorAll('[data-gsap="hero"]');
  if (!heroElements.length) return;

  const tl = gsap.timeline({ delay: 0.3 });

  tl.to(heroElements, {
    opacity: 1,
    y: 0,
    duration: 0.9,
    stagger: 0.15,
    ease: 'power4.out'
  });

  // After hero enters, add shimmer to title
  tl.add(() => {
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) heroTitle.classList.add('gsap-shimmer');
  }, '-=0.3');

  // Animate stat numbers with counter
  tl.add(() => {
    animateStatCounters();
  }, '-=0.4');

  // Add floating effect to hero badge
  tl.add(() => {
    gsap.to('.hero-badge', {
      y: -5,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }, '-=0.2');
}

// ─── STAT COUNTER ANIMATION ─────────────────────────────────
function animateStatCounters() {
  document.querySelectorAll('.stat-number').forEach(el => {
    const text = el.textContent;
    el.classList.add('gsap-glow');

    // Extract number from text like "2.500+" or "98%"
    const numMatch = text.replace(/\./g, '').match(/(\d+)/);
    if (!numMatch) return;
    const targetNum = parseInt(numMatch[1]);
    const suffix = text.replace(/[\d.]/g, ''); // e.g., "+" or "%"
    const hasThousandDot = text.includes('.');

    const counter = { val: 0 };
    gsap.to(counter, {
      val: targetNum,
      duration: 2,
      ease: 'power2.out',
      onUpdate: () => {
        let num = Math.round(counter.val);
        if (hasThousandDot && num >= 1000) {
          num = num.toLocaleString('id-ID');
        }
        el.textContent = num + suffix;
      }
    });
  });
}

// ─── HOME SCROLL SECTIONS ───────────────────────────────────
function animateHomeSections() {
  const sections = document.querySelectorAll('[data-gsap-section]');
  sections.forEach(section => {
    // Section title animation
    const title = section.querySelector('.section-title');
    const subtitle = section.querySelector('.section-subtitle');

    if (title) {
      gsap.to(title, {
        scrollTrigger: {
          trigger: title,
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out'
      });
    }

    if (subtitle) {
      gsap.to(subtitle, {
        scrollTrigger: {
          trigger: subtitle,
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.15,
        ease: 'power3.out'
      });
    }

    // Staggered card reveals
    const cards = section.querySelectorAll('.step-card, .benefit-item, .testimonial-card');
    if (cards.length) {
      gsap.to(cards, {
        scrollTrigger: {
          trigger: cards[0],
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        stagger: 0.12,
        ease: 'back.out(1.2)'
      });

      // Add floating effect to step numbers after reveal
      cards.forEach((card, i) => {
        const stepNum = card.querySelector('.step-number');
        if (stepNum) {
          gsap.to(stepNum, {
            scrollTrigger: {
              trigger: card,
              start: 'top 80%',
              toggleActions: 'play none none none'
            },
            onComplete: () => {
              stepNum.classList.add('gsap-float');
              // stagger the floating so they don't all sync
              stepNum.style.animationDelay = `${i * 0.5}s`;
            }
          });
        }
      });
    }
  });
}

// ─── FOOTER REVEAL ──────────────────────────────────────────
function animateFooter() {
  gsap.to('.footer-content', {
    scrollTrigger: {
      trigger: '.footer',
      start: 'top 90%',
      toggleActions: 'play none none none'
    },
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: 'power3.out'
  });

  gsap.to('.footer-bottom', {
    scrollTrigger: {
      trigger: '.footer-bottom',
      start: 'top 95%',
      toggleActions: 'play none none none'
    },
    opacity: 1,
    y: 0,
    duration: 0.6,
    delay: 0.2,
    ease: 'power3.out'
  });

  // Social link icons stagger
  gsap.to('.social-links a', {
    scrollTrigger: {
      trigger: '.social-links',
      start: 'top 95%',
      toggleActions: 'play none none none'
    },
    opacity: 1,
    scale: 1,
    duration: 0.4,
    stagger: 0.1,
    ease: 'back.out(2)'
  });
}

// ─── NAVBAR SMART ANIMATION ─────────────────────────────────
function animateNavbar() {
  // Navbar slide down entrance
  gsap.from('.navbar', {
    y: -80,
    duration: 0.7,
    delay: 0.1,
    ease: 'power3.out'
  });

  // Nav links stagger entrance
  gsap.from('.nav-item', {
    opacity: 0,
    y: -20,
    duration: 0.5,
    stagger: 0.08,
    delay: 0.4,
    ease: 'power2.out',
    clearProps: 'all'
  });

  // CTA buttons entrance — use fromTo so end state is guaranteed visible
  gsap.fromTo('.nav-cta .btn-auth-nav',
    { opacity: 0, y: -10 },
    { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, delay: 0.7, ease: 'power2.out', clearProps: 'transform' }
  );
}

// ─── MAGNETIC BUTTON HOVER ──────────────────────────────────
function initMagneticButtons() {
  const buttons = document.querySelectorAll('.btn-primary, .btn-outline, .btn-large');

  buttons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(btn, {
        x: x * 0.15,
        y: y * 0.15,
        duration: 0.3,
        ease: 'power2.out'
      });
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)'
      });
    });
  });
}

// ─── HERO PARALLAX ──────────────────────────────────────────
function initHeroParallax() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  hero.classList.add('gsap-ready');

  gsap.to('.hero-content', {
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1
    },
    y: 80,
    opacity: 0.3,
    scale: 0.95,
    ease: 'none'
  });

  // Hero footnote parallax
  gsap.to('.hero-footnote', {
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1
    },
    y: 30,
    opacity: 0,
    ease: 'none'
  });
}

// ============================================================
//   PAGE-SPECIFIC ANIMATIONS (triggered on SPA navigation)
// ============================================================

function animateCurrentPage(page) {
  if (typeof gsap === 'undefined') return;

  // Kill previous ScrollTriggers to avoid conflicts
  ScrollTrigger.getAll().forEach(st => st.kill());

  // Small delay to let DOM render
  requestAnimationFrame(() => {
    switch (page) {
      case 'home':
        animateHero();
        animateHomeSections();
        animateFooter();
        initHeroParallax();
        break;

      case 'explore':
        animateExplorePage();
        animateFooter();
        break;

      case 'sell':
        animateSellPage();
        animateFooter();
        break;

      case 'about':
        animateAboutPage();
        animateFooter();
        break;

      case 'myideas':
        animateMyIdeasPage();
        animateFooter();
        break;

      case 'auth':
        animateAuthPage();
        break;
    }

    // Re-init magnetic buttons for new page
    initMagneticButtons();
  });
}

// ─── EXPLORE PAGE ANIMATIONS ────────────────────────────────
function animateExplorePage() {
  // Page hero entrance
  gsap.to('#page-explore .page-hero-title', {
    opacity: 1, y: 0, duration: 0.7, ease: 'power3.out'
  });
  gsap.to('#page-explore .page-hero-subtitle', {
    opacity: 1, y: 0, duration: 0.7, delay: 0.1, ease: 'power3.out'
  });

  // Search bar bounce in
  gsap.from('#page-explore .search-bar', {
    scale: 0.9, opacity: 0, duration: 0.6, delay: 0.25, ease: 'back.out(1.5)'
  });

  // Filter tabs stagger
  gsap.from('#page-explore .filter-tab', {
    opacity: 0, y: 15, duration: 0.4, stagger: 0.06, delay: 0.35, ease: 'power2.out'
  });

  // Idea cards reveal with stagger
  setTimeout(() => {
    const cards = document.querySelectorAll('#page-explore .idea-card');
    if (cards.length) {
      gsap.from(cards, {
        opacity: 0, y: 40, scale: 0.95,
        duration: 0.6, stagger: 0.08, ease: 'power3.out'
      });
    }
  }, 400);
}

// ─── SELL PAGE ANIMATIONS ───────────────────────────────────
function animateSellPage() {
  gsap.to('#page-sell .page-hero-title', {
    opacity: 1, y: 0, duration: 0.7, ease: 'power3.out'
  });
  gsap.to('#page-sell .page-hero-subtitle', {
    opacity: 1, y: 0, duration: 0.7, delay: 0.1, ease: 'power3.out'
  });

  // Form card slide in from left
  gsap.to('.form-card', {
    opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power3.out'
  });

  // Sell benefit cards stagger from right
  gsap.to('.sell-benefit-card', {
    opacity: 1, y: 0, duration: 0.6, stagger: 0.1, delay: 0.3, ease: 'back.out(1.2)'
  });

  // Add border glow to first benefit card
  setTimeout(() => {
    const firstCard = document.querySelector('.sell-benefit-card');
    if (firstCard) firstCard.classList.add('gsap-border-glow');
  }, 1000);
}

// ─── ABOUT PAGE ANIMATIONS ─────────────────────────────────
function animateAboutPage() {
  gsap.to('#page-about .page-hero-title', {
    opacity: 1, y: 0, duration: 0.7, ease: 'power3.out'
  });
  gsap.to('#page-about .page-hero-subtitle', {
    opacity: 1, y: 0, duration: 0.7, delay: 0.1, ease: 'power3.out'
  });

  // About headings
  gsap.to('.about-heading', {
    opacity: 1, y: 0, duration: 0.8, stagger: 0.2, delay: 0.2, ease: 'power3.out'
  });

  // About text paragraphs
  gsap.to('.about-text p', {
    opacity: 1, y: 0, duration: 0.6, stagger: 0.1, delay: 0.35, ease: 'power3.out'
  });

  // About stats
  gsap.to('.about-stats', {
    opacity: 1, y: 0, duration: 0.7, delay: 0.5, ease: 'power3.out'
  });

  // About visual card
  gsap.to('.about-card-visual', {
    opacity: 1, y: 0, duration: 0.8, delay: 0.3, ease: 'back.out(1.3)'
  });

  // Team cards with stagger
  gsap.to('.team-card', {
    scrollTrigger: {
      trigger: '.team-section',
      start: 'top 80%',
      toggleActions: 'play none none none'
    },
    opacity: 1, y: 0, duration: 0.7, stagger: 0.15, ease: 'back.out(1.3)'
  });

  // Value cards with stagger
  gsap.to('.value-card', {
    scrollTrigger: {
      trigger: '.values-section',
      start: 'top 80%',
      toggleActions: 'play none none none'
    },
    opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'back.out(1.2)'
  });

  // Animate about stat numbers
  setTimeout(() => {
    document.querySelectorAll('.about-stat-num').forEach(el => {
      const text = el.textContent;
      const numMatch = text.replace(/\./g, '').match(/(\d+)/);
      if (!numMatch) return;
      const targetNum = parseInt(numMatch[1]);
      const suffix = text.replace(/[\d.]/g, '');
      const hasThousandDot = text.includes('.');

      const counter = { val: 0 };
      gsap.to(counter, {
        val: targetNum,
        duration: 2,
        delay: 0.5,
        ease: 'power2.out',
        onUpdate: () => {
          let num = Math.round(counter.val);
          if (hasThousandDot && num >= 1000) {
            num = num.toLocaleString('id-ID');
          }
          el.textContent = num + suffix;
        }
      });
    });
  }, 600);
}

// ─── MY IDEAS PAGE ANIMATIONS ───────────────────────────────
function animateMyIdeasPage() {
  gsap.to('#page-myideas .page-hero-title', {
    opacity: 1, y: 0, duration: 0.7, ease: 'power3.out'
  });
  gsap.to('#page-myideas .page-hero-subtitle', {
    opacity: 1, y: 0, duration: 0.7, delay: 0.1, ease: 'power3.out'
  });

  // Dashboard stat cards with stagger
  gsap.to('.dash-stat-card', {
    opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, delay: 0.2, ease: 'back.out(1.3)'
  });

  // Animate dashboard numbers
  setTimeout(() => {
    document.querySelectorAll('.dash-stat-num').forEach(el => {
      const text = el.textContent;
      if (text.startsWith('Rp')) {
        // Price counter
        const numMatch = text.replace(/[^\d]/g, '');
        if (!numMatch || numMatch === '0') return;
        const target = parseInt(numMatch);
        const counter = { val: 0 };
        gsap.to(counter, {
          val: target,
          duration: 1.5,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = 'Rp ' + Math.round(counter.val).toLocaleString('id-ID');
          }
        });
      } else {
        const num = parseInt(text);
        if (isNaN(num) || num === 0) return;
        const counter = { val: 0 };
        gsap.to(counter, {
          val: num,
          duration: 1.5,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = Math.round(counter.val).toLocaleString();
          }
        });
      }
    });
  }, 400);

  // My idea items entrance
  setTimeout(() => {
    gsap.from('.my-idea-item', {
      opacity: 0, x: -30, duration: 0.5, stagger: 0.08, ease: 'power3.out'
    });
  }, 500);
}

// ─── AUTH PAGE ANIMATIONS ───────────────────────────────────
function animateAuthPage() {
  // Auth card slide in
  gsap.to('.auth-card', {
    opacity: 1, y: 0, duration: 0.7, delay: 0.1, ease: 'back.out(1.3)'
  });

  // Auth decoration cards stagger
  gsap.to('.auth-deco-card', {
    opacity: 1, y: 0, duration: 0.6, stagger: 0.12, delay: 0.25, ease: 'back.out(1.2)'
  });
}

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Update auth UI berdasarkan state login
  updateAuthUI();
  // Load data per-user jika sudah login (dari DB / localStorage)
  if (isLoggedIn()) await loadUserData();
  // Cek session Supabase (juga load data dari DB jika session valid)
  await checkSupabaseSession();
  // Initialize GSAP animations
  initGSAP();
  // Navigasi awal
  navigateTo('home');
  // Trigger home page animations (navigateTo skips if page-home is already active)
  animateCurrentPage('home');
});
