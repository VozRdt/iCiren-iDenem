/* ============================================================
   Marketplace Ideas Module
   ============================================================ */
import gsap from 'gsap'
import { supabaseClient } from './supabase.js'
import { showToast } from './utils.js'
import { currentUser, isLoggedIn, showAuthRequiredModal } from './auth.js'
import { navigateTo } from './navigation.js'
import { stopLenisScroll, startLenisScroll, getLenis } from './animations.js'
import { loadReviews, setStarRating as _setStarRating, submitReview as _submitReview, selectedStarRating } from './reviews.js'
import { switchMyIdeasTab } from './myideas.js'
import { userProfile } from './profile.js'

// ─── DATA IDE ────────────────────────────────────────────────
export const allIdeas = []

export let displayedIdeas = 6
export let currentFilter = 'semua'
export let myIdeas = []
export let purchasedIdeas = []

// ─── USER-SPECIFIC STORAGE HELPERS ───────────────────────────
export function getUserKey(baseName) {
  if (currentUser && currentUser.id) return baseName + '_' + currentUser.id
  return baseName
}

// ─── LOAD USER DATA ──────────────────────────────────────────
export async function loadUserData() {
  if (supabaseClient && currentUser && currentUser.id) {
    try {
      const { data: ideasData, error: ideasErr } = await supabaseClient
        .from('ideas').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false })

      if (!ideasErr && ideasData) {
        myIdeas = ideasData.map(row => ({
          id: row.id, title: row.title, platform: row.platform, category: row.category, price: row.price,
          desc: row.description, status: row.status || 'pending',
          date: new Date(row.created_at).toLocaleDateString('id-ID'),
        }))
        localStorage.setItem(getUserKey('myIdeas'), JSON.stringify(myIdeas))
      } else {
        console.warn('⚠️ Gagal load ideas dari DB, pakai localStorage:', ideasErr)
        myIdeas = JSON.parse(localStorage.getItem(getUserKey('myIdeas')) || '[]')
      }

      const { data: purchData, error: purchErr } = await supabaseClient
        .from('purchases').select('*').eq('user_id', currentUser.id).order('purchased_at', { ascending: false })

      if (!purchErr && purchData) {
        purchasedIdeas = purchData.map(row => ({
          id: row.idea_id, dbId: row.id, title: row.idea_title, platform: row.idea_platform, category: row.idea_category,
          price: row.idea_price, desc: row.idea_desc, emoji: row.idea_emoji || '💡',
          rating: row.idea_rating || 0, views: row.idea_views || 0,
          boughtDate: new Date(row.purchased_at).toLocaleDateString('id-ID'),
        }))
        localStorage.setItem(getUserKey('purchasedIdeas'), JSON.stringify(purchasedIdeas))
      } else {
        console.warn('⚠️ Gagal load purchases dari DB, pakai localStorage:', purchErr)
        purchasedIdeas = JSON.parse(localStorage.getItem(getUserKey('purchasedIdeas')) || '[]')
      }
      console.log(`✅ Data loaded from Supabase: ${myIdeas.length} ideas, ${purchasedIdeas.length} purchases`)
    } catch (e) {
      console.warn('⚠️ DB load error, fallback localStorage:', e)
      myIdeas = JSON.parse(localStorage.getItem(getUserKey('myIdeas')) || '[]')
      purchasedIdeas = JSON.parse(localStorage.getItem(getUserKey('purchasedIdeas')) || '[]')
    }
  } else {
    myIdeas = JSON.parse(localStorage.getItem(getUserKey('myIdeas')) || '[]')
    purchasedIdeas = JSON.parse(localStorage.getItem(getUserKey('purchasedIdeas')) || '[]')
  }
}

export function clearUserData() {
  myIdeas = []
  purchasedIdeas = []
}

// ─── MARKETPLACE IDEAS ──────────────────────────────────────
export let marketplaceIdeas = []

export async function loadMarketplaceIdeas() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('ideas').select('*').eq('status', 'approved').order('created_at', { ascending: false })
      if (!error && data && data.length > 0) {
        marketplaceIdeas = data.map(d => ({
          id: d.id, title: d.title, platform: d.platform, category: d.category, price: d.price,
          desc: d.description || d.desc || '', emoji: d.emoji || '💡',
          views: d.views || 0, rating: parseFloat(d.rating) || 0,
          created_at: d.created_at, user_id: d.user_id, fromDB: true
        }))
      }
    } catch (e) { console.warn('Marketplace load error:', e) }
  }
}

export function getAllMarketplaceIdeas() {
  const dbIds = new Set(marketplaceIdeas.map(i => i.id))
  return [...marketplaceIdeas, ...allIdeas.filter(i => !dbIds.has(i.id))]
}

