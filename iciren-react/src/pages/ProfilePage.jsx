import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, profile, setProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    location: '',
    website: '',
    bank_name: '',
    account_number: '',
    account_name: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        location: profile.location || '',
        website: profile.website || '',
        bank_name: profile.bank_name || '',
        account_number: profile.account_number || '',
        account_name: profile.account_name || ''
      });
    }
  }, [user, profile, navigate]);

  useEffect(() => {
    if (location.hash === '#bank-info') {
      const element = document.getElementById('bank-info');
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [location.hash]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          location: formData.location,
          website: formData.website,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) throw error;
      setProfile(data);
      toast.success('Profil berhasil disimpan!');
    } catch (err) {
      toast.error('Gagal menyimpan profil.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          bank_name: formData.bank_name,
          account_number: formData.account_number,
          account_name: formData.account_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) throw error;
      setProfile(data);
      toast.success('Informasi bank berhasil disimpan!');
    } catch (err) {
      toast.error('Gagal menyimpan bank.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile) return null;

  return (
    <div className="page active" id="page-profile" style={{ display: 'block' }}>
      <section className="page-hero">
        <div className="container">
          <h1 className="page-hero-title"><i className="fas fa-user-circle"></i> Profil Saya</h1>
          <p className="page-hero-subtitle">Kelola informasi profil dan lihat statistik akunmu</p>
        </div>
      </section>
      <section className="profile-section">
        <div className="container">
          <div className="profile-layout">
            <div className="profile-card-wrapper">
              <div className="profile-card">
                <div className="profile-avatar-large">
                  <span>{profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}</span>
                  <div className="avatar-overlay"><i className="fas fa-camera"></i></div>
                </div>
                <h2 className="profile-name">{profile.full_name || user.email}</h2>
                <p className="profile-email">{user.email}</p>
                <div className="profile-role-badge"><i className="fas fa-user"></i> {profile.role === 'admin' ? 'Admin' : 'Member'}</div>
                
                {profile.role === 'admin' && (
                  <button className="btn btn-outline" style={{width:'100%', marginTop:'1rem'}} onClick={() => navigate('/admin')}>
                    <i className="fas fa-shield-alt"></i> Admin Dashboard
                  </button>
                )}
                
                <div className="profile-stats-mini">
                  <div className="profile-stat-mini"><span className="psm-num">0</span><span className="psm-label">Ide Dijual</span></div>
                  <div className="profile-stat-mini"><span className="psm-num">0</span><span className="psm-label">Ide Terjual</span></div>
                </div>
                <div className="wallet-card" style={{ textAlign: 'center' }}>
                  <p className="wallet-label" style={{ color: '#a3a3a3', fontSize: '0.95rem', marginBottom: '0.5rem' }}>Saldo Penghasilan</p>
                  <h3 className="wallet-balance" style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.2rem', color: '#f8fafc' }}>Rp {(profile.total_earnings || 0).toLocaleString('id-ID')}</h3>
                  <button className="btn btn-primary" style={{ width: '100%', padding: '0.8rem 1rem', fontSize: '0.95rem', fontWeight: '600' }} onClick={() => navigate('/wallet')}>
                    <i className="fas fa-wallet"></i> Cek Saldo & Penarikan
                  </button>
                </div>
              </div>
            </div>
            <div className="profile-form-wrapper">
              <div className="form-card">
                <h2 className="form-title">Edit Profil</h2>
                <form id="profileForm" onSubmit={handleSaveProfile}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="full_name">Nama Lengkap</label>
                      <input type="text" id="full_name" className="form-input" required value={formData.full_name} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Nomor WhatsApp</label>
                      <input type="tel" id="phone" className="form-input" value={formData.phone} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="location">Lokasi / Domisili</label>
                    <input type="text" id="location" className="form-input" value={formData.location} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="website">Website / Link Portfolio</label>
                    <input type="url" id="website" className="form-input" placeholder="https://" value={formData.website} onChange={handleChange} />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>Simpan Profil</button>
                </form>
              </div>
              <div className="form-card" id="bank-info" style={{ marginTop: '2rem' }}>
                <h2 className="form-title">Informasi Rekening Bank</h2>
                <form id="bankForm" onSubmit={handleSaveBank}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="bank_name">Nama Bank <span className="required">*</span></label>
                      <input type="text" id="bank_name" className="form-input" placeholder="Contoh: BCA / Mandiri / BNI" required value={formData.bank_name} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="account_number">Nomor Rekening <span className="required">*</span></label>
                      <input type="text" id="account_number" className="form-input" required value={formData.account_number} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="account_name">Nama Pemilik Rekening <span className="required">*</span></label>
                    <input type="text" id="account_name" className="form-input" required value={formData.account_name} onChange={handleChange} />
                    <small style={{ color: '#a3a3a3', marginTop: '5px', display: 'block' }}>* Nama pemilik rekening harus sesuai dengan nama profil untuk keamanan penarikan dana.</small>
                    <small style={{ color: '#a3a3a3', marginTop: '5px', display: 'block' }}>* Data rekening digunakan untuk penarikan tunai.</small>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>Simpan Rekening Bank</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
