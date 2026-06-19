/* ============================================================
   Authentication Module
   ============================================================ */
import { supabaseClient } from './supabase.js'
import { showToast } from './utils.js'
import { navigateTo } from './navigation.js'
import { loadUserData, clearUserData, getUserKey } from './ideas.js'
import { loadNotifications, setupRealtimeSubscriptions } from './notifications.js'
import { stopLenisScroll, startLenisScroll } from './animations.js'

// ─── AUTH STATE ──────────────────────────────────────────────
export let currentUser = JSON.parse(localStorage.getItem('iciren_user') || 'null')

export const PROTECTED_PAGES = ['sell', 'explore', 'myideas', 'profile', 'admin']

export function isLoggedIn() {
  return currentUser !== null
}

export function setCurrentUser(user) {
  currentUser = user
}

// ─── UPDATE AUTH UI ──────────────────────────────────────────
export function updateAuthUI() {
  const loginBtn = document.getElementById('navLoginBtn')
  const registerBtn = document.getElementById('navRegisterBtn')
  const userProfile = document.getElementById('navUserProfile')
  const userAvatar = document.getElementById('navUserAvatar')
  const userName = document.getElementById('navUserName')

  if (isLoggedIn()) {
    if (loginBtn) loginBtn.style.display = 'none'
    if (registerBtn) registerBtn.style.display = 'none'
    if (userProfile) {
      userProfile.style.display = 'flex'
      const name = currentUser.name || currentUser.email || 'User'
      if (userName) userName.textContent = name
      
      if (userAvatar) {
        const avatarText = document.getElementById('navUserAvatarText')
        if (currentUser.avatar_url) {
          if (avatarText) avatarText.style.display = 'none'
          let img = userAvatar.querySelector('img')
          if (!img) {
            img = document.createElement('img')
            userAvatar.insertBefore(img, userAvatar.firstChild)
          }
          img.src = currentUser.avatar_url
        } else {
          if (avatarText) {
            avatarText.style.display = 'inline-block'
            avatarText.textContent = name.charAt(0).toUpperCase()
          }
          const img = userAvatar.querySelector('img')
          if (img) img.remove()
        }
      }
    }
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-flex'
    if (registerBtn) registerBtn.style.display = 'inline-flex'
    if (userProfile) userProfile.style.display = 'none'
  }
}

// ─── AUTH FORM TABS ──────────────────────────────────────────
export function switchAuthTab(tab) {
  const loginForm = document.getElementById('loginForm')
  const registerForm = document.getElementById('registerForm')
  const loginTab = document.getElementById('authTabLogin')
  const registerTab = document.getElementById('authTabRegister')

  if (tab === 'login') {
    if (loginForm) loginForm.style.display = 'block'
    if (registerForm) registerForm.style.display = 'none'
    if (loginTab) loginTab.classList.add('active')
    if (registerTab) registerTab.classList.remove('active')
  } else {
    if (loginForm) loginForm.style.display = 'none'
    if (registerForm) registerForm.style.display = 'block'
    if (loginTab) loginTab.classList.remove('active')
    if (registerTab) registerTab.classList.add('active')
  }
}

// ─── RESET AUTH FORMS ────────────────────────────────────────
export function resetAuthForms() {
  const loginForm = document.getElementById('loginForm')
  const registerForm = document.getElementById('registerForm')
  if (loginForm) loginForm.reset()
  if (registerForm) registerForm.reset()
  switchAuthTab('login')
}

// ─── LOGIN HANDLER ───────────────────────────────────────────
export async function handleLogin(e) {
  e.preventDefault()
  const email = document.getElementById('loginEmail').value.trim()
  const password = document.getElementById('loginPassword').value
  const submitBtn = document.getElementById('loginSubmitBtn')

  if (!email || !password) {
    showToast('❌ Mohon isi semua field.')
    return
  }

  submitBtn.disabled = true
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...'

  try {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password })
      if (error) throw error
      currentUser = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email.split('@')[0]
      }
    } else {
      const users = JSON.parse(localStorage.getItem('iciren_users') || '[]')
      const found = users.find(u => u.email === email && u.password === password)
      if (!found) throw new Error('Email atau password salah.')
      currentUser = { id: found.id, email: found.email, name: found.name }
    }

    localStorage.setItem('iciren_user', JSON.stringify(currentUser))
    await loadUserData()
    updateAuthUI()
    showToast('✅ Login berhasil! Selamat datang, ' + currentUser.name)
    setTimeout(() => navigateTo('home'), 1000)
  } catch (err) {
    showToast('❌ ' + (err.message || 'Login gagal. Coba lagi.'))
  } finally {
    submitBtn.disabled = false
    submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk Sekarang'
  }
}