// ─── RENDER IDEAS ────────────────────────────────────────────
export function renderIdeas() {
  const grid = document.getElementById('ideasGrid')
  if (!grid) return

  const searchVal = (document.getElementById('searchInput')?.value || '').toLowerCase()
  const sortVal = document.getElementById('sortSelect')?.value || 'newest'
  const maxPrice = parseInt(document.getElementById('priceRange')?.value || '200000')
  const catFilter = document.getElementById('filterCategory')?.value || 'semua'
  const platFilter = document.getElementById('filterPlatform')?.value || 'semua'

  const all = getAllMarketplaceIdeas()
  let filtered = all.filter(idea => {
    const matchCat = catFilter === 'semua' || idea.category === catFilter
    const matchPlat = platFilter === 'semua' || idea.platform === platFilter
    const matchSearch = idea.title.toLowerCase().includes(searchVal) || (idea.desc || '').toLowerCase().includes(searchVal)
    const matchPrice = idea.price <= maxPrice
    return matchCat && matchPlat && matchSearch && matchPrice
  })

  switch (sortVal) {
    case 'price-low': filtered.sort((a, b) => a.price - b.price); break
    case 'price-high': filtered.sort((a, b) => b.price - a.price); break
    case 'rating': filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break
    case 'views': filtered.sort((a, b) => (b.views || 0) - (a.views || 0)); break
    case 'newest': default: filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)); break
  }

  const rc = document.getElementById('resultCount')
  if (rc) rc.textContent = filtered.length

  const toShow = filtered.slice(0, displayedIdeas)
  grid.innerHTML = toShow.map(idea => createIdeaCard(idea)).join('')

  const btn = document.querySelector('.load-more button')
  if (btn) btn.style.display = filtered.length > displayedIdeas ? 'inline-flex' : 'none'
}

export function updatePriceLabel() {
  const val = document.getElementById('priceRange')?.value || 200000
  const label = document.getElementById('priceRangeLabel')
  if (label) label.textContent = 'Rp ' + parseInt(val).toLocaleString('id-ID')
}

