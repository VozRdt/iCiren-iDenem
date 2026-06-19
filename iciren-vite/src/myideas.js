/* ============================================================
   My Ideas Page Module
   ============================================================ */
import { supabaseClient } from './supabase.js'
import { showToast } from './utils.js'
import { currentUser } from './auth.js'
import { userProfile } from './profile.js'
import { myIdeas, purchasedIdeas, getUserKey } from './ideas.js'
import { navigateTo } from './navigation.js'

let myIdeasTab = 'submitted'

export function switchMyIdeasTab(tab) {
  myIdeasTab = tab
  document.querySelectorAll('.myideas-tab').forEach(t => t.classList.remove('active'))
  const activeTab = document.getElementById('tab-' + tab)
  if (activeTab) activeTab.classList.add('active')
  renderMyIdeasList()
}

export function renderMyIdeas() {
  // Re-read from localStorage to ensure fresh data
  const storedIdeas = JSON.parse(localStorage.getItem(getUserKey('myIdeas')) || '[]')
  myIdeas.length = 0
  storedIdeas.forEach(i => myIdeas.push(i))

  const storedPurchases = JSON.parse(localStorage.getItem(getUserKey('purchasedIdeas')) || '[]')
  purchasedIdeas.length = 0
  storedPurchases.forEach(i => purchasedIdeas.push(i))

  // Update dashboard stats
  const totalEl = document.getElementById('totalIdeasCount')
  if (totalEl) totalEl.textContent = myIdeas.length
  const approved = myIdeas.filter(i => i.status === 'approved').length
  const approvedEl = document.getElementById('approvedCount')
  if (approvedEl) approvedEl.textContent = approved
  const earnings = userProfile?.total_earnings || 0
  const earningsEl = document.getElementById('totalEarnings')
  if (earningsEl) earningsEl.textContent = 'Rp ' + earnings.toLocaleString('id-ID')
  const viewsEl = document.getElementById('totalViews')
  if (viewsEl) viewsEl.textContent = purchasedIdeas.length.toLocaleString()

  // Inject tab UI
  const list = document.getElementById('myIdeasList')
  if (!document.getElementById('myideas-tabs')) {
    list.insertAdjacentHTML('beforebegin', `
      <div id="myideas-tabs" style="display:flex; gap:0.75rem; margin-bottom:1.5rem;">
        <button id="tab-submitted" class="filter-tab myideas-tab active" onclick="window._switchMyIdeasTab('submitted')">
          <i class="fas fa-paper-plane"></i> Disubmit (${myIdeas.length})
        </button>
        <button id="tab-purchased" class="filter-tab myideas-tab" onclick="window._switchMyIdeasTab('purchased')">
          <i class="fas fa-shopping-bag"></i> Dibeli (${purchasedIdeas.length})
        </button>
      </div>`)
  } else {
    const subTab = document.getElementById('tab-submitted')
    const purTab = document.getElementById('tab-purchased')
    if (subTab) subTab.innerHTML = `<i class="fas fa-paper-plane"></i> Disubmit (${myIdeas.length})`
    if (purTab) purTab.innerHTML = `<i class="fas fa-shopping-bag"></i> Dibeli (${purchasedIdeas.length})`
  }

  document.querySelectorAll('.myideas-tab').forEach(t => t.classList.remove('active'))
  const active = document.getElementById('tab-' + myIdeasTab)
  if (active) active.classList.add('active')

  renderMyIdeasList()
}