// ─── REGISTER HANDLER ────────────────────────────────────────
export async function handleRegister(e) {
  e.preventDefault()
  const name = document.getElementById('registerName').value.trim()
  const email = document.getElementById('registerEmail').value.trim()
  const password = document.getElementById('registerPassword').value
  const confirmPassword = document.getElementById('registerConfirmPassword').value
  const agreeTerms = document.getElementById('registerAgreeTerms').checked
  const submitBtn = document.getElementById('registerSubmitBtn')

  if (!name || !email || !password || !confirmPassword) {
    showToast('❌ Mohon isi semua field.')
    return
  }
  if (password !== confirmPassword) {
    showToast('❌ Password dan konfirmasi tidak cocok.')
    return
  }
  if (password.length < 6) {
    showToast('❌ Password minimal 6 karakter.')
    return
  }
  if (!agreeTerms) {
    showToast('❌ Kamu harus menyetujui Syarat & Ketentuan.')
    return
  }

  submitBtn.disabled = true
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...'

  try {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.signUp({
        email, password,
        options: { data: { name } }
      })
      if (error) throw error
      showEmailVerifyModal(email)
      resetAuthForms()
    } else {
      const users = JSON.parse(localStorage.getItem('iciren_users') || '[]')
      if (users.some(u => u.email === email)) throw new Error('Email sudah terdaftar.')
      const newUser = { id: Date.now(), email, password, name }
      users.push(newUser)
      localStorage.setItem('iciren_users', JSON.stringify(users))
      currentUser = { id: newUser.id, email, name }
      localStorage.setItem('iciren_user', JSON.stringify(currentUser))
      loadUserData()
      updateAuthUI()
      showToast('🎉 Registrasi berhasil! Selamat datang, ' + name)
      setTimeout(() => navigateTo('home'), 1000)
    }
  } catch (err) {
    showToast('❌ ' + (err.message || 'Registrasi gagal. Coba lagi.'))
  } finally {
    submitBtn.disabled = false
    submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Daftar Sekarang'
  }
}

// ─── GOOGLE LOGIN ────────────────────────────────────────────
export async function handleGoogleLogin() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({ provider: 'google' })
      if (error) throw error
    } catch (err) {
      showToast('❌ Google login gagal: ' + (err.message || 'Coba lagi.'))
    }
  } else {
    showToast('ℹ️ Google login memerlukan konfigurasi Supabase. Silakan daftar manual.')
  }
}

// ─── LOGOUT ──────────────────────────────────────────────────
export async function logoutUser() {
  try {
    if (supabaseClient) await supabaseClient.auth.signOut()
  } catch (e) {
    console.warn('Logout error:', e)
  }
  currentUser = null
  localStorage.removeItem('iciren_user')
  clearUserData()
  resetAuthForms()
  updateAuthUI()
  showToast('👋 Kamu telah keluar. Sampai jumpa lagi!')
  navigateTo('home')
}

// ─── PASSWORD TOGGLE ─────────────────────────────────────────
export function togglePassword(inputId, btnId) {
  const input = document.getElementById(inputId)
  const btn = document.getElementById(btnId)
  if (!input || !btn) return
  if (input.type === 'password') {
    input.type = 'text'
    btn.innerHTML = '<i class="fas fa-eye-slash"></i>'
  } else {
    input.type = 'password'
    btn.innerHTML = '<i class="fas fa-eye"></i>'
  }
}

// ─── AUTH REQUIRED MODAL ─────────────────────────────────────
export function showAuthRequiredModal() {
  const modal = document.getElementById('authRequiredModal')
  if (modal) modal.classList.add('show')
  stopLenisScroll()
}

export function closeAuthModal() {
  const modal = document.getElementById('authRequiredModal')
  if (modal) modal.classList.remove('show')
  startLenisScroll()
}

