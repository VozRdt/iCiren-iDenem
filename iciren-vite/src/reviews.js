/* ============================================================
   Review & Rating System Module
   ============================================================ */
import { supabaseClient } from './supabase.js'
import { showToast, timeAgo } from './utils.js'
import { currentUser, isLoggedIn } from './auth.js'

export let selectedStarRating = 0

export function setStarRating(n) {
  selectedStarRating = n
  const stars = document.querySelectorAll('#starSelector i')
  stars.forEach((s, i) => {
    s.classList.toggle('active', i < n)
  })
}

export async function loadReviews(ideaId) {
  const list = document.getElementById('reviewList')
  if (!list) return
  let reviews = []

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('reviews').select('*, profiles(full_name)').eq('idea_id', ideaId)
        .order('created_at', { ascending: false }).limit(10)
      if (!error && data) reviews = data
    } catch (e) { console.warn('Review load error:', e) }
  }

  if (!reviews.length) {
    reviews = JSON.parse(localStorage.getItem('reviews_' + ideaId) || '[]')
  }

  if (reviews.length === 0) {
    list.innerHTML = '<div class="review-empty"><i class="fas fa-comment-dots" style="margin-right:0.4rem;"></i> Belum ada ulasan. Jadilah yang pertama!</div>'
    return
  }

  list.innerHTML = reviews.map(r => {
    const name = r.profiles?.full_name || r.author || 'Anonim'
    const initial = name.charAt(0).toUpperCase()
    const starsHtml = '<i class="fas fa-star"></i>'.repeat(r.rating) + '<i class="far fa-star"></i>'.repeat(5 - r.rating)
    const ago = timeAgo(r.created_at)
    return `<div class="review-card">
      <div class="review-card-header">
        <div class="review-author">
          <div class="review-avatar">${initial}</div>
          <span class="review-author-name">${name}</span>
        </div>
        <div class="review-stars">${starsHtml}</div>
      </div>
      ${r.comment ? `<p class="review-comment">${r.comment}</p>` : ''}
      <div class="review-time">${ago}</div>
    </div>`
  }).join('')
}

export async function submitReview(ideaId) {
  if (!isLoggedIn()) {
    showToast('⚠️ Login terlebih dahulu untuk memberi ulasan.')
    return
  }
  if (selectedStarRating === 0) {
    showToast('⚠️ Pilih rating bintang terlebih dahulu.')
    return
  }

  const comment = document.getElementById('reviewComment')?.value?.trim() || ''
  const review = {
    idea_id: ideaId, user_id: currentUser.id, rating: selectedStarRating,
    comment, created_at: new Date().toISOString(),
    author: currentUser.name || currentUser.email?.split('@')[0] || 'User',
  }

  if (supabaseClient && currentUser.id) {
    try {
      const { error } = await supabaseClient.from('reviews').upsert({
        idea_id: ideaId, user_id: currentUser.id, rating: selectedStarRating, comment,
      }, { onConflict: 'idea_id,user_id' })
      if (error) throw error
    } catch (e) { console.warn('Review submit error:', e) }
  }

  const key = 'reviews_' + ideaId
  const stored = JSON.parse(localStorage.getItem(key) || '[]')
  const existing = stored.findIndex(r => r.user_id === currentUser.id)
  if (existing >= 0) stored[existing] = review
  else stored.unshift(review)
  localStorage.setItem(key, JSON.stringify(stored))

  selectedStarRating = 0
  setStarRating(0)
  const commentEl = document.getElementById('reviewComment')
  if (commentEl) commentEl.value = ''

  showToast('⭐ Ulasan berhasil dikirim!')
  loadReviews(ideaId)
}
