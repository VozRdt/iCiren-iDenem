/* ============================================================
   GSAP + Lenis Animation System
   ============================================================ */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

// Register plugins
gsap.registerPlugin(ScrollTrigger)

// ─── LENIS SMOOTH SCROLL INSTANCE ────────────────────────────
let lenis = null

export function getLenis() {
  return lenis
}

export function initLenis() {
  lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.5,
    infinite: false,
  })

  lenis.on('scroll', ScrollTrigger.update)

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000)
  })
  gsap.ticker.lagSmoothing(0)

  console.log('✅ Lenis smooth scroll initialized.')
}

export function stopLenisScroll() {
  if (lenis) lenis.stop()
}

export function startLenisScroll() {
  if (lenis) lenis.start()
}

// ─── HERO ENTRANCE ──────────────────────────────────────────
export function animateHero() {
  const heroElements = document.querySelectorAll('[data-gsap="hero"]')
  if (!heroElements.length) return

  const tl = gsap.timeline({ delay: 0.3 })

  tl.to(heroElements, {
    opacity: 1, y: 0, duration: 0.9, stagger: 0.15, ease: 'power4.out'
  })

  tl.add(() => {
    const heroTitle = document.querySelector('.hero-title')
    if (heroTitle) heroTitle.classList.add('gsap-shimmer')
  }, '-=0.3')

  tl.add(() => { animateStatCounters() }, '-=0.4')

  tl.add(() => {
    gsap.to('.hero-badge', {
      y: -5, duration: 2, repeat: -1, yoyo: true, ease: 'sine.inOut'
    })
  }, '-=0.2')
}

// ─── STAT COUNTER ANIMATION ─────────────────────────────────
export function animateStatCounters() {
  document.querySelectorAll('.stat-number').forEach(el => {
    const text = el.textContent
    el.classList.add('gsap-glow')
    const numMatch = text.replace(/\./g, '').match(/(\d+)/)
    if (!numMatch) return
    const targetNum = parseInt(numMatch[1])
    const suffix = text.replace(/[\d.]/g, '')
    const hasThousandDot = text.includes('.')

    const counter = { val: 0 }
    gsap.to(counter, {
      val: targetNum, duration: 2, ease: 'power2.out',
      onUpdate: () => {
        let num = Math.round(counter.val)
        if (hasThousandDot && num >= 1000) num = num.toLocaleString('id-ID')
        el.textContent = num + suffix
      }
    })
  })
}

// ─── HOME SCROLL SECTIONS ───────────────────────────────────
export function animateHomeSections() {
  const sections = document.querySelectorAll('[data-gsap-section]')
  sections.forEach(section => {
    const title = section.querySelector('.section-title')
    const subtitle = section.querySelector('.section-subtitle')

    if (title) {
      gsap.to(title, {
        scrollTrigger: { trigger: title, start: 'top 85%', toggleActions: 'play none none none' },
        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out'
      })
    }

    if (subtitle) {
      gsap.to(subtitle, {
        scrollTrigger: { trigger: subtitle, start: 'top 85%', toggleActions: 'play none none none' },
        opacity: 1, y: 0, duration: 0.8, delay: 0.15, ease: 'power3.out'
      })
    }

    const cards = section.querySelectorAll('.step-card, .benefit-item, .testimonial-card')
    if (cards.length) {
      gsap.to(cards, {
        scrollTrigger: { trigger: cards[0], start: 'top 85%', toggleActions: 'play none none none' },
        opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.12, ease: 'back.out(1.2)'
      })

      cards.forEach((card, i) => {
        const stepNum = card.querySelector('.step-number')
        if (stepNum) {
          gsap.to(stepNum, {
            scrollTrigger: { trigger: card, start: 'top 80%', toggleActions: 'play none none none' },
            onComplete: () => {
              stepNum.classList.add('gsap-float')
              stepNum.style.animationDelay = `${i * 0.5}s`
            }
          })
        }
      })
    }
  })
}

// ─── FOOTER REVEAL ──────────────────────────────────────────
export function animateFooter() {
  gsap.to('.footer-content', {
    scrollTrigger: { trigger: '.footer', start: 'top 90%', toggleActions: 'play none none none' },
    opacity: 1, y: 0, duration: 0.8, ease: 'power3.out'
  })

  gsap.to('.footer-bottom', {
    scrollTrigger: { trigger: '.footer-bottom', start: 'top 95%', toggleActions: 'play none none none' },
    opacity: 1, y: 0, duration: 0.6, delay: 0.2, ease: 'power3.out'
  })

  gsap.to('.social-links a', {
    scrollTrigger: { trigger: '.social-links', start: 'top 95%', toggleActions: 'play none none none' },
    opacity: 1, scale: 1, duration: 0.4, stagger: 0.1, ease: 'back.out(2)'
  })
}