// ─── PROFILE REQUIRED MODAL ──────────────────────────────────
export function showProfileRequiredModal() {
  const modal = document.getElementById('profileRequiredModal')
  if (modal) modal.classList.add('show')
  stopLenisScroll()
}

export function closeProfileModal() {
  const modal = document.getElementById('profileRequiredModal')
  if (modal) modal.classList.remove('show')
  startLenisScroll()
}

// ─── EMAIL VERIFICATION MODAL ───────────────────────────────
let lastRegisteredEmail = ''

export function showEmailVerifyModal(email) {
  lastRegisteredEmail = email
  const modal = document.getElementById('emailVerifyModal')
  const emailDisplay = document.getElementById('verifyEmailAddress')
  if (emailDisplay) emailDisplay.textContent = email
  if (modal) modal.classList.add('show')
  stopLenisScroll()
}

export function closeEmailVerifyModal() {
  const modal = document.getElementById('emailVerifyModal')
  if (modal) modal.classList.remove('show')
  startLenisScroll()
}

export async function resendVerificationEmail() {
  const btn = document.getElementById('resendVerifyBtn')
  if (!lastRegisteredEmail) {
    showToast('❌ Tidak ada email untuk dikirim ulang.')
    return
  }
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...'
  try {
    if (supabaseClient) {
      const { error } = await supabaseClient.auth.resend({ type: 'signup', email: lastRegisteredEmail })
      if (error) throw error
      showToast('✉️ Email verifikasi telah dikirim ulang ke ' + lastRegisteredEmail)
    } else {
      showToast('ℹ️ Mode offline: verifikasi email tidak tersedia.')
    }
  } catch (err) {
    showToast('❌ Gagal mengirim ulang: ' + (err.message || 'Coba lagi nanti.'))
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Ulang Email'
  }
}

// ─── TERMS & PRIVACY MODAL ──────────────────────────────────
export function showTermsModal(tab) {
  const modal = document.getElementById('termsModal')
  if (modal) modal.classList.add('show')
  if (tab) switchTermsTab(tab)
  stopLenisScroll()
}

export function closeTermsModal() {
  const modal = document.getElementById('termsModal')
  if (modal) modal.classList.remove('show')
  startLenisScroll()
}

export function switchTermsTab(tab) {
  const termsContent = document.getElementById('termsContentTerms')
  const privacyContent = document.getElementById('termsContentPrivacy')
  const termsTab = document.getElementById('termsTabTerms')
  const privacyTab = document.getElementById('termsTabPrivacy')

  if (tab === 'terms') {
    if (termsContent) termsContent.style.display = 'block'
    if (privacyContent) privacyContent.style.display = 'none'
    if (termsTab) termsTab.classList.add('active')
    if (privacyTab) privacyTab.classList.remove('active')
  } else {
    if (termsContent) termsContent.style.display = 'none'
    if (privacyContent) privacyContent.style.display = 'block'
    if (termsTab) termsTab.classList.remove('active')
    if (privacyTab) privacyTab.classList.add('active')
  }
  const body = document.getElementById('termsModalBody')
  if (body) body.scrollTop = 0
}

// ─── CHECK SUPABASE SESSION ─────────────────────────────────
export async function checkSupabaseSession() {
  if (!supabaseClient) return
  try {
    const { data: { session } } = await supabaseClient.auth.getSession()
    if (session && session.user) {
      currentUser = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.email.split('@')[0]
      }
      localStorage.setItem('iciren_user', JSON.stringify(currentUser))
      await loadUserData()
      updateAuthUI()
    }
  } catch (e) {
    console.warn('Session check error:', e)
  }
}

// ─── INIT AUTH EVENT LISTENERS ──────────────────────────────
export function initAuthListeners() {
  // Click backdrop to close modals
  document.addEventListener('click', function (e) {
    const modal = document.getElementById('authRequiredModal')
    if (e.target === modal) closeAuthModal()
    const pModal = document.getElementById('profileRequiredModal')
    if (e.target === pModal) closeProfileModal()
    const emailModal = document.getElementById('emailVerifyModal')
    if (e.target === emailModal) closeEmailVerifyModal()
    const termsModal = document.getElementById('termsModal')
    if (e.target === termsModal) closeTermsModal()
  })
}
