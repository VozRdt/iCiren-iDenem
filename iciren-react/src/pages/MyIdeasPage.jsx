import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function MyIdeasPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const { data } = await supabase
        .from('ideas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (data) setIdeas(data);
    } catch (e) {
      console.error(e);
      toast.error('Gagal memuat data ide.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="my-idea-status status-approved">✓ Disetujui</span>;
      case 'terjual': return <span className="my-idea-status status-approved">🎉 Terjual</span>;
      case 'rejected': return <span className="my-idea-status status-rejected">❌ Ditolak</span>;
      default: return <span className="my-idea-status status-pending">⏳ Review</span>;
    }
  };

  return (
    <div className="page active" id="page-myideas" style={{ display: 'block' }}>
      <section className="page-hero">
        <div className="container">
          <h1 className="page-hero-title"><i className="fas fa-folder-open"></i> Ide Saya</h1>
          <p className="page-hero-subtitle">Kelola dan pantau semua ide yang telah kamu submit ke iCiren iDe'nem</p>
        </div>
      </section>
      <section className="myideas-section">
        <div className="container">
          <div className="dashboard-stats">
            <div className="dash-stat-card"><div className="dash-stat-icon"><i className="fas fa-lightbulb"></i></div><div className="dash-stat-info"><span className="dash-stat-num">{ideas.length}</span><span className="dash-stat-label">Total Ide</span></div></div>
            <div className="dash-stat-card"><div className="dash-stat-icon"><i className="fas fa-check-circle"></i></div><div className="dash-stat-info"><span className="dash-stat-num">{ideas.filter(i=>i.status==='approved').length}</span><span className="dash-stat-label">Disetujui</span></div></div>
            <div className="dash-stat-card"><div className="dash-stat-icon"><i className="fas fa-money-bill-wave"></i></div><div className="dash-stat-info"><span className="dash-stat-num">Rp 0</span><span className="dash-stat-label">Total Penghasilan</span></div></div>
            <div className="dash-stat-card"><div className="dash-stat-icon"><i className="fas fa-eye"></i></div><div className="dash-stat-info"><span className="dash-stat-num">0</span><span className="dash-stat-label">Total Views</span></div></div>
          </div>
          <div className="myideas-header">
            <h2 className="myideas-title">Daftar Ide Saya</h2>
            <button className="btn btn-primary" onClick={() => navigate('/sell')}><i className="fas fa-plus"></i> Tambah Ide Baru</button>
          </div>
          <div className="myideas-list">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
            ) : ideas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><i className="fas fa-folder-open"></i></div>
                <h3>Belum Ada Ide</h3>
                <p>Kamu belum pernah submit ide apapun. Mulai sekarang dan hasilkan uang dari kreativitasmu!</p>
                <button className="btn btn-primary" onClick={() => navigate('/sell')}><i className="fas fa-lightbulb"></i> Submit Ide Pertamamu</button>
              </div>
            ) : (
              ideas.map(idea => (
                <div key={idea.id} className="my-idea-item">
                  <div className="my-idea-info">
                    <h4>{idea.title}</h4>
                    <span><span style={{textTransform:'capitalize'}}>{idea.category}</span> &bull; {new Date(idea.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                    {getStatusBadge(idea.status)}
                    <span className="my-idea-price">Rp {idea.price.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
