/* ============================================================
   SPA Navigation Module
   ============================================================ */
import { startProgress, finishProgress } from './utils.js'
import { isLoggedIn, showAuthRequiredModal, resetAuthForms, PROTECTED_PAGES } from './auth.js'
import { renderIdeas, loadMarketplaceIdeas } from './ideas.js'
import { renderMyIdeas } from './myideas.js'
import { renderProfile } from './profile.js'
import { loadAdminDashboard } from './admin.js'
import { animateCurrentPage, getLenis } from './animations.js'

let isNavigating = false

// ─── SPA NAVIGATION ─────────────────────────────────────────
export function navigateTo(page) {
  if (isNavigating) return

  if (PROTECTED_PAGES.includes(page) && !isLoggedIn()) {
    showAuthRequiredModal()
    return
  }

  const currentActive = document.querySelector('.page.active')
  const target = document.getElementById('page-' + page)

  if (!target || (currentActive && currentActive.id === 'page-' + page)) return

  isNavigating = true

  // Update nav links
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'))
  const navLink = document.getElementById('nav-' + page)
  if (navLink) navLink.classList.add('active')

  closeHamburger()

  // Scroll to top
  const lenis = getLenis()
  if (lenis) {
    lenis.scrollTo(0, { duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 4) })
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Init page data early
  if (page === 'explore') {
    loadMarketplaceIdeas().then(() => renderIdeas())
  }
  if (page === 'myideas') renderMyIdeas()
  if (page === 'auth') resetAuthForms()
  if (page === 'profile') renderProfile()
  if (page === 'admin') loadAdminDashboard()

  startProgress()

  if (!currentActive) {
    target.classList.add('active')
    finishProgress()
    isNavigating = false
    animateCurrentPage(page)
    return
  }

  currentActive.classList.remove('active')
  currentActive.classList.add('exiting')

  setTimeout(() => {
    currentActive.classList.remove('exiting')
    target.classList.add('active')
    finishProgress()
    animateCurrentPage(page)
    setTimeout(() => { isNavigating = false }, 430)
  }, 220)
}

// ─── HAMBURGER MENU (Side Drawer) ────────────────────────────
function getOrCreateBackdrop() {
  let backdrop = document.querySelector('.nav-menu-backdrop')
  if (!backdrop) {
    backdrop = document.createElement('div')
    backdrop.className = 'nav-menu-backdrop'
    backdrop.addEventListener('click', closeHamburger)
    document.body.appendChild(backdrop)
  }
  return backdrop
}

export function toggleMenu() {
  const menu = document.getElementById('navMenu')
  const ham = document.getElementById('hamburger')
  const cta = document.querySelector('.nav-cta')
  const navContainer = document.querySelector('.nav-container')
  const backdrop = getOrCreateBackdrop()
  const isOpening = !menu.classList.contains('open')

  if (isOpening) {
    document.body.appendChild(menu)
    let closeBtn = menu.querySelector('.drawer-close-btn')
    if (!closeBtn) {
      closeBtn = document.createElement('button')
      closeBtn.className = 'drawer-close-btn'
      closeBtn.innerHTML = '<i class="fas fa-times"></i>'
      closeBtn.addEventListener('click', closeHamburger)
      menu.insertBefore(closeBtn, menu.firstChild)
    }
    if (cta) {
      cta.classList.add('open')
      menu.appendChild(cta)
    }
    void menu.offsetWidth
    menu.classList.add('open')
    ham.classList.add('open')
    backdrop.classList.add('show')
    document.body.style.overflow = 'hidden'
  } else {
    menu.classList.remove('open')
    ham.classList.remove('open')
    backdrop.classList.remove('show')
    document.body.style.overflow = ''
    setTimeout(() => {
      const closeBtn = menu.querySelector('.drawer-close-btn')
      if (closeBtn) closeBtn.remove()
      if (cta) {
        cta.classList.remove('open')
        navContainer.insertBefore(cta, ham)
      }
      navContainer.insertBefore(menu, cta || ham)
    }, 300)
  }
}

export function closeHamburger() {
  const menu = document.getElementById('navMenu')
  const ham = document.getElementById('hamburger')
  const cta = document.querySelector('.nav-cta')
  const navContainer = document.querySelector('.nav-container')
  const backdrop = document.querySelector('.nav-menu-backdrop')

  if (!menu.classList.contains('open')) return

  menu.classList.remove('open')
  ham.classList.remove('open')
  document.body.style.overflow = ''
  if (backdrop) backdrop.classList.remove('show')

  setTimeout(() => {
    const closeBtn = menu.querySelector('.drawer-close-btn')
    if (closeBtn) closeBtn.remove()
    if (cta) {
      cta.classList.remove('open')
      navContainer.insertBefore(cta, ham)
    }
    navContainer.insertBefore(menu, cta || ham)
  }, 300)
}

// ─── NAVBAR SCROLL EFFECT ────────────────────────────────────
export function initNavbarScroll() {
  window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar')
    if (window.scrollY > 20) {
      navbar.style.background = 'rgba(5,5,5,0.98)'
    } else {
      navbar.style.background = 'rgba(10,10,10,0.95)'
    }
  })
}
