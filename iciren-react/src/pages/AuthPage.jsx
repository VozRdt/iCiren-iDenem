import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user) navigate('/explore');
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      toast.success('Login berhasil!');
      navigate('/explore');
    } catch (err) {
      toast.error(err.message || 'Login gagal.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Password tidak cocok!');
      return;
    }
    try {
      const { error } = await signUp(email, password, name);
      if (error) throw error;
      toast.success('Pendaftaran berhasil! Silakan login.');
      setActiveTab('login');
    } catch (err) {
      toast.error(err.message || 'Daftar gagal.');
    }
  };

  return (
    <div className="page active" id="page-auth" style={{ display: 'block' }}>
      <section className="auth-section">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <img src="/logo.png" alt="Logo" className="auth-logo" />
              <h2 className="auth-title">Selamat Datang</h2>
              <p className="auth-subtitle">Masuk atau daftar untuk mulai jual beli ide kreatif</p>
            </div>
            
            <div className="auth-tabs">
              <button className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`} onClick={() => setActiveTab('login')}>
                <i className="fas fa-sign-in-alt"></i> Masuk
              </button>
              <button className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`} onClick={() => setActiveTab('register')}>
                <i className="fas fa-user-plus"></i> Daftar
              </button>
            </div>

            {/* LOGIN FORM */}
            <form className="auth-form" onSubmit={handleLogin} style={{ display: activeTab === 'login' ? 'block' : 'none' }}>
              <div className="form-group">
                <label><i className="fas fa-envelope"></i> Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="Masukkan email kamu" required />
              </div>
              <div className="form-group">
                <label><i className="fas fa-lock"></i> Password</label>
                <div className="password-wrapper">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" placeholder="Masukkan password" required />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}><i className="fas fa-eye"></i></button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary auth-submit-btn"><i className="fas fa-sign-in-alt"></i> Masuk Sekarang</button>
              <p className="auth-switch">Belum punya akun? <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('register'); }}>Daftar sekarang</a></p>
            </form>

            {/* REGISTER FORM */}
            <form className="auth-form" onSubmit={handleRegister} style={{ display: activeTab === 'register' ? 'block' : 'none' }}>
              <div className="form-group">
                <label><i className="fas fa-user"></i> Nama Lengkap</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Masukkan nama lengkap" required />
              </div>
              <div className="form-group">
                <label><i className="fas fa-envelope"></i> Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="Masukkan email kamu" required />
              </div>
              <div className="form-group">
                <label><i className="fas fa-lock"></i> Password</label>
                <div className="password-wrapper">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" placeholder="Buat password (min 6 karakter)" minLength="6" required />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}><i className="fas fa-eye"></i></button>
                </div>
              </div>
              <div className="form-group">
                <label><i className="fas fa-lock"></i> Konfirmasi Password</label>
                <div className="password-wrapper">
                  <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="form-input" placeholder="Ulangi password" minLength="6" required />
                  <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}><i className="fas fa-eye"></i></button>
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" required />
                  <span>Saya setuju dengan <a href="#" className="auth-link">Syarat &amp; Ketentuan</a> serta <a href="#" className="auth-link">Kebijakan Privasi</a></span>
                </label>
              </div>
              <button type="submit" className="btn btn-primary auth-submit-btn"><i className="fas fa-user-plus"></i> Daftar Sekarang</button>
              <p className="auth-switch">Sudah punya akun? <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('login'); }}>Masuk di sini</a></p>
            </form>
            
          </div>
          <div className="auth-decoration">
            <div className="auth-deco-card"><div className="auth-deco-icon"><i className="fas fa-lightbulb"></i></div><h3>Jual Ide Kreatifmu</h3><p>Ubah ide brilian menjadi penghasilan. Bergabung dengan 850+ kreator aktif di iCiren iDe'nem.</p></div>
            <div className="auth-deco-card"><div className="auth-deco-icon"><i className="fas fa-shopping-cart"></i></div><h3>Beli Ide Viral</h3><p>Akses ribuan ide konten berkualitas untuk channel kamu. 2.500+ ide tersedia!</p></div>
            <div className="auth-deco-card"><div className="auth-deco-icon"><i className="fas fa-shield-alt"></i></div><h3>Aman & Terpercaya</h3><p>Transaksi dijamin aman dengan perlindungan pembeli dan penjual.</p></div>
          </div>
        </div>
      </section>
    </div>
  );
}
