/* ============================================================
   Sell Form Module
   ============================================================ */
import { supabaseClient } from './supabase.js'
import { showToast } from './utils.js'
import { currentUser } from './auth.js'
import { myIdeas, getUserKey } from './ideas.js'
import { navigateTo } from './navigation.js'
import { userProfile } from './profile.js'

export async function submitIdea(e) {
  e.preventDefault()

  // Validasi Profil Bank
  if (!userProfile || !userProfile.bank_name || !userProfile.account_number || !userProfile.account_name) {
    showToast('Harap lengkapi Profil dan Data Rekening Bank sebelum menjual ide!')
    setTimeout(() => navigateTo('profile'), 1500)
    return
  }

  const title = document.getElementById('ideaTitle').value
  const platform = document.getElementById('ideaPlatform').value
  const category = document.getElementById('ideaCategory').value
  const price = parseInt(document.getElementById('ideaPrice').value)
  const desc = document.getElementById('ideaDesc').value

  const submitBtn = e.target.querySelector('button[type="submit"]')
  if (submitBtn) {
    submitBtn.disabled = true
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...'
  }

  if (supabaseClient && currentUser && currentUser.id) {
    try {
      const { data, error } = await supabaseClient
        .from('ideas')
        .insert({
          user_id: currentUser.id, title, platform, category, price,
          description: desc, status: 'pending',
        })
        .select().single()
      if (error) throw error

      const newIdea = {
        id: data.id, title, platform, category, price, desc,
        status: data.status || 'pending',
        date: new Date(data.created_at).toLocaleDateString('id-ID'),
      }
      myIdeas.unshift(newIdea)
      localStorage.setItem(getUserKey('myIdeas'), JSON.stringify(myIdeas))
      console.log('✅ Idea saved to Supabase:', data.id)
    } catch (e) {
      console.warn('⚠️ DB idea insert error, saving to localStorage:', e)
      const newIdea = {
        id: Date.now(), title, platform, category, price, desc,
        status: 'pending', date: new Date().toLocaleDateString('id-ID'),
      }
      myIdeas.unshift(newIdea)
      localStorage.setItem(getUserKey('myIdeas'), JSON.stringify(myIdeas))
    }
  } else {
    const newIdea = {
      id: Date.now(), title, platform, category, price, desc,
      status: 'pending', date: new Date().toLocaleDateString('id-ID'),
    }
    myIdeas.unshift(newIdea)
    localStorage.setItem(getUserKey('myIdeas'), JSON.stringify(myIdeas))
  }

  document.getElementById('sellForm').reset()
  if (submitBtn) {
    submitBtn.disabled = false
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Ide Sekarang'
  }
  showToast('🎉 Ide berhasil disubmit! Tim kami akan segera mereview.')
  setTimeout(() => navigateTo('myideas'), 1500)
}
