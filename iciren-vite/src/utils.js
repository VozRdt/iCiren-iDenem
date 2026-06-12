/* ============================================================
   Utility Functions (Toast, Progress Bar, Helpers)
   ============================================================ */

// ─── TOAST ───────────────────────────────────────────────────
export function showToast(message) {
  const toast = document.getElementById('toast')
  if (!toast) return
  toast.textContent = message
  toast.classList.add('show')
  setTimeout(() => toast.classList.remove('show'), 3500)
}

// ─── PROGRESS BAR ────────────────────────────────────────────
export function startProgress() {
  const bar = document.getElementById('nav-progress')
  if (!bar) return
  bar.style.width = '0%'
  bar.classList.add('running')
  void bar.offsetWidth
  bar.style.width = '70%'
}

export function finishProgress() {
  const bar = document.getElementById('nav-progress')
  if (!bar) return
  bar.style.width = '100%'
  setTimeout(() => {
    bar.style.opacity = '0'
    setTimeout(() => {
      bar.style.width = '0%'
      bar.classList.remove('running')
    }, 300)
  }, 200)
}

// ─── TIME AGO ────────────────────────────────────────────────
export function timeAgo(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'Baru saja'
  if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu'
  if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu'
  return Math.floor(diff / 86400) + ' hari lalu'
}
