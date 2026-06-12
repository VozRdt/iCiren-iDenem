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
-- ⚠️ SECURITY: Direct INSERT dari client DIBLOKIR.
-- Purchase hanya bisa dibuat melalui function process_purchase()
-- yang dipanggil setelah payment terverifikasi.
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

-- ❌ REMOVED: Direct INSERT policy — purchase harus lewat server function
-- DROP POLICY IF EXISTS "Users can insert own purchases" ON purchases;

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

-- =============================================================
-- 6. Tabel: transactions (Audit trail pembayaran)
-- =============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','refunded','expired')),
  payment_method TEXT DEFAULT '',
  payment_gateway TEXT DEFAULT '',          -- 'midtrans', 'xendit', etc.
  gateway_transaction_id TEXT DEFAULT '',   -- ID dari payment gateway
  gateway_order_id TEXT DEFAULT '',         -- Order ID untuk gateway
  gateway_response JSONB DEFAULT '{}',     -- Full response dari gateway
  metadata JSONB DEFAULT '{}',             -- Data tambahan
  paid_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- User hanya bisa lihat transaksi sendiri
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- ❌ No direct INSERT/UPDATE/DELETE dari client
-- Semua operasi transaksi harus lewat server function

-- Admin bisa lihat semua transaksi
DROP POLICY IF EXISTS "Admin can view all transactions" ON transactions;
CREATE POLICY "Admin can view all transactions"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================================
-- FUNCTION: create_payment_intent()
-- Dipanggil dari frontend untuk memulai proses pembayaran
-- Return: transaction_id yang akan dipakai untuk payment gateway
-- =============================================================
CREATE OR REPLACE FUNCTION public.create_payment_intent(
  p_idea_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_idea RECORD;
  v_user_id UUID;
  v_existing_purchase RECORD;
  v_existing_pending RECORD;
  v_transaction_id UUID;
  v_order_id TEXT;
BEGIN
  -- 1. Ambil user ID dari auth session
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Silakan login terlebih dahulu.');
  END IF;

  -- 2. Cek apakah ide ada dan statusnya approved
  SELECT * INTO v_idea FROM ideas WHERE id = p_idea_id AND status = 'approved';
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Ide tidak ditemukan atau belum disetujui.');
  END IF;

  -- 3. Cek apakah user mencoba beli ide sendiri
  IF v_idea.user_id = v_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Kamu tidak bisa membeli ide sendiri.');
  END IF;

  -- 4. Cek apakah sudah pernah dibeli
  SELECT * INTO v_existing_purchase FROM purchases
    WHERE user_id = v_user_id AND idea_id = p_idea_id;
  IF FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Kamu sudah membeli ide ini sebelumnya.');
  END IF;

  -- 5. Cek apakah ada transaksi pending yang masih valid (belum expired)
  SELECT * INTO v_existing_pending FROM transactions
    WHERE user_id = v_user_id
    AND idea_id = p_idea_id
    AND status = 'pending'
    AND (expired_at IS NULL OR expired_at > now());
  IF FOUND THEN
    -- Return existing pending transaction
    RETURN json_build_object(
      'success', true,
      'transaction_id', v_existing_pending.id,
      'order_id', v_existing_pending.gateway_order_id,
      'amount', v_existing_pending.amount,
      'idea_title', v_idea.title,
      'status', 'existing_pending'
    );
  END IF;

  -- 6. Buat transaction baru
  v_order_id := 'ICR-' || EXTRACT(EPOCH FROM now())::BIGINT || '-' || substr(gen_random_uuid()::TEXT, 1, 8);

  INSERT INTO transactions (id, user_id, idea_id, amount, status, gateway_order_id, expired_at)
  VALUES (
    gen_random_uuid(), v_user_id, p_idea_id, v_idea.price, 'pending',
    v_order_id, now() + INTERVAL '24 hours'
  )
  RETURNING id INTO v_transaction_id;

  -- 7. Return data untuk payment gateway
  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'order_id', v_order_id,
    'amount', v_idea.price,
    'idea_title', v_idea.title,
    'idea_category', v_idea.category,
    'idea_emoji', v_idea.emoji,
    'idea_desc', v_idea.description,
    'buyer_id', v_user_id,
    'seller_id', v_idea.user_id,
    'status', 'created'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================
-- FUNCTION: process_purchase()
-- Dipanggil SETELAH payment terverifikasi (dari webhook/server)
-- SECURITY DEFINER = berjalan dengan privilege owner, bukan user
-- =============================================================
CREATE OR REPLACE FUNCTION public.process_purchase(
  p_transaction_id UUID,
  p_payment_method TEXT DEFAULT 'manual',
  p_gateway TEXT DEFAULT '',
  p_gateway_txn_id TEXT DEFAULT ''
)
RETURNS JSON AS $$
DECLARE
  v_txn RECORD;
  v_idea RECORD;
  v_purchase_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  -- 1. Ambil transaksi
  SELECT * INTO v_txn FROM transactions
    WHERE id = p_transaction_id AND user_id = v_user_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Transaksi tidak ditemukan.');
  END IF;

  -- 2. Cek status transaksi
  IF v_txn.status = 'completed' THEN
    RETURN json_build_object('success', false, 'error', 'Transaksi sudah diproses sebelumnya.');
  END IF;

  IF v_txn.status NOT IN ('pending', 'processing') THEN
    RETURN json_build_object('success', false, 'error', 'Status transaksi tidak valid: ' || v_txn.status);
  END IF;

  -- 3. Cek expired
  IF v_txn.expired_at IS NOT NULL AND v_txn.expired_at < now() THEN
    UPDATE transactions SET status = 'expired', updated_at = now() WHERE id = p_transaction_id;
    RETURN json_build_object('success', false, 'error', 'Transaksi sudah expired. Silakan buat transaksi baru.');
  END IF;

  -- 4. Ambil data ide
  SELECT * INTO v_idea FROM ideas WHERE id = v_txn.idea_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Ide tidak ditemukan.');
  END IF;

  -- 5. Double-check: belum pernah dibeli
  IF EXISTS (SELECT 1 FROM purchases WHERE user_id = v_user_id AND idea_id = v_txn.idea_id) THEN
    UPDATE transactions SET status = 'failed', updated_at = now() WHERE id = p_transaction_id;
    RETURN json_build_object('success', false, 'error', 'Ide sudah pernah dibeli.');
  END IF;

  -- 6. UPDATE transaksi → completed
  UPDATE transactions SET
    status = 'completed',
    payment_method = p_payment_method,
    payment_gateway = p_gateway,
    gateway_transaction_id = p_gateway_txn_id,
    paid_at = now(),
    updated_at = now()
  WHERE id = p_transaction_id;

  -- 7. INSERT ke purchases (via SECURITY DEFINER, bypass RLS)
  INSERT INTO purchases (user_id, idea_id, idea_title, idea_category, idea_price, idea_desc, idea_emoji, idea_rating, idea_views)
  VALUES (
    v_user_id, v_idea.id, v_idea.title, v_idea.category, v_idea.price,
    v_idea.description, COALESCE(v_idea.emoji, '💡'),
    COALESCE(v_idea.rating, 0), COALESCE(v_idea.views, 0)
  )
  RETURNING id INTO v_purchase_id;

  -- 8. Update seller stats
  UPDATE profiles SET
    total_sales = total_sales + 1,
    total_earnings = total_earnings + v_idea.price,
    updated_at = now()
  WHERE id = v_idea.user_id;

  -- 9. Kirim notifikasi ke seller
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    v_idea.user_id,
    'idea_sold',
    '💰 Ide Terjual!',
    'Ide "' || v_idea.title || '" telah dibeli! Penghasilan +Rp ' || v_idea.price || '.'
  );

  -- 10. Kirim notifikasi ke buyer
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    v_user_id,
    'purchase',
    '🛒 Pembelian Berhasil!',
    'Kamu berhasil membeli ide "' || v_idea.title || '". Cek di Ide Saya → Dibeli.'
  );

  RETURN json_build_object(
    'success', true,
    'purchase_id', v_purchase_id,
    'transaction_id', p_transaction_id,
    'idea_title', v_idea.title,
    'amount', v_idea.price
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

