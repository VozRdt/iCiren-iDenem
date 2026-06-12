/* ============================================================
   User Profile Module
   ============================================================ */
import { supabaseClient } from './supabase.js'
import { showToast } from './utils.js'
import { currentUser, updateAuthUI, setCurrentUser } from './auth.js'
import { getUserKey } from './ideas.js'
import { navigateTo } from './navigation.js'

export let userProfile = null

export async function loadProfile() {
  if (supabaseClient && currentUser && currentUser.id) {
    try {
      const { data, error } = await supabaseClient
        .from('profiles').select('*').eq('id', currentUser.id).single()
      if (!error && data) {
        userProfile = data
        localStorage.setItem(getUserKey('profile'), JSON.stringify(data))
        return
      }
    } catch (e) { console.warn('Profile load error:', e) }
  }
  userProfile = JSON.parse(localStorage.getItem(getUserKey('profile')) || 'null')
}

export function renderProfile() {
  loadProfile().then(() => {
    const name = userProfile?.full_name || currentUser?.name || 'User'
    const email = currentUser?.email || ''
    const role = userProfile?.role || 'user'
    const avatar = document.getElementById('profileAvatarLarge')
    if (avatar) avatar.textContent = name.charAt(0).toUpperCase()
    const nameEl = document.getElementById('profileName')
    if (nameEl) nameEl.textContent = name
    const emailEl = document.getElementById('profileEmail')
    if (emailEl) emailEl.textContent = email
    const roleBadge = document.getElementById('profileRoleBadge')
    if (roleBadge) {
      roleBadge.innerHTML = role === 'admin'
        ? '<i class="fas fa-shield-alt"></i> Admin'
        : '<i class="fas fa-user"></i> Member'
    }
    const adminBtn = document.getElementById('profileAdminBtn')
    if (adminBtn) adminBtn.style.display = role === 'admin' ? 'inline-flex' : 'none'

    const ideas = JSON.parse(localStorage.getItem(getUserKey('myIdeas')) || '[]')
    const purchases = JSON.parse(localStorage.getItem(getUserKey('purchasedIdeas')) || '[]')
    const totalIdeasEl = document.getElementById('profileTotalIdeas')
    if (totalIdeasEl) totalIdeasEl.textContent = ideas.length
    const totalPurchasesEl = document.getElementById('profileTotalPurchases')
    if (totalPurchasesEl) totalPurchasesEl.textContent = purchases.length
    const earnings = ideas.filter(i => i.status === 'approved').reduce((s, i) => s + i.price, 0)
    const totalEarningsEl = document.getElementById('profileTotalEarnings')
    if (totalEarningsEl) totalEarningsEl.textContent = 'Rp ' + earnings.toLocaleString('id-ID')

    const joined = userProfile?.joined_at ? new Date(userProfile.joined_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'
    const joinedEl = document.getElementById('profileJoined')
    if (joinedEl) joinedEl.innerHTML = '<i class="fas fa-calendar-alt"></i> Bergabung: ' + joined

    const formName = document.getElementById('profileFormName')
    if (formName) formName.value = userProfile?.full_name || name
    const formBio = document.getElementById('profileFormBio')
    if (formBio) formBio.value = userProfile?.bio || ''
    const formPhone = document.getElementById('profileFormPhone')
    if (formPhone) formPhone.value = userProfile?.phone || ''
    const formLocation = document.getElementById('profileFormLocation')
    if (formLocation) formLocation.value = userProfile?.location || ''
    const formWebsite = document.getElementById('profileFormWebsite')
    if (formWebsite) formWebsite.value = userProfile?.website || ''
    
    // Bank
    const formBankName = document.getElementById('profileFormBankName')
    if (formBankName) formBankName.value = userProfile?.bank_name || ''
    const formAccNum = document.getElementById('profileFormAccountNumber')
    if (formAccNum) formAccNum.value = userProfile?.account_number || ''
    const formAccName = document.getElementById('profileFormAccountName')
    if (formAccName) formAccName.value = userProfile?.account_name || ''
  })
}

export async function saveProfile(e) {
  e.preventDefault()
  const btn = document.getElementById('profileSaveBtn')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...'

  const updates = {
    full_name: document.getElementById('profileFormName').value.trim(),
    bio: document.getElementById('profileFormBio').value.trim(),
    phone: document.getElementById('profileFormPhone').value.trim(),
    location: document.getElementById('profileFormLocation').value.trim(),
    website: document.getElementById('profileFormWebsite').value.trim(),
    bank_name: document.getElementById('profileFormBankName')?.value.trim() || '',
    account_number: document.getElementById('profileFormAccountNumber')?.value.trim() || '',
    account_name: document.getElementById('profileFormAccountName')?.value.trim() || '',
    updated_at: new Date().toISOString(),
  }

  if (supabaseClient && currentUser) {
    try {
      const { error } = await supabaseClient.from('profiles').update(updates).eq('id', currentUser.id)
      if (error) throw error
    } catch (e) { console.warn('Profile save error:', e) }
  }

  userProfile = { ...userProfile, ...updates }
  localStorage.setItem(getUserKey('profile'), JSON.stringify(userProfile))
  currentUser.name = updates.full_name
  localStorage.setItem('iciren_user', JSON.stringify(currentUser))
  updateAuthUI()

  btn.disabled = false
  btn.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan'
  showToast('✅ Profil berhasil disimpan!')
  renderProfile()
}

// ─── WITHDRAWAL ──────────────────────────────────────────────
export function openWithdrawModal() {
  if (!userProfile || !userProfile.bank_name || !userProfile.account_number) {
    showToast('Silakan lengkapi data Rekening Bank di profil Anda terlebih dahulu.')
    return
  }

  const ideas = JSON.parse(localStorage.getItem(getUserKey('myIdeas')) || '[]')
  // Menghitung penghasilan, asumsikan 80% dari ide terjual atau dari total_earnings profile
  let earnings = userProfile.total_earnings || 0
  if (!earnings) {
     // fallback
     earnings = ideas.filter(i => i.status === 'approved').reduce((s, i) => s + i.price, 0)
  }

  const balEl = document.getElementById('withdrawAvailableBalance')
  if (balEl) balEl.textContent = 'Rp ' + earnings.toLocaleString('id-ID')
  
  const bankInfo = document.getElementById('withdrawBankInfo')
  if (bankInfo) bankInfo.innerHTML = `Mentransfer ke: <strong>${userProfile.bank_name} - ${userProfile.account_number} (${userProfile.account_name})</strong>`

  document.getElementById('withdrawModal').classList.add('show')
}

export function closeWithdrawModal() {
  document.getElementById('withdrawModal').classList.remove('show')
}

export async function submitWithdraw(e) {
  e.preventDefault()
  const amount = parseInt(document.getElementById('withdrawAmount').value)
  const ideas = JSON.parse(localStorage.getItem(getUserKey('myIdeas')) || '[]')
  let earnings = userProfile.total_earnings || ideas.filter(i => i.status === 'approved').reduce((s, i) => s + i.price, 0)

  if (amount > earnings) {
    showToast('❌ Saldo tidak mencukupi untuk penarikan sebesar Rp ' + amount.toLocaleString('id-ID'))
    return
  }

  const btn = document.getElementById('withdrawSubmitBtn')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...'

  if (supabaseClient && currentUser) {
    try {
      const { error } = await supabaseClient.from('withdrawals').insert({
        user_id: currentUser.id,
        amount: amount,
        bank_name: userProfile.bank_name,
        account_number: userProfile.account_number,
        account_name: userProfile.account_name,
        status: 'pending'
      })
      if (error) throw error
    } catch (err) {
      console.error('Withdraw error:', err)
      btn.disabled = false
      btn.innerHTML = 'Tarik Sekarang'
      showToast('❌ Gagal mengajukan penarikan.')
      return
    }
  }

  // Update profil lokal untuk mengurangi total earnings
  if (userProfile) {
    userProfile.total_earnings = earnings - amount
    localStorage.setItem(getUserKey('profile'), JSON.stringify(userProfile))
  }

  btn.disabled = false
  btn.innerHTML = 'Tarik Sekarang'
  closeWithdrawModal()
  showToast('✅ Permintaan penarikan berhasil diajukan dan sedang diproses.')
  renderProfile()
}