function createIdeaCard(idea) {
  const stars = '⭐'.repeat(Math.min(Math.round(idea.rating || 0), 5))
  const p = idea.platform || idea.category || ''
  const c = idea.category || 'lainnya'
  const platformLabel = { youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', podcast: 'Podcast', blog: 'Blog' }[p] || p
  const idAttr = typeof idea.id === 'string' ? `'${idea.id}'` : idea.id
  return `
    <div class="idea-card" onclick="window._openModal(${idAttr})">
      <div class="idea-image">
        <span style="font-size:5rem;">${idea.emoji || '💡'}</span>
      </div>
      <div class="idea-content">
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <span class="category-badge">${platformLabel}</span>
            <span class="category-badge" style="background: rgba(16,185,129,0.1); color: #10B981;">${c.charAt(0).toUpperCase() + c.slice(1)}</span>
        </div>
        <h3 class="idea-title" style="margin-top: 0.5rem;">${idea.title}</h3>
        <p class="idea-description">${idea.desc || ''}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem;">
          <span class="idea-price">Rp ${idea.price.toLocaleString('id-ID')}</span>
          <span style="color:#a3a3a3; font-size:0.85rem;">${(idea.views || 0).toLocaleString()} views</span>
        </div>
        <div style="margin-top:0.8rem; color:#FBBF24; font-size:0.85rem;">${stars} ${idea.rating || 0}</div>
      </div>
    </div>`
}

export function setFilter(filter, btn) {
  currentFilter = filter
  displayedIdeas = 6
  document.querySelectorAll('#filterTabs .filter-tab').forEach(t => t.classList.remove('active'))
  btn.classList.add('active')
  renderIdeas()
}

export function filterIdeas() {
  displayedIdeas = 6
  renderIdeas()
}

export function loadMoreIdeas() {
  const btn = document.querySelector('.load-more button')
  if (btn) {
    const originalText = btn.innerHTML
    // Set loading state on button
    btn.disabled = true
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat...'
    
    // Get current card count before rendering new ones
    const prevCount = document.querySelectorAll('#ideasGrid .idea-card').length
    
    // Simulate a brief loading latency (e.g. 450ms) for high-end feel
    setTimeout(() => {
      displayedIdeas += 3
      renderIdeas()
      
      // Animate new cards in
      const cards = document.querySelectorAll('#ideasGrid .idea-card')
      const newCards = Array.from(cards).slice(prevCount)
      if (newCards.length) {
        gsap.fromTo(newCards,
          { opacity: 0, y: 30, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out', clearProps: 'all' }
        )
      }
      
      // Restore button state
      btn.disabled = false
      btn.innerHTML = originalText
      
      // Scroll smoothly to the first new card so the user sees it
      const lenisInstance = getLenis()
      if (newCards.length && lenisInstance) {
        requestAnimationFrame(() => {
          const rect = newCards[0].getBoundingClientRect()
          const targetScroll = window.scrollY + rect.top - 120 // Scroll to card top minus navbar offset
          lenisInstance.scrollTo(targetScroll, { duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 4) })
        })
      } else if (newCards.length) {
        requestAnimationFrame(() => {
          const rect = newCards[0].getBoundingClientRect()
          const targetScroll = window.scrollY + rect.top - 120
          window.scrollTo({ top: targetScroll, behavior: 'smooth' })
        })
      }
    }, 450)
  } else {
    displayedIdeas += 3
    renderIdeas()
  }
}

// ─── MODAL ───────────────────────────────────────────────────
let currentModalIdeaId = null

export function openModal(ideaId) {
  const all = getAllMarketplaceIdeas()
  const idea = all.find(i => i.id === ideaId) || allIdeas.find(i => i.id === ideaId)
  if (!idea) return
  currentModalIdeaId = ideaId
  const modal = document.getElementById('ideaModal')
  const body = document.getElementById('modalBody')
  const p = idea.platform || idea.category || ''
  const c = idea.category || 'lainnya'
  const platformLabel = { youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', podcast: 'Podcast', blog: 'Blog' }[p] || p
  const idAttr = typeof idea.id === 'string' ? `'${idea.id}'` : idea.id

  body.innerHTML = `
    <div style="text-align:center; margin-bottom:0.3rem; font-size:2.2rem;">${idea.emoji || '💡'}</div>
    <div style="display: flex; gap: 0.4rem; justify-content: center;">
        <span class="category-badge">${platformLabel}</span>
        <span class="category-badge" style="background: rgba(16,185,129,0.1); color: #10B981;">${c.charAt(0).toUpperCase() + c.slice(1)}</span>
    </div>
    <h2 style="color:#f8fafc; font-size:1.05rem; margin:0.5rem 0 0.2rem; text-align:center;">${idea.title}</h2>
    <p style="color:#a3a3a3; line-height:1.3; margin-bottom:0.6rem; font-size:0.85rem; text-align:center;">${idea.desc || ''}</p>
    <div style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem 0.8rem; background:rgba(245,158,11,0.05); border:1px solid rgba(245,158,11,0.2); border-radius:10px; margin-bottom:0.6rem;">
      <div>
        <div style="color:#a3a3a3; font-size:0.7rem; margin-bottom:0.1rem;">Harga</div>
        <div style="font-size:1.15rem; font-weight:800; background:linear-gradient(135deg,#F59E0B,#FBBF24); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">Rp ${idea.price.toLocaleString('id-ID')}</div>
      </div>
      <div style="text-align:right;">
        <div style="color:#FBBF24; font-size:0.8rem; margin-bottom:0.1rem;">${'⭐'.repeat(Math.min(Math.round(idea.rating || 0), 5))} ${idea.rating || 0}</div>
        <div style="color:#a3a3a3; font-size:0.7rem;">${(idea.views || 0).toLocaleString()} kali dilihat</div>
      </div>
    </div>
    ${purchasedIdeas.some(i => i.id === ideaId) 
      ? `<div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: #10B981; padding: 0.6rem; text-align: center; border-radius: 10px; margin-bottom: 0.6rem; font-weight: 600;"><i class="fas fa-check-circle"></i> Anda sudah memiliki ide ini</div>`
      : `<button class="btn btn-primary" style="width:100%; margin-bottom:0.4rem; padding:0.6rem 1rem; font-size:0.9rem;" onclick="window._buyIdea(${idAttr})">
          <i class="fas fa-shopping-cart"></i> Beli Ide Ini
        </button>`
    }
    <!-- Review Section -->
    <div class="review-section">
      <h4 style="font-size:0.9rem; margin-bottom:0.4rem;"><i class="fas fa-star"></i> Ulasan & Rating</h4>
      <div class="review-form" id="reviewForm" style="display:${isLoggedIn() ? 'block' : 'none'}">
        <div class="star-selector" id="starSelector" style="margin-bottom:0.3rem;">
          <i class="fas fa-star" data-star="1" onclick="window._setStarRating(1)"></i>
          <i class="fas fa-star" data-star="2" onclick="window._setStarRating(2)"></i>
          <i class="fas fa-star" data-star="3" onclick="window._setStarRating(3)"></i>
          <i class="fas fa-star" data-star="4" onclick="window._setStarRating(4)"></i>
          <i class="fas fa-star" data-star="5" onclick="window._setStarRating(5)"></i>
        </div>
        <textarea class="review-input" id="reviewComment" rows="2" placeholder="Tulis ulasan..." style="margin-bottom:0.4rem; padding:0.5rem;"></textarea>
        <button class="btn btn-outline btn-sm" onclick="window._submitReview(${idAttr})" style="width:100%; padding:0.4rem 0.8rem; font-size:0.8rem;">
          <i class="fas fa-paper-plane"></i> Kirim Ulasan
        </button>
      </div>
      <div class="review-list" id="reviewList" style="margin-top:0.4rem;">
        <div class="review-empty">Memuat ulasan...</div>
      </div>
    </div>`

  modal.classList.add('show')
  stopLenisScroll()
  loadReviews(ideaId)
}

export function closeModal() {
  document.getElementById('ideaModal').classList.remove('show')
  startLenisScroll()
}

// ─── BUY IDEA ────────────────────────────────────────────────
export async function buyIdea(ideaId) {
  if (!isLoggedIn()) {
    closeModal()
    showAuthRequiredModal()
    return
  }

  if (purchasedIdeas.some(i => i.id === ideaId)) {
    closeModal()
    showToast('ℹ️ Kamu sudah membeli ide ini sebelumnya.')
    return
  }

  const all = getAllMarketplaceIdeas()
  const idea = all.find(i => i.id === ideaId) || allIdeas.find(i => i.id === ideaId)
  if (!idea) return

  if (supabaseClient && currentUser && currentUser.id) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(ideaId));
    
    if (!isUUID) {
      // Jika ide adalah data dummy (bukan dari database), proses pembelian secara lokal (mock)
      addPurchasedIdeaLocal(idea);
      closeModal();
      showToast('✅ Ide berhasil dibeli! (Dummy Mode)');
      return;
    }

    try {
      showToast('⏳ Membuat transaksi pembayaran...')
      
      // 1. Create transaction in Supabase
      const { data: intentResult, error: intentErr } = await supabaseClient
        .rpc('create_payment_intent', { p_idea_id: ideaId })
      
      if (intentErr) throw intentErr
      if (!intentResult.success) {
        closeModal()
        showToast('❌ ' + intentResult.error)
        return
      }
      
      const transactionId = intentResult.transaction_id;
      console.log('✅ Payment intent created:', transactionId)

      // 2. Request Midtrans Snap Token from Backend
      const backendUrl = 'http://localhost:5000' // or dynamically loaded
      const tokenResponse = await fetch(`${backendUrl}/api/payment/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: intentResult.transaction_id,
          amount: intentResult.amount,
          idea_title: intentResult.idea_title,
          customer_name: userProfile?.full_name || currentUser.email.split('@')[0],
          customer_email: currentUser.email
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Gagal mendapatkan token pembayaran');
      }

      const { token } = await tokenResponse.json();

      // 3. Trigger Midtrans Snap pop-up
      if (window.snap) {
        window.snap.pay(token, {
          onSuccess: async function(result){
            showToast('✅ Pembayaran berhasil!');
            
            // Call process_purchase directly from frontend as a fallback for localhost development
            try {
              if (supabaseClient && intentResult && intentResult.transaction_id) {
                await supabaseClient.rpc('process_purchase', {
                  p_transaction_id: intentResult.transaction_id,
                  p_payment_method: result.payment_type || 'midtrans',
                  p_gateway: 'midtrans',
                  p_gateway_txn_id: result.transaction_id || ''
                });
              }
            } catch(e) { console.warn('process_purchase local error:', e); }

            closeModal();
            addPurchasedIdeaLocal(idea);
          },
          onPending: function(result){
            showToast('⏳ Menunggu pembayaran...');
          },
          onError: function(result){
            showToast('❌ Pembayaran gagal!');
          },
          onClose: function(){
            showToast('ℹ️ Pop-up pembayaran ditutup');
          }
        });
      } else {
        showToast('❌ Midtrans script not loaded');
      }

    } catch (e) {
      console.error('❌ Purchase error:', e)
      closeModal()
      showToast('❌ Gagal membeli ide: ' + (e.message || 'Terjadi kesalahan.'))
      return
    }
  } else {
    // Fallback for no Supabase mode
    addPurchasedIdeaLocal(idea);
    closeModal()
    showToast('✅ Ide berhasil dibeli! Lihat di Ide Saya → Tab Dibeli.')
  }
}

function addPurchasedIdeaLocal(idea) {
  const bought = {
    id: idea.id, title: idea.title, category: idea.category,
    price: idea.price, desc: idea.desc, emoji: idea.emoji, rating: idea.rating, views: idea.views,
    boughtDate: new Date().toLocaleDateString('id-ID'),
  }
  purchasedIdeas.unshift(bought)
  localStorage.setItem(getUserKey('purchasedIdeas'), JSON.stringify(purchasedIdeas))
  setTimeout(() => { navigateTo('myideas'); switchMyIdeasTab('purchased') }, 1500)
}

// ─── INIT MODAL LISTENERS ───────────────────────────────────
export function initIdeaModalListeners() {
  document.getElementById('ideaModal')?.addEventListener('click', function (e) {
    if (e.target === this) closeModal()
  })
}
