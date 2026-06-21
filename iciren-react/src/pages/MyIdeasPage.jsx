import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { IdeaModal } from '../components/ui/IdeaModal';

export default function MyIdeasPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [ideas, setIdeas] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [activeTab, setActiveTab] = useState('submitted');
  const [loading, setLoading] = useState(true);
  
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [isPurchasedModal, setIsPurchasedModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [ideasRes, purchRes] = await Promise.all([
        supabase.from('ideas').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('purchases').select('*').eq('user_id', user.id).order('purchased_at', { ascending: false })
      ]);
        
      if (ideasRes.data) setIdeas(ideasRes.data);
      if (purchRes.data) setPurchases(purchRes.data);
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

  const handleDeleteIdea = async (id) => {
    if (window.confirm('Yakin ingin menghapus ide ini?')) {
      try {
        const { error } = await supabase.from('ideas').delete().eq('id', id);
        if (!error) {
          setIdeas(ideas.filter(i => i.id !== id));
          toast.success('Ide berhasil dihapus');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeletePurchase = async (id) => {
    if (window.confirm('Yakin ingin menghapus riwayat pembelian ini?')) {
      try {
        const { error } = await supabase.from('purchases').delete().eq('id', id);
        if (!error) {
          setPurchases(purchases.filter(i => i.id !== id));
          toast.success('Riwayat pembelian dihapus');
        }
      } catch (err) {
        console.error(err);
      }
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
            <div className="dash-stat-card"><div className="dash-stat-icon"><i className="fas fa-check-circle"></i></div><div className="dash-stat-info"><span className="dash-stat-num">{ideas.filter(i=>i.status==='approved' || i.status === 'terjual').length}</span><span className="dash-stat-label">Disetujui</span></div></div>
            <div className="dash-stat-card"><div className="dash-stat-icon"><i className="fas fa-money-bill-wave"></i></div><div className="dash-stat-info"><span className="dash-stat-num">Rp 0</span><span className="dash-stat-label">Total Penghasilan</span></div></div>
            <div className="dash-stat-card"><div className="dash-stat-icon"><i className="fas fa-eye"></i></div><div className="dash-stat-info"><span className="dash-stat-num">{purchases.length}</span><span className="dash-stat-label">Ide Dibeli</span></div></div>
          </div>
          
          <div id="myideas-tabs" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', marginTop: '2rem' }}>
            <button 
              className={`filter-tab myideas-tab ${activeTab === 'submitted' ? 'active' : ''}`} 
              onClick={() => setActiveTab('submitted')}
            >
              <i className="fas fa-paper-plane"></i> Disubmit ({ideas.length})
            </button>
            <button 
              className={`filter-tab myideas-tab ${activeTab === 'purchased' ? 'active' : ''}`} 
              onClick={() => setActiveTab('purchased')}
            >
              <i className="fas fa-shopping-bag"></i> Dibeli ({purchases.length})
            </button>
          </div>

          <div className="myideas-header">
            <h2 className="myideas-title">{activeTab === 'submitted' ? 'Daftar Ide Saya' : 'Ide Yang Dibeli'}</h2>
            {activeTab === 'submitted' && (
              <button className="btn btn-primary" onClick={() => navigate('/sell')}><i className="fas fa-plus"></i> Tambah Ide Baru</button>
            )}
          </div>
          
          <div className="myideas-list">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
            ) : activeTab === 'submitted' ? (
              ideas.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><i className="fas fa-paper-plane"></i></div>
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
                      <button className="btn btn-outline btn-sm" onClick={() => { setSelectedIdea(idea); setIsPurchasedModal(false); }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <i className="fas fa-eye"></i> Lihat
                      </button>
                      <button onClick={() => handleDeleteIdea(idea.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', padding: '0.4rem 0.8rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : (
              purchases.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><i className="fas fa-shopping-bag"></i></div>
                  <h3>Belum Ada Ide Dibeli</h3>
                  <p>Kamu belum membeli ide apapun. Jelajahi ribuan ide kreatif sekarang!</p>
                  <button className="btn btn-primary" onClick={() => navigate('/explore')}><i className="fas fa-compass"></i> Jelajahi Ide</button>
                </div>
              ) : (
                purchases.map(idea => (
                  <div key={idea.id} className="my-idea-item">
                    <div style={{ fontSize: '2rem', flexShrink: 0 }}>{idea.idea_emoji || '💡'}</div>
                    <div className="my-idea-info">
                      <h4>{idea.idea_title}</h4>
                      <span><span style={{textTransform:'capitalize'}}>{idea.idea_category}</span> &bull; Dibeli {new Date(idea.purchased_at).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                      <span className="my-idea-status status-approved">✓ Dimiliki</span>
                      <span className="my-idea-price">Rp {idea.idea_price?.toLocaleString('id-ID') || 0}</span>
                      <button className="btn btn-outline btn-sm" onClick={() => { setSelectedIdea(idea); setIsPurchasedModal(true); }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <i className="fas fa-eye"></i> Lihat
                      </button>
                      <button onClick={() => handleDeletePurchase(idea.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', padding: '0.4rem 0.8rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </section>

      <IdeaModal 
        idea={selectedIdea} 
        isOpen={selectedIdea !== null} 
        onClose={() => setSelectedIdea(null)} 
        isPurchased={isPurchasedModal || (selectedIdea && selectedIdea.user_id === user?.id)} 
      />
    </div>
  );
}
