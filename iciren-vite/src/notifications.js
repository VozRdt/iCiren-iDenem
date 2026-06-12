/* ============================================================
   Notification System Module
   ============================================================ */
import { supabaseClient } from './supabase.js'
import { showToast, timeAgo } from './utils.js'
import { currentUser } from './auth.js'
import { getUserKey } from './ideas.js'

let userNotifications = []

export async function loadNotifications() {
  if (supabaseClient && currentUser && currentUser.id) {
    try {
      const { data, error } = await supabaseClient
        .from('notifications').select('*').eq('user_id', currentUser.id)
        .order('created_at', { ascending: false }).limit(20)
      if (!error && data) userNotifications = data
    } catch (e) { console.warn('⚠️ Notif load error:', e) }
  }
  if (!userNotifications.length) {
    userNotifications = JSON.parse(localStorage.getItem(getUserKey('notifications')) || '[]')
  }
  renderNotifBadge()
}

function renderNotifBadge() {
  const badge = document.getElementById('notifBadge')
  if (!badge) return
  const unread = userNotifications.filter(n => !n.is_read).length
  badge.textContent = unread > 9 ? '9+' : unread
  badge.style.display = unread > 0 ? 'flex' : 'none'
}

export function toggleNotifPanel() {
  const panel = document.getElementById('notifPanel')
  if (!panel) return
  panel.classList.toggle('show')
  if (panel.classList.contains('show')) renderNotifList()
}

function renderNotifList() {
  const list = document.getElementById('notifPanelList')
  if (!list) return
  if (userNotifications.length === 0) {
    list.innerHTML = '<div class="notif-empty"><i class="fas fa-bell-slash"></i><p>Belum ada notifikasi</p></div>'
    return
  }
  const iconMap = {
    idea_approved: { icon: 'fa-check-circle', cls: 'type-approved' },
    idea_rejected: { icon: 'fa-times-circle', cls: 'type-rejected' },
    purchase: { icon: 'fa-shopping-cart', cls: 'type-purchase' },
    idea_sold: { icon: 'fa-coins', cls: 'type-idea_sold' },
    welcome: { icon: 'fa-gift', cls: 'type-welcome' },
    system: { icon: 'fa-info-circle', cls: 'type-system' },
  }
  list.innerHTML = userNotifications.map(n => {
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
  }).join('')
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
}

export async function markAllNotifsRead() {
  userNotifications.forEach(n => n.is_read = true)
  if (supabaseClient && currentUser) {
    try { await supabaseClient.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id).eq('is_read', false) } catch (e) { /* silent */ }
  }
  localStorage.setItem(getUserKey('notifications'), JSON.stringify(userNotifications))
  renderNotifBadge()
  renderNotifList()
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
        showToast(`🔔 ${notif.title}`)
      })
      .subscribe()
    console.log('✅ Realtime subscriptions active')
  } catch (e) { console.warn('Realtime setup error:', e) }
}

// ─── INIT NOTIF LISTENERS ───────────────────────────────────
export function initNotifListeners() {
  document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('navNotifWrapper')
    if (wrapper && !wrapper.contains(e.target)) {
      const panel = document.getElementById('notifPanel')
      if (panel) panel.classList.remove('show')
    }
  })
}
