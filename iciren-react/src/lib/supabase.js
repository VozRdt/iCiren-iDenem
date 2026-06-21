import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jalxcruyeixswdritzdd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphbHhjcnV5ZWl4c3dkcml0emRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NjUzMjIsImV4cCI6MjA5MzA0MTMyMn0.DWIZk4gUJZ9Gor8QBIo6hzKHKI9_rKGQ6O9CxhUmJE0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
