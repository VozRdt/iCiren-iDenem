/* ============================================================
   Admin Dashboard Module
   ============================================================ */
import { supabaseClient } from './supabase.js'
import { showToast } from './utils.js'
import { currentUser } from './auth.js'
import { loadProfile, userProfile } from './profile.js'
import { stopLenisScroll, startLenisScroll } from './animations.js'

let adminIdeas = []
let adminCurrentTab = 'pending'

export async function loadAdminDashboard() {
  if (!userProfile) await loadProfile()
  if (!userProfile || userProfile.role !== 'admin') {
    const list = document.getElementById('adminIdeasList')
    if (list) list.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fas fa-lock"></i></div><h3>Akses Ditolak</h3><p>Halaman ini hanya untuk admin.</p></div>`
    return
  }

  if (!supabaseClient) {
    adminIdeas = JSON.parse(localStorage.getItem('admin_all_ideas') || '[]')
    renderAdminIdeas()
    return
  }

  try {
    const { data, error } = await supabaseClient.from('ideas').select('*').order('created_at', { ascending: false })
    if (error) throw error
    adminIdeas = data || []
    localStorage.setItem('admin_all_ideas', JSON.stringify(adminIdeas))
  } catch (e) {
    console.warn('Admin load error:', e)
    adminIdeas = JSON.parse(localStorage.getItem('admin_all_ideas') || '[]')
  }
  renderAdminIdeas()
}

export function switchAdminTab(tab) {
  adminCurrentTab = tab
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'))
  const btn = document.getElementById('adminTab' + tab.charAt(0).toUpperCase() + tab.slice(1))
  if (btn) btn.classList.add('active')
  renderAdminIdeas()
}

function renderAdminIdeas() {
  const list = document.getElementById('adminIdeasList')
  if (!list) return

  let filtered = adminIdeas
  if (adminCurrentTab !== 'all') filtered = adminIdeas.filter(i => i.status === adminCurrentTab)

  const pending = adminIdeas.filter(i => i.status === 'pending').length
  const approved = adminIdeas.filter(i => i.status === 'approved').length
  const rejected = adminIdeas.filter(i => i.status === 'rejected').length
  const pc = document.getElementById('adminPendingCount')
  const ac = document.getElementById('adminApprovedCount')
  const rc = document.getElementById('adminRejectedCount')
  const tc = document.getElementById('adminTotalUsers')
  if (pc) pc.textContent = pending
  if (ac) ac.textContent = approved
  if (rc) rc.textContent = rejected
  if (tc) tc.textContent = adminIdeas.length

  const catLabel = { youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', podcast: 'Podcast', blog: 'Blog' }

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fas fa-inbox"></i></div><h3>Tidak Ada Ide</h3><p>Belum ada ide dengan status "${adminCurrentTab}".</p></div>`
    return
  }

  list.innerHTML = filtered.map(idea => {
    const date = new Date(idea.created_at).toLocaleDateString('id-ID')
    const statusMap = {
      pending: '<span class="my-idea-status status-pending">⏳ Pending</span>',
      approved: '<span class="my-idea-status status-approved">✓ Approved</span>',
      rejected: '<span class="my-idea-status status-rejected">✗ Rejected</span>',
    }
    const actions = idea.status === 'pending' ? `
      <button class="admin-btn admin-btn-approve" onclick="window._adminApproveIdea('${idea.id}')"><i class="fas fa-check"></i> Approve</button>
      <button class="admin-btn admin-btn-reject" onclick="window._adminRejectIdea('${idea.id}')"><i class="fas fa-times"></i> Reject</button>
    ` : ''
    return `<div class="admin-idea-card">
      <div class="admin-idea-info">
        <h4>${idea.title}</h4>
        <div class="admin-idea-meta">
          <span><i class="fas fa-tag"></i> ${catLabel[idea.category] || idea.category}</span>
          <span><i class="fas fa-money-bill"></i> Rp ${idea.price.toLocaleString('id-ID')}</span>
          <span><i class="fas fa-calendar"></i> ${date}</span>
          ${statusMap[idea.status] || ''}
        </div>
        <p class="admin-idea-desc">${idea.description || idea.desc || ''}</p>
      </div>
      <div class="admin-idea-actions">
        <button class="admin-btn admin-btn-view" onclick="window._openAdminReview('${idea.id}')"><i class="fas fa-eye"></i> Detail</button>
        ${actions}
      </div>
    </div>`
  }).join('')
}