// ─── NAVBAR SMART ANIMATION ─────────────────────────────────
export function animateNavbar() {
  gsap.from('.navbar', { y: -80, duration: 0.7, delay: 0.1, ease: 'power3.out' })

  gsap.from('.nav-item', {
    opacity: 0, y: -20, duration: 0.5, stagger: 0.08, delay: 0.4, ease: 'power2.out', clearProps: 'all'
  })

  gsap.fromTo('.nav-cta .btn-auth-nav',
    { opacity: 0, y: -10 },
    { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, delay: 0.7, ease: 'power2.out', clearProps: 'transform' }
  )
}

// ─── MAGNETIC BUTTON HOVER ──────────────────────────────────
export function initMagneticButtons() {
  const buttons = document.querySelectorAll('.btn-primary, .btn-outline, .btn-large')
  buttons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      gsap.to(btn, { x: x * 0.15, y: y * 0.15, duration: 0.3, ease: 'power2.out' })
    })
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' })
    })
  })
}

// ─── HERO PARALLAX ──────────────────────────────────────────
export function initHeroParallax() {
  const hero = document.querySelector('.hero')
  if (!hero) return
  hero.classList.add('gsap-ready')

  gsap.to('.hero-content', {
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
    y: 80, opacity: 0.3, scale: 0.95, ease: 'none'
  })

  gsap.to('.hero-footnote', {
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
    y: 30, opacity: 0, ease: 'none'
  })
}

