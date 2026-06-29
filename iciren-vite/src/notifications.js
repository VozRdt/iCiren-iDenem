/* ============================================================
   Notification System Module
   ============================================================ */
import { supabaseClient } from './supabase.js'
import { showToast, timeAgo } from './utils.js'
import { currentUser } from './auth.js'
import { getUserKey } from './ideas.js'

let userNotifications = []
const PANEL_LIMIT = 10

export async function loadNotifications() {
  if (supabaseClient && currentUser && currentUser.id) {
    try {
      const { data, error } = await supabaseClient
        .from('notifications').select('*').eq('user_id', currentUser.id)
        .order('created_at', { ascending: false }).limit(50)
      if (!error && data) userNotifications = data
    } catch (e) { console.warn('⚠️ Notif load error:', e) }
  }
  if (!userNotifications.length) {
    userNotifications = JSON.parse(localStorage.getItem(getUserKey('notifications')) || '[]')
  }
  renderNotifBadge()
}

function renderNotifBadge() {
  const unread = userNotifications.filter(n => !n.is_read).length
  const badgeText = unread > 9 ? '9+' : String(unread)
  const badgeDisplay = unread > 0 ? 'flex' : 'none'

  // Desktop badge
  const badge = document.getElementById('notifBadge')
  if (badge) { badge.textContent = badgeText; badge.style.display = badgeDisplay }

  // Mobile badge (mirror)
  const badgeMobile = document.getElementById('notifBadgeMobile')
  if (badgeMobile) { badgeMobile.textContent = badgeText; badgeMobile.style.display = badgeDisplay }
}

export function toggleNotifPanel() {
  const panel = document.getElementById('notifPanel')
  if (!panel) return
  const isOpen = panel.classList.contains('show')
  panel.classList.toggle('show')
  if (!isOpen) {
    // Panel baru dibuka — refresh & render
    loadNotifications().then(() => renderNotifList())
  }
}

const iconMap = {
  idea_approved: { icon: 'fa-check-circle', cls: 'type-approved' },
  idea_rejected: { icon: 'fa-times-circle', cls: 'type-rejected' },
  purchase: { icon: 'fa-shopping-cart', cls: 'type-purchase' },
  idea_sold: { icon: 'fa-coins', cls: 'type-idea_sold' },
  welcome: { icon: 'fa-gift', cls: 'type-welcome' },
  system: { icon: 'fa-info-circle', cls: 'type-system' },
}

function buildNotifItemHTML(n) {
  const ic = iconMap[n.type] || iconMap.system
  const ago = timeAgo(n.created_at)
  return `<div class="notif-item ${n.is_read ? '' : 'unread'}" onclick="window._markNotifRead('${n.id}')">
    <div class="notif-icon ${ic.cls}"><i class="fas ${ic.icon}"></i></div>
    <div class="notif-info">
      <h5>${n.title}</h5>
      <p>${n.message}</p>
      <div class="notif-time">${ago}</div>
    </div>
  </div>`
}

function renderNotifList() {
  const list = document.getElementById('notifPanelList')
  if (!list) return

  if (userNotifications.length === 0) {
    list.innerHTML = '<div class="notif-empty"><i class="fas fa-bell-slash"></i><p>Belum ada notifikasi</p></div>'
    return
  }

  const visible = userNotifications.slice(0, PANEL_LIMIT)
  const hasMore = userNotifications.length > PANEL_LIMIT

  list.innerHTML = visible.map(buildNotifItemHTML).join('') +
    (hasMore
      ? `<div class="notif-show-more-wrap">
           <button class="notif-show-more-btn" id="notifShowMoreBtn" onclick="window._openNotifHistoryModal()">
             <i class="fas fa-list"></i> Lihat Semua (${userNotifications.length})
           </button>
         </div>`
      : `<div class="notif-show-more-wrap">
           <button class="notif-show-more-btn" id="notifShowMoreBtn" onclick="window._openNotifHistoryModal()">
             <i class="fas fa-history"></i> Lihat Riwayat
           </button>
         </div>`)
}

export function openNotifHistoryModal() {
  let modal = document.getElementById('notifHistoryModal')
  if (!modal) {
    modal = document.createElement('div')
    modal.id = 'notifHistoryModal'
    modal.className = 'notif-history-modal'
    modal.innerHTML = `
      <div class="notif-history-content">
        <div class="notif-history-header">
          <div class="notif-history-title">
            <i class="fas fa-bell"></i>
            <h3>Riwayat Notifikasi</h3>
          </div>
          <div class="notif-history-actions">
            <button class="notif-mark-all-modal" onclick="window._markAllNotifsRead()">
              <i class="fas fa-check-double"></i> Tandai Semua Dibaca
            </button>
            <button class="notif-history-close" id="notifHistoryCloseBtn" onclick="window._closeNotifHistoryModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="notif-history-list" id="notifHistoryList"></div>
      </div>`
    document.body.appendChild(modal)
    // Tutup saat klik backdrop
    modal.addEventListener('click', (e) => {
      if (e.target === modal) window._closeNotifHistoryModal()
    })
  }

  const listEl = document.getElementById('notifHistoryList')
  if (listEl) {
    if (userNotifications.length === 0) {
      listEl.innerHTML = '<div class="notif-empty" style="padding:3rem 1rem"><i class="fas fa-bell-slash"></i><p>Belum ada riwayat notifikasi</p></div>'
    } else {
      listEl.innerHTML = userNotifications.map(buildNotifItemHTML).join('')
    }
  }

  modal.classList.add('show')
  document.body.style.overflow = 'hidden'
  // Tutup panel dropdown juga
  const panel = document.getElementById('notifPanel')
  if (panel) panel.classList.remove('show')
}

