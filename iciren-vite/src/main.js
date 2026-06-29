/* ============================================================
   iCiren iDe'nem — Main Entry Point (Vite)
   ============================================================ */

// ─── STYLES ──────────────────────────────────────────────────
import './style.css'

// ─── MODULES ─────────────────────────────────────────────────
import { updateAuthUI, isLoggedIn, checkSupabaseSession, handleLogin, handleRegister, logoutUser, togglePassword, switchAuthTab, closeAuthModal, closeEmailVerifyModal, resendVerificationEmail, showTermsModal, closeTermsModal, switchTermsTab, showAuthRequiredModal, showProfileRequiredModal, closeProfileModal, initAuthListeners } from './auth.js'
import { navigateTo, toggleMenu, initNavbarScroll } from './navigation.js'
import { loadUserData, loadMarketplaceIdeas, renderIdeas, setFilter, filterIdeas, loadMoreIdeas, openModal, closeModal, buyIdea, updatePriceLabel, initIdeaModalListeners } from './ideas.js'
import { submitIdea } from './sell.js'
import { renderMyIdeas, switchMyIdeasTab, deleteIdea, deletePurchased } from './myideas.js'
import { renderProfile, saveProfile, openWithdrawModal, closeWithdrawModal, submitWithdraw, uploadAvatar } from './profile.js'
import { 
  loadAdminDashboard, switchAdminTab, openAdminReview, closeAdminReviewModal, 
  adminApproveIdea, adminRejectIdea, initAdminListeners,
  switchAdminMode, switchAdminWdTab, adminApproveWithdrawal, adminRejectWithdrawal
} from './admin.js'
import { loadNotifications, toggleNotifPanel, markNotifRead, markAllNotifsRead, openNotifHistoryModal, closeNotifHistoryModal, setupRealtimeSubscriptions, initNotifListeners } from './notifications.js'
import { initGSAP, animateCurrentPage } from './animations.js'

// ─── EXPOSE TO GLOBAL (for inline onclick handlers in HTML) ─
window._navigateTo = navigateTo
window._toggleMenu = toggleMenu
window._handleLogin = handleLogin
window._handleRegister = handleRegister
window._logoutUser = logoutUser
window._togglePassword = togglePassword
window._switchAuthTab = switchAuthTab
window._closeAuthModal = closeAuthModal
window._closeEmailVerifyModal = closeEmailVerifyModal
window._resendVerificationEmail = resendVerificationEmail
window._showTermsModal = showTermsModal
window._closeTermsModal = closeTermsModal
window._switchTermsTab = switchTermsTab
window._showAuthRequiredModal = showAuthRequiredModal
window._showProfileRequiredModal = showProfileRequiredModal
window._closeProfileModal = closeProfileModal
window._setFilter = setFilter
window._filterIdeas = filterIdeas
window._loadMoreIdeas = loadMoreIdeas
window._updatePriceLabel = updatePriceLabel
window._openModal = openModal
window._closeModal = closeModal
window._buyIdea = buyIdea
window._submitIdea = submitIdea
window._switchMyIdeasTab = switchMyIdeasTab
window._deleteIdea = deleteIdea
window._deletePurchased = deletePurchased
window._saveProfile = saveProfile
window._uploadAvatar = uploadAvatar
window._openWithdrawModal = openWithdrawModal
window._closeWithdrawModal = closeWithdrawModal
window._submitWithdraw = submitWithdraw
window._switchAdminTab = switchAdminTab
window._openAdminReview = openAdminReview
window._closeAdminReviewModal = closeAdminReviewModal
window._adminApproveIdea = adminApproveIdea
window._adminRejectIdea = adminRejectIdea
window._switchAdminMode = switchAdminMode
window._switchAdminWdTab = switchAdminWdTab
window._adminApproveWithdrawal = adminApproveWithdrawal
window._adminRejectWithdrawal = adminRejectWithdrawal
window._toggleNotifPanel = toggleNotifPanel
window._markNotifRead = markNotifRead
window._markAllNotifsRead = markAllNotifsRead
window._openNotifHistoryModal = openNotifHistoryModal
window._closeNotifHistoryModal = closeNotifHistoryModal

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Update auth UI
  updateAuthUI()

  // Load user data if logged in
  if (isLoggedIn()) {
    await loadUserData()
    await loadNotifications()
  }

  // Load marketplace ideas from Supabase
  await loadMarketplaceIdeas()

  // Check Supabase session
  await checkSupabaseSession()

  // Initialize GSAP + Lenis animations
  initGSAP()

  // Navigate to home
  navigateTo('home')
  animateCurrentPage('home')

  // Setup realtime subscriptions
  setupRealtimeSubscriptions()

  // Init event listeners
  initAuthListeners()
  initIdeaModalListeners()
  initAdminListeners()
  initNotifListeners()
  initNavbarScroll()
})