// ─── EXPLORE PAGE ANIMATIONS ────────────────────────────────
export function animateExplorePage() {
  gsap.to('#page-explore .page-hero-title', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
  gsap.to('#page-explore .page-hero-subtitle', { opacity: 1, y: 0, duration: 0.7, delay: 0.1, ease: 'power3.out' })
  gsap.from('#page-explore .search-bar', { scale: 0.9, opacity: 0, duration: 0.6, delay: 0.25, ease: 'back.out(1.5)' })
  gsap.from('#page-explore .filter-tab', { opacity: 0, y: 15, duration: 0.4, stagger: 0.06, delay: 0.35, ease: 'power2.out' })

  setTimeout(() => {
    const cards = document.querySelectorAll('#page-explore .idea-card')
    const grid = document.getElementById('ideasGrid')
    if (grid) grid.classList.remove('ready')
    if (cards.length) {
      gsap.from(cards, {
        opacity: 0,
        y: 40,
        scale: 0.95,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power3.out',
        clearProps: 'all',
        onComplete: () => {
          if (grid) grid.classList.add('ready')
        }
      })
    } else {
      if (grid) grid.classList.add('ready')
    }
  }, 400)
}

// ─── SELL PAGE ANIMATIONS ───────────────────────────────────
export function animateSellPage() {
  gsap.to('#page-sell .page-hero-title', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
  gsap.to('#page-sell .page-hero-subtitle', { opacity: 1, y: 0, duration: 0.7, delay: 0.1, ease: 'power3.out' })
  gsap.to('.form-card', { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' })
  gsap.to('.sell-benefit-card', { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, delay: 0.3, ease: 'back.out(1.2)' })

  setTimeout(() => {
    const firstCard = document.querySelector('.sell-benefit-card')
    if (firstCard) firstCard.classList.add('gsap-border-glow')
  }, 1000)
}

// ─── ABOUT PAGE ANIMATIONS ─────────────────────────────────
export function animateAboutPage() {
  gsap.to('#page-about .page-hero-title', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
  gsap.to('#page-about .page-hero-subtitle', { opacity: 1, y: 0, duration: 0.7, delay: 0.1, ease: 'power3.out' })
  gsap.to('.about-heading', { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, delay: 0.2, ease: 'power3.out' })
  gsap.to('.about-text p', { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, delay: 0.35, ease: 'power3.out' })
  gsap.to('.about-stats', { opacity: 1, y: 0, duration: 0.7, delay: 0.5, ease: 'power3.out' })
  gsap.to('.about-card-visual', { opacity: 1, y: 0, duration: 0.8, delay: 0.3, ease: 'back.out(1.3)' })

  gsap.to('.team-card', {
    scrollTrigger: { trigger: '.team-section', start: 'top 80%', toggleActions: 'play none none none' },
    opacity: 1, y: 0, duration: 0.7, stagger: 0.15, ease: 'back.out(1.3)'
  })

  gsap.to('.value-card', {
    scrollTrigger: { trigger: '.values-section', start: 'top 80%', toggleActions: 'play none none none' },
    opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'back.out(1.2)'
  })

  setTimeout(() => {
    document.querySelectorAll('.about-stat-num').forEach(el => {
      const text = el.textContent
      const numMatch = text.replace(/\./g, '').match(/(\d+)/)
      if (!numMatch) return
      const targetNum = parseInt(numMatch[1])
      const suffix = text.replace(/[\d.]/g, '')
      const hasThousandDot = text.includes('.')
      const counter = { val: 0 }
      gsap.to(counter, {
        val: targetNum, duration: 2, delay: 0.5, ease: 'power2.out',
        onUpdate: () => {
          let num = Math.round(counter.val)
          if (hasThousandDot && num >= 1000) num = num.toLocaleString('id-ID')
          el.textContent = num + suffix
        }
      })
    })
  }, 600)
}

// ─── MY IDEAS PAGE ANIMATIONS ───────────────────────────────
export function animateMyIdeasPage() {
  gsap.to('#page-myideas .page-hero-title', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
  gsap.to('#page-myideas .page-hero-subtitle', { opacity: 1, y: 0, duration: 0.7, delay: 0.1, ease: 'power3.out' })
  gsap.to('.dash-stat-card', { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, delay: 0.2, ease: 'back.out(1.3)' })

  setTimeout(() => {
    document.querySelectorAll('.dash-stat-num').forEach(el => {
      const text = el.textContent
      if (text.startsWith('Rp')) {
        const numMatch = text.replace(/[^\d]/g, '')
        if (!numMatch || numMatch === '0') return
        const target = parseInt(numMatch)
        const counter = { val: 0 }
        gsap.to(counter, {
          val: target, duration: 1.5, ease: 'power2.out',
          onUpdate: () => { el.textContent = 'Rp ' + Math.round(counter.val).toLocaleString('id-ID') }
        })
      } else {
        const num = parseInt(text)
        if (isNaN(num) || num === 0) return
        const counter = { val: 0 }
        gsap.to(counter, {
          val: num, duration: 1.5, ease: 'power2.out',
          onUpdate: () => { el.textContent = Math.round(counter.val).toLocaleString() }
        })
      }
    })
  }, 400)

  setTimeout(() => {
    gsap.from('.my-idea-item', { opacity: 0, x: -30, duration: 0.5, stagger: 0.08, ease: 'power3.out' })
  }, 500)
}

// ─── AUTH PAGE ANIMATIONS ───────────────────────────────────
export function animateAuthPage() {
  gsap.to('.auth-card', { opacity: 1, y: 0, duration: 0.7, delay: 0.1, ease: 'back.out(1.3)' })
  gsap.to('.auth-deco-card', { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, delay: 0.25, ease: 'back.out(1.2)' })
}

// ─── PROFILE PAGE ANIMATIONS ────────────────────────────────
export function animateProfilePage() {
  gsap.to('#page-profile .page-hero-title', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
  gsap.to('#page-profile .page-hero-subtitle', { opacity: 1, y: 0, duration: 0.7, delay: 0.1, ease: 'power3.out' })
  gsap.to('.profile-card', { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'back.out(1.3)' })
  gsap.to('.profile-form-wrapper .form-card', { opacity: 1, y: 0, duration: 0.8, delay: 0.3, ease: 'power3.out' })
  gsap.to('.profile-quick-actions .btn', { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, delay: 0.4, ease: 'power2.out' })
}

// ─── ADMIN PAGE ANIMATIONS ─────────────────────────────────
export function animateAdminPage() {
  gsap.to('#page-admin .page-hero-title', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
  gsap.to('#page-admin .page-hero-subtitle', { opacity: 1, y: 0, duration: 0.7, delay: 0.1, ease: 'power3.out' })
  gsap.to('#page-admin .dash-stat-card', { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, delay: 0.2, ease: 'back.out(1.3)' })
  setTimeout(() => {
    gsap.from('.admin-idea-card', { opacity: 0, x: -20, duration: 0.5, stagger: 0.08, ease: 'power3.out' })
  }, 400)
}

// ─── PAGE-SPECIFIC ANIMATION DISPATCHER ─────────────────────
export function animateCurrentPage(page) {
  ScrollTrigger.getAll().forEach(st => st.kill())

  requestAnimationFrame(() => {
    switch (page) {
      case 'home':
        animateHero()
        animateHomeSections()
        animateFooter()
        initHeroParallax()
        break
      case 'explore':
        animateExplorePage()
        animateFooter()
        break
      case 'sell':
        animateSellPage()
        animateFooter()
        break
      case 'about':
        animateAboutPage()
        animateFooter()
        break
      case 'myideas':
        animateMyIdeasPage()
        animateFooter()
        break
      case 'auth':
        animateAuthPage()
        break
      case 'profile':
        animateProfilePage()
        animateFooter()
        break
      case 'admin':
        animateAdminPage()
        animateFooter()
        break
    }
    initMagneticButtons()
    setTimeout(() => {
      ScrollTrigger.refresh()
    }, 200)
  })
}

// ─── INIT GSAP SYSTEM ───────────────────────────────────────
export function initGSAP() {
  gsap.defaults({ ease: 'power3.out', duration: 0.8 })
  initLenis()
  animateNavbar()
  initMagneticButtons()
}