export function openAdminReview(id) {
  const idea = adminIdeas.find(i => i.id === id)
  if (!idea) return
  const modal = document.getElementById('adminReviewModal')
  const body = document.getElementById('adminReviewBody')
  const catLabel = { youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', podcast: 'Podcast', blog: 'Blog' }
  const date = new Date(idea.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })

  body.innerHTML = `
    <h3>${idea.title}</h3>
    <div class="admin-review-detail">
      <div class="admin-review-row"><span class="admin-review-label">Kategori</span><span class="admin-review-value"><span class="category-badge">${catLabel[idea.category] || idea.category}</span></span></div>
      <div class="admin-review-row"><span class="admin-review-label">Harga</span><span class="admin-review-value" style="font-weight:700;color:#FBBF24;">Rp ${idea.price.toLocaleString('id-ID')}</span></div>
      <div class="admin-review-row"><span class="admin-review-label">Tanggal</span><span class="admin-review-value">${date}</span></div>
      <div class="admin-review-row"><span class="admin-review-label">Tags</span><span class="admin-review-value">${idea.tags || '-'}</span></div>
      <div class="admin-review-row"><span class="admin-review-label">Deskripsi</span><span class="admin-review-value">${idea.description || idea.desc || '-'}</span></div>
      <div class="admin-review-row"><span class="admin-review-label">Status</span><span class="admin-review-value">${idea.status}</span></div>
    </div>
    ${idea.status === 'pending' ? `
      <textarea class="admin-note-input" id="adminNoteInput" placeholder="Catatan admin (opsional)..."></textarea>
      <div class="admin-review-actions">
        <button class="admin-btn admin-btn-approve" onclick="window._adminApproveIdea('${idea.id}');window._closeAdminReviewModal()"><i class="fas fa-check"></i> Approve</button>
        <button class="admin-btn admin-btn-reject" onclick="window._adminRejectIdea('${idea.id}');window._closeAdminReviewModal()"><i class="fas fa-times"></i> Reject</button>
      </div>
    ` : ''}`

  modal.classList.add('show')
  stopLenisScroll()
}

export function closeAdminReviewModal() {
  document.getElementById('adminReviewModal').classList.remove('show')
  startLenisScroll()
}

export async function adminApproveIdea(id) {
  await updateIdeaStatus(id, 'approved')
}

export async function adminRejectIdea(id) {
  await updateIdeaStatus(id, 'rejected')
}

async function updateIdeaStatus(id, status) {
  const note = document.getElementById('adminNoteInput')?.value || ''

  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.from('ideas').update({ status, admin_note: note }).eq('id', id)
      if (error) throw error

      const idea = adminIdeas.find(i => i.id === id)
      if (idea) {
        const notifType = status === 'approved' ? 'idea_approved' : 'idea_rejected'
        const notifTitle = status === 'approved' ? '🎉 Ide Disetujui!' : '❌ Ide Ditolak'
        const notifMsg = status === 'approved'
          ? `Ide "${idea.title}" telah disetujui dan sekarang tampil di marketplace!`
          : `Ide "${idea.title}" ditolak. ${note ? 'Catatan: ' + note : 'Silakan revisi dan submit ulang.'}`

        await supabaseClient.from('notifications').insert({
          user_id: idea.user_id, type: notifType, title: notifTitle, message: notifMsg,
        })
      }
    } catch (e) {
      console.warn('Update status error:', e)
    }
  }

  const idx = adminIdeas.findIndex(i => i.id === id)
  if (idx !== -1) adminIdeas[idx].status = status
  localStorage.setItem('admin_all_ideas', JSON.stringify(adminIdeas))

  renderAdminIdeas()
  showToast(status === 'approved' ? '✅ Ide berhasil disetujui!' : '❌ Ide ditolak.')
}

// ─── INIT ADMIN LISTENERS ───────────────────────────────────
export function initAdminListeners() {
  document.addEventListener('click', (e) => {
    const m = document.getElementById('adminReviewModal')
    if (e.target === m) closeAdminReviewModal()
  })
}
