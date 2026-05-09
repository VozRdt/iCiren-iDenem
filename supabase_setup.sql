-- =============================================================
-- iCiren iDe'nem — Supabase Table Setup (Enhanced v2)
-- Jalankan SQL ini di Supabase Dashboard → SQL Editor
-- =============================================================

-- 1. Tabel: ideas (Ide yang dijual user)
CREATE TABLE IF NOT EXISTS ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('youtube','tiktok','instagram','podcast','blog')),
  price INTEGER NOT NULL CHECK (price >= 10000),
  description TEXT NOT NULL,
  tags TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  emoji TEXT DEFAULT '💡',
  views INTEGER DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 0,
  admin_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel: purchases (Ide yang dibeli user)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  idea_id INTEGER NOT NULL,
  idea_title TEXT NOT NULL,
  idea_category TEXT DEFAULT '',
  idea_price INTEGER DEFAULT 0,
  idea_desc TEXT DEFAULT '',
  idea_emoji TEXT DEFAULT '💡',
  idea_rating NUMERIC(2,1) DEFAULT 0,
  idea_views INTEGER DEFAULT 0,
  purchased_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabel: profiles (Profil pengguna - auto-create saat register)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  location TEXT DEFAULT '',
  website TEXT DEFAULT '',
  role TEXT DEFAULT 'user' CHECK (role IN ('user','admin')),
  total_sales INTEGER DEFAULT 0,
  total_earnings INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabel: notifications (Notifikasi user)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('idea_approved','idea_rejected','idea_sold','purchase','system','welcome')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  link_to TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================

-- ─── IDEAS ───────────────────────────────────────────────────
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

-- User bisa SELECT ide miliknya
DROP POLICY IF EXISTS "Users can view own ideas" ON ideas;
CREATE POLICY "Users can view own ideas"
  ON ideas FOR SELECT
  USING (auth.uid() = user_id);

-- SEMUA user bisa melihat ide yang APPROVED (marketplace publik)
DROP POLICY IF EXISTS "Anyone can view approved ideas" ON ideas;
CREATE POLICY "Anyone can view approved ideas"
  ON ideas FOR SELECT
  USING (status = 'approved');

-- User bisa INSERT ide miliknya
DROP POLICY IF EXISTS "Users can insert own ideas" ON ideas;
CREATE POLICY "Users can insert own ideas"
  ON ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User bisa DELETE ide miliknya
DROP POLICY IF EXISTS "Users can delete own ideas" ON ideas;
CREATE POLICY "Users can delete own ideas"
  ON ideas FOR DELETE
  USING (auth.uid() = user_id);

-- User bisa UPDATE ide miliknya
DROP POLICY IF EXISTS "Users can update own ideas" ON ideas;
CREATE POLICY "Users can update own ideas"
  ON ideas FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin bisa SELECT semua ide
DROP POLICY IF EXISTS "Admin can view all ideas" ON ideas;
CREATE POLICY "Admin can view all ideas"
  ON ideas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin bisa UPDATE semua ide (approve/reject)
DROP POLICY IF EXISTS "Admin can update all ideas" ON ideas;
CREATE POLICY "Admin can update all ideas"
  ON ideas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ─── PURCHASES ───────────────────────────────────────────────
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own purchases" ON purchases;
CREATE POLICY "Users can insert own purchases"
  ON purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own purchases" ON purchases;
CREATE POLICY "Users can delete own purchases"
  ON purchases FOR DELETE
  USING (auth.uid() = user_id);

-- ─── PROFILES ────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Semua user bisa lihat profil (publik)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- User hanya bisa update profil sendiri
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- User bisa insert profil sendiri
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ─── NOTIFICATIONS ───────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- System/Admin bisa insert notifikasi
DROP POLICY IF EXISTS "Admin can insert notifications" ON notifications;
CREATE POLICY "Admin can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- =============================================================
-- 5. Tabel: reviews (Rating & ulasan ide)
-- =============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(idea_id, user_id) -- 1 review per user per idea
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Semua user bisa melihat reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

-- User bisa insert review
DROP POLICY IF EXISTS "Users can insert own reviews" ON reviews;
CREATE POLICY "Users can insert own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User bisa update review sendiri
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- User bisa delete review sendiri
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================
-- FUNCTION: Auto-create profile saat user baru register
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));

  -- Kirim notifikasi welcome
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    NEW.id,
    'welcome',
    'Selamat Datang di iCiren iDe''nem! 🎉',
    'Akun kamu sudah aktif. Mulai jelajahi ribuan ide kreatif atau jual idemu sendiri!'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Jalankan function saat user baru dibuat
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

