-- =============================================================
-- iCiren iDe'nem — Supabase Table Setup
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

-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- User hanya bisa akses data milik mereka sendiri
-- =============================================================

-- Enable RLS pada tabel ideas
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

-- Policy: User bisa SELECT ide miliknya
CREATE POLICY "Users can view own ideas"
  ON ideas FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: User bisa INSERT ide miliknya
CREATE POLICY "Users can insert own ideas"
  ON ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: User bisa DELETE ide miliknya
CREATE POLICY "Users can delete own ideas"
  ON ideas FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: User bisa UPDATE ide miliknya
CREATE POLICY "Users can update own ideas"
  ON ideas FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable RLS pada tabel purchases
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Policy: User bisa SELECT pembelian miliknya
CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: User bisa INSERT pembelian miliknya
CREATE POLICY "Users can insert own purchases"
  ON purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: User bisa DELETE pembelian miliknya
CREATE POLICY "Users can delete own purchases"
  ON purchases FOR DELETE
  USING (auth.uid() = user_id);
