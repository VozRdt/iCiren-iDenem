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

let adminWithdrawals = []
let adminCurrentMode = 'ideas' // 'ideas' or 'withdrawals'
let adminCurrentWdTab = 'pending'

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

    const { data: wdData, error: wdErr } = await supabaseClient.from('withdrawals').select('*').order('created_at', { ascending: false })
    if (!wdErr) adminWithdrawals = wdData || []
  } catch (e) {
    console.warn('Admin load error:', e)
    adminIdeas = JSON.parse(localStorage.getItem('admin_all_ideas') || '[]')
  }
  renderAdminIdeas()
  renderAdminWithdrawals()
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

// ─── ADMIN WITHDRAWAL LOGIC ───────────────────────────────────

export function switchAdminMode(mode) {
  adminCurrentMode = mode
  document.getElementById('adminModeIdeasBtn').className = mode === 'ideas' ? 'btn btn-primary' : 'btn btn-outline'
  document.getElementById('adminModeWithdrawalsBtn').className = mode === 'withdrawals' ? 'btn btn-primary' : 'btn btn-outline'
  
  document.getElementById('adminModeIdeas').style.display = mode === 'ideas' ? 'block' : 'none'
  document.getElementById('adminModeWithdrawals').style.display = mode === 'withdrawals' ? 'block' : 'none'
  
  if (mode === 'ideas') renderAdminIdeas()
  if (mode === 'withdrawals') renderAdminWithdrawals()
}

export function switchAdminWdTab(tab) {
  adminCurrentWdTab = tab
  document.querySelectorAll('.admin-wd-tab').forEach(t => t.classList.remove('active'))
  
  let tabId = 'adminWdTabPending'
  if (tab === 'completed') tabId = 'adminWdTabCompleted'
  if (tab === 'rejected') tabId = 'adminWdTabRejected'
  const btn = document.getElementById(tabId)
  if (btn) btn.classList.add('active')
  
  renderAdminWithdrawals()
}

function renderAdminWithdrawals() {
  const list = document.getElementById('adminWithdrawalsList')
  if (!list) return

  const filtered = adminWithdrawals.filter(w => w.status === adminCurrentWdTab)

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fas fa-money-check"></i></div><h3>Tidak Ada Data</h3><p>Belum ada permintaan penarikan dengan status ini.</p></div>`
    return
  }

  list.innerHTML = filtered.map(wd => {
    const date = new Date(wd.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    const statusMap = {
      pending: '<span class="my-idea-status status-pending">⏳ Pending</span>',
      completed: '<span class="my-idea-status status-approved">✓ Selesai</span>',
      rejected: '<span class="my-idea-status status-rejected">✗ Ditolak</span>',
    }
    
    const actions = wd.status === 'pending' ? `
      <button class="admin-btn admin-btn-approve" onclick="window._adminApproveWithdrawal('${wd.id}')"><i class="fas fa-check"></i> Tandai Selesai</button>
      <button class="admin-btn admin-btn-reject" onclick="window._adminRejectWithdrawal('${wd.id}')"><i class="fas fa-times"></i> Tolak</button>
    ` : ''

    return `<div class="admin-idea-card">
      <div class="admin-idea-info">
        <h4 style="margin-bottom:0.5rem;"><i class="fas fa-university" style="color:#6366f1;"></i> ${wd.bank_name} - ${wd.account_number}</h4>
        <div class="admin-idea-meta">
          <span><i class="fas fa-user"></i> A.N: <strong>${wd.account_name}</strong></span>
          <span style="color:#10b981; font-weight:bold;"><i class="fas fa-money-bill-wave"></i> Rp ${wd.amount.toLocaleString('id-ID')}</span>
          <span><i class="fas fa-calendar"></i> ${date}</span>
          ${statusMap[wd.status] || ''}
        </div>
      </div>
      <div class="admin-idea-actions" style="justify-content: flex-end;">
        ${actions}
      </div>
    </div>`
  }).join('')
}

export async function adminApproveWithdrawal(id) {
  if (!confirm('Tandai penarikan ini sebagai selesai? Pastikan Anda sudah mentransfer uangnya.')) return
  if (!supabaseClient) return

  try {
    const { error } = await supabaseClient.from('withdrawals').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error

    const wd = adminWithdrawals.find(w => w.id === id)
    if (wd) {
      wd.status = 'completed'
      // Kirim Notifikasi
      await supabaseClient.from('notifications').insert({
        user_id: wd.user_id,
        type: 'withdrawal_success',
        title: '✅ Penarikan Berhasil',
        message: \`Dana Rp \${wd.amount.toLocaleString('id-ID')} telah ditransfer ke rekening \${wd.bank_name} Anda.\`
      })
    }
    renderAdminWithdrawals()
    showToast('✅ Status penarikan berhasil diperbarui.')
  } catch (err) {
    console.error('Approve WD error:', err)
    showToast('❌ Gagal memperbarui status penarikan.')
  }
}

export async function adminRejectWithdrawal(id) {
  const reason = prompt('Masukkan alasan penolakan (opsional, akan dikirim ke user):', 'Rekening tidak valid')
  if (reason === null) return // Canceled

  if (!supabaseClient) return

  try {
    const { data, error } = await supabaseClient.rpc('admin_reject_withdrawal', {
      p_withdrawal_id: id,
      p_note: reason
    })

    if (error) throw error
    if (data && !data.success) throw new Error(data.error)

    const wd = adminWithdrawals.find(w => w.id === id)
    if (wd) wd.status = 'rejected'
    
    renderAdminWithdrawals()
    showToast('✅ Penarikan ditolak dan saldo dikembalikan.')
  } catch (err) {
    console.error('Reject WD error:', err)
    showToast('❌ ' + (err.message || 'Gagal menolak penarikan.'))
  }
}

// ─── INIT ADMIN LISTENERS ───────────────────────────────────
export function initAdminListeners() {
  document.addEventListener('click', (e) => {
    const m = document.getElementById('adminReviewModal')
    if (e.target === m) closeAdminReviewModal()
  })
}
