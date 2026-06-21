import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function SellPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    platform: '',
    category: '',
    price: '',
    description: '',
    content: ''
  });

  useEffect(() => {
    if (!user) {
      toast.error('Silakan login terlebih dahulu untuk menjual ide.');
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    const name = id.replace('idea', '').toLowerCase(); // ideaTitle -> title
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'platform' ? { category: value } : {}) // Keep backward compatibility
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!profile || !profile.bank_name || !profile.account_number || !profile.account_name) {
      toast.error('Harap lengkapi Profil dan Data Rekening Bank sebelum menjual ide!');
      navigate('/profile');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('ideas')
        .insert({
          user_id: user.id,
          title: formData.title,
          platform: formData.platform,
          category: formData.category,
          price: parseInt(formData.price),
          description: formData.description,
          content: formData.content,
          status: 'pending',
        });
        
      if (error) throw error;

      toast.success('🎉 Ide berhasil disubmit! Tim kami akan segera mereview.');
      navigate('/myideas');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mensubmit ide. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="page active" id="page-sell" style={{ display: 'block' }}>
      <section className="page-hero">
        <div className="container">
          <h1 className="page-hero-title"><i className="fas fa-lightbulb"></i> Jual Ide</h1>
          <p className="page-hero-subtitle">Ubah ide kreatifmu menjadi penghasilan nyata. Bergabung dengan ribuan penjual sukses kami!</p>
        </div>
      </section>
      <section className="sell-section">
        <div className="container">
          <div className="sell-layout">
            <div className="sell-form-wrapper">
              <div className="form-card">
                <h2 className="form-title"><i className="fas fa-plus-circle"></i> Submit Ide Baru</h2>
                <form id="sellForm" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="ideaTitle">Judul Ide <span className="required">*</span></label>
                    <input type="text" id="ideaTitle" className="form-input" placeholder="Contoh: 10 Rahasia Viral TikTok yang Jarang Diketahui" required value={formData.title} onChange={handleChange} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="ideaPlatform">Platform <span className="required">*</span></label>
                      <select id="ideaPlatform" className="form-input" required value={formData.platform} onChange={handleChange}>
                        <option value="">Pilih Platform</option>
                        <option value="youtube">YouTube</option>
                        <option value="tiktok">TikTok</option>
                        <option value="instagram">Instagram</option>
                        <option value="podcast">Podcast</option>
                        <option value="blog">Blog</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="ideaCategory">Kategori <span className="required">*</span></label>
                      <select id="ideaCategory" className="form-input" required value={formData.category} onChange={handleChange}>
                        <option value="">Pilih Kategori</option>
                        <option value="makanan">Makanan</option>
                        <option value="review">Review</option>
                        <option value="pendidikan">Pendidikan</option>
                        <option value="kesehatan">Kesehatan</option>
                        <option value="lainnya">Lainnya</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="ideaPrice">Harga (Rp) <span className="required">*</span></label>
                      <input type="number" id="ideaPrice" className="form-input" placeholder="50000" min="10000" required value={formData.price} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="ideaDesc">Deskripsi Singkat (Publik) <span className="required">*</span></label>
                    <textarea id="ideaDesc" className="form-input form-textarea" rows="3" placeholder="Jelaskan ide kontenmu secara singkat (teaser)..." required value={formData.description} onChange={handleChange}></textarea>
                  </div>
                  <div className="form-group">
                    <label htmlFor="ideaContent">Isi Ide (Rahasia - Hanya untuk Pembeli) <span className="required">*</span></label>
                    <textarea id="ideaContent" className="form-input form-textarea" rows="6" placeholder="Tuliskan detail rahasia idemu di sini (script, konsep detail, hashtag rahasia, dll)..." required value={formData.content} onChange={handleChange}></textarea>
                  </div>
                  <div style={{ marginBottom: '1rem', padding: '0.8rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', fontSize: '0.85rem', color: '#FCD34D' }}>
                    <i className="fas fa-info-circle"></i> <strong>Perhatian:</strong> Terdapat potongan <strong>Service Fee sebesar 15%</strong> dari harga ide untuk pemeliharaan platform saat idemu terjual.
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                    <i className="fas fa-paper-plane"></i> {loading ? 'Submitting...' : 'Submit Ide Sekarang'}
                  </button>
                </form>
              </div>
            </div>
            <div className="sell-benefits">
              <div className="sell-benefit-card"><div className="sb-icon"><i className="fas fa-money-bill-wave"></i></div><h3>Penghasilan Menarik</h3><p>Dapatkan 85% dari setiap penjualan ideamu langsung ke rekeningmu.</p></div>
              <div className="sell-benefit-card"><div className="sb-icon"><i className="fas fa-users"></i></div><h3>Jangkauan Luas</h3><p>Idemu akan dilihat oleh ribuan kreator aktif setiap harinya.</p></div>
              <div className="sell-benefit-card"><div className="sb-icon"><i className="fas fa-star"></i></div><h3>Bangun Reputasi</h3><p>Kumpulkan rating dan review positif untuk meningkatkan kepercayaan.</p></div>
              <div className="sell-benefit-card"><div className="sb-icon"><i className="fas fa-chart-bar"></i></div><h3>Statistik Lengkap</h3><p>Pantau performa penjualan idemu secara real-time dengan dashboard.</p></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