function renderMyIdeasList() {
  const list = document.getElementById('myIdeasList')
  const catLabel = { youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', podcast: 'Podcast', blog: 'Blog' }

  if (myIdeasTab === 'submitted') {
    if (myIdeas.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="fas fa-paper-plane"></i></div>
          <h3>Belum Ada Ide Disubmit</h3>
          <p>Kamu belum pernah submit ide apapun. Mulai sekarang dan hasilkan uang!</p>
          <button class="btn btn-primary" onclick="window._navigateTo('sell')">
            <i class="fas fa-lightbulb"></i> Submit Ide Pertamamu
          </button>
        </div>`
      return
    }
    list.innerHTML = myIdeas.map(idea => {
      const idAttr = typeof idea.id === 'string' ? `'${idea.id}'` : idea.id
      return `
      <div class="my-idea-item">
        <div class="my-idea-info">
          <h4>${idea.title}</h4>
          <span>${catLabel[idea.platform || idea.category] || idea.platform || idea.category} &bull; Disubmit ${idea.date}</span>
        </div>
        <div style="display:flex; align-items:center; gap:1rem; flex-shrink:0;">
          <span class="my-idea-status ${idea.status === 'approved' ? 'status-approved' : 'status-pending'}">
            ${idea.status === 'approved' ? '✓ Disetujui' : '⏳ Review'}
          </span>
          <span class="my-idea-price">Rp ${idea.price.toLocaleString('id-ID')}</span>
          <button onclick="window._deleteIdea(${idAttr})" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#ef4444; border-radius:8px; padding:0.4rem 0.8rem; cursor:pointer; font-family:inherit; font-size:0.85rem;">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>`
    }).join('')
  } else {
    if (purchasedIdeas.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="fas fa-shopping-bag"></i></div>
          <h3>Belum Ada Ide Dibeli</h3>
          <p>Kamu belum membeli ide apapun. Jelajahi ribuan ide kreatif sekarang!</p>
          <button class="btn btn-primary" onclick="window._navigateTo('explore')">
            <i class="fas fa-compass"></i> Jelajahi Ide
          </button>
        </div>`
      return
    }
    list.innerHTML = purchasedIdeas.map(idea => {
      const idAttr = typeof idea.id === 'string' ? `'${idea.id}'` : idea.id
      return `
      <div class="my-idea-item">
        <div style="font-size:2rem; flex-shrink:0;">${idea.emoji || '💡'}</div>
        <div class="my-idea-info">
          <h4>${idea.title}</h4>
          <span>${catLabel[idea.platform || idea.category] || idea.platform || idea.category} &bull; Dibeli ${idea.boughtDate}</span>
        </div>
        <div style="display:flex; align-items:center; gap:0.5rem; flex-shrink:0;">
          <span class="my-idea-status status-approved">✓ Dimiliki</span>
          <span class="my-idea-price" style="margin-right: 0.5rem;">Rp ${idea.price.toLocaleString('id-ID')}</span>
          <button class="btn btn-outline btn-sm" onclick="window._openModal(${idAttr})" style="padding:0.4rem 0.8rem; font-size:0.85rem; cursor:pointer;">
            <i class="fas fa-eye"></i> Lihat
          </button>
          <button onclick="window._deletePurchased(${idAttr})" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#ef4444; border-radius:8px; padding:0.4rem 0.8rem; cursor:pointer; font-family:inherit; font-size:0.85rem;">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>`
    }).join('')
  }
}

export async function deleteIdea(id) {
  if (supabaseClient && currentUser && currentUser.id) {
    try {
      const { error } = await supabaseClient.from('ideas').delete().eq('id', id).eq('user_id', currentUser.id)
      if (error) throw error
      console.log('✅ Idea deleted from Supabase:', id)
    } catch (e) {
      console.warn('⚠️ DB idea delete error:', e)
    }
  }
  const idx = myIdeas.findIndex(i => i.id === id)
  if (idx !== -1) myIdeas.splice(idx, 1)
  localStorage.setItem(getUserKey('myIdeas'), JSON.stringify(myIdeas))
  renderMyIdeas()
  showToast('🗑️ Ide berhasil dihapus.')
}

export async function deletePurchased(id) {
  const item = purchasedIdeas.find(i => i.id === id)
  const dbId = item?.dbId

  if (supabaseClient && currentUser && currentUser.id && dbId) {
    try {
      const { error } = await supabaseClient.from('purchases').delete().eq('id', dbId).eq('user_id', currentUser.id)
      if (error) throw error
      console.log('✅ Purchase deleted from Supabase:', dbId)
    } catch (e) {
      console.warn('⚠️ DB purchase delete error:', e)
    }
  }

  const idx = purchasedIdeas.findIndex(i => i.id === id)
  if (idx !== -1) purchasedIdeas.splice(idx, 1)
  localStorage.setItem(getUserKey('purchasedIdeas'), JSON.stringify(purchasedIdeas))
  renderMyIdeas()
  showToast('🗑️ Ide dibeli berhasil dihapus.')
}