export function closeNotifHistoryModal() {
  const modal = document.getElementById('notifHistoryModal')
  if (modal) modal.classList.remove('show')
  document.body.style.overflow = ''
}

export async function markNotifRead(id) {
  const n = userNotifications.find(x => x.id === id)
  if (n) n.is_read = true
  if (supabaseClient && currentUser) {
    try { await supabaseClient.from('notifications').update({ is_read: true }).eq('id', id) } catch (e) { /* silent */ }
  }
  localStorage.setItem(getUserKey('notifications'), JSON.stringify(userNotifications))
  renderNotifBadge()
  renderNotifList()
  // Jika modal terbuka, refresh juga
  const modal = document.getElementById('notifHistoryModal')
  if (modal && modal.classList.contains('show')) {
    const listEl = document.getElementById('notifHistoryList')
    if (listEl) listEl.innerHTML = userNotifications.map(buildNotifItemHTML).join('')
  }
}

export async function markAllNotifsRead() {
  userNotifications.forEach(n => n.is_read = true)
  if (supabaseClient && currentUser) {
    try { await supabaseClient.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id).eq('is_read', false) } catch (e) { /* silent */ }
  }
  localStorage.setItem(getUserKey('notifications'), JSON.stringify(userNotifications))
  renderNotifBadge()
  renderNotifList()
  // Refresh modal jika terbuka
  const modal = document.getElementById('notifHistoryModal')
  if (modal && modal.classList.contains('show')) {
    const listEl = document.getElementById('notifHistoryList')
    if (listEl) listEl.innerHTML = userNotifications.map(buildNotifItemHTML).join('')
  }
  showToast('✅ Semua notifikasi ditandai dibaca.')
}

export function setupRealtimeSubscriptions() {
  if (!supabaseClient || !currentUser || !currentUser.id) return
  try {
    supabaseClient
      .channel('user-notifications')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${currentUser.id}`,
      }, (payload) => {
        const notif = payload.new
        userNotifications.unshift(notif)
        renderNotifBadge()
        renderNotifList()
        showToast(`🔔 ${notif.title}`)
      })
      .subscribe()
    console.log('✅ Realtime subscriptions active')
  } catch (e) { console.warn('Realtime setup error:', e) }
}

// ─── INIT NOTIF LISTENERS ───────────────────────────────────
export function initNotifListeners() {
  // Helper: bind a bell button to toggle panel
  function bindBellBtn(btnId, wrapperMobileId) {
    const btn = document.getElementById(btnId)
    if (!btn) return
    btn.removeAttribute('onclick')
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      // For mobile button, move the panel under it
      if (wrapperMobileId) {
        const mobileWrapper = document.getElementById(wrapperMobileId)
        const panel = document.getElementById('notifPanel')
        if (mobileWrapper && panel && !mobileWrapper.contains(panel)) {
          mobileWrapper.appendChild(panel)
        }
      }
      toggleNotifPanel()
    })
  }

  bindBellBtn('navNotifBtn', null)
  bindBellBtn('navNotifBtnMobile', 'navNotifWrapperMobile')

  // Show/hide mobile bell based on login state
  // (auth.js handles navUserProfile, we mirror visibility for mobile bell)
  const observer = new MutationObserver(() => {
    const profile = document.getElementById('navUserProfile')
    const mobileBell = document.getElementById('navNotifWrapperMobile')
    if (profile && mobileBell) {
      mobileBell.style.display = profile.style.display === 'none' ? 'none' : 'flex'
    }
  })
  const profile = document.getElementById('navUserProfile')
  if (profile) observer.observe(profile, { attributes: true, attributeFilter: ['style'] })

  // Close panel when clicking outside both wrappers
  document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('navNotifWrapper')
    const wrapperMobile = document.getElementById('navNotifWrapperMobile')
    const inWrapper = (wrapper && wrapper.contains(e.target)) || (wrapperMobile && wrapperMobile.contains(e.target))
    if (!inWrapper) {
      const panel = document.getElementById('notifPanel')
      if (panel) panel.classList.remove('show')
    }
  })

  // Escape key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNotifHistoryModal()
  })
}


