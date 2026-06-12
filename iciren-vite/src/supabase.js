/* ============================================================
   Supabase Client Initialization
   ============================================================ */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jalxcruyeixswdritzdd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphbHhjcnV5ZWl4c3dkcml0emRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NjUzMjIsImV4cCI6MjA5MzA0MTMyMn0.DWIZk4gUJZ9Gor8QBIo6hzKHKI9_rKGQ6O9CxhUmJE0'

let supabaseClient = null
try {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  console.log('✅ Supabase client berhasil diinisialisasi.')
} catch (e) {
  console.warn('⚠️ Supabase belum terhubung. Menggunakan mode offline/localStorage.', e)
}

export { supabaseClient }
