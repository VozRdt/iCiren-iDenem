import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [adminMode, setAdminMode] = useState('ideas'); // 'ideas' or 'withdrawals'
  const [ideasTab, setIdeasTab] = useState('pending'); // 'pending', 'approved', 'rejected', 'all'
  const [wdTab, setWdTab] = useState('pending'); // 'pending', 'completed', 'rejected'
  
  const [ideas, setIdeas] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchAdminData();
  }, [user, profile, navigate]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const { data: ideasData } = await supabase
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: false });
        
      const { data: wdData } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (ideasData) setIdeas(ideasData);
      if (wdData) setWithdrawals(wdData);
    } catch (e) {
      console.error(e);
      toast.error('Gagal memuat data admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveIdea = async (id) => {
    try {
      const { error } = await supabase.from('ideas').update({ status: 'approved' }).eq('id', id);
      if (error) throw error;
      toast.success('Ide berhasil disetujui!');
      setIdeas(ideas.map(i => i.id === id ? { ...i, status: 'approved' } : i));
    } catch (e) {
      toast.error('Gagal menyetujui ide.');
    }
  };

  const handleRejectIdea = async (id) => {
    const note = prompt('Catatan penolakan (opsional):');
    if (note === null) return;
    try {
      const { error } = await supabase.from('ideas').update({ status: 'rejected', admin_note: note }).eq('id', id);
      if (error) throw error;
      toast.success('Ide berhasil ditolak.');
      setIdeas(ideas.map(i => i.id === id ? { ...i, status: 'rejected' } : i));
    } catch (e) {
      toast.error('Gagal menolak ide.');
    }
  };

  const filteredIdeas = ideas.filter(i => ideasTab === 'all' || i.status === ideasTab);
  const filteredWithdrawals = withdrawals.filter(w => w.status === wdTab);

  if (!profile || profile.role !== 'admin') return null;

  return (
    <div className="page active" id="page-admin" style={{ display: 'block' }}>
      <section className="page-hero">
        <div className="container">
          <h1 className="page-hero-title"><i className="fas fa-shield-alt"></i> Admin Dashboard</h1>
          <p className="page-hero-subtitle">Kelola dan review ide yang disubmit oleh pengguna</p>
        </div>
      </section>
      <section className="admin-section">
        <div className="container">
          <div className="admin-mode-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
            <button className={`btn ${adminMode === 'ideas' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setAdminMode('ideas')}>
              <i className="fas fa-lightbulb"></i> Review Ide
            </button>
            <button className={`btn ${adminMode === 'withdrawals' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setAdminMode('withdrawals')}>
              <i className="fas fa-money-check-alt"></i> Penarikan Dana
            </button>
          </div>

          {adminMode === 'ideas' && (
            <div id="adminModeIdeas">
              <div className="dashboard-stats">
                <div className="dash-stat-card"><div className="dash-stat-icon" style={{background: 'linear-gradient(135deg, #F59E0B, #FBBF24)'}}><i className="fas fa-clock"></i></div><div className="dash-stat-info"><span className="dash-stat-num">{ideas.filter(i=>i.status==='pending').length}</span><span className="dash-stat-label">Menunggu Review</span></div></div>
                <div className="dash-stat-card"><div className="dash-stat-icon" style={{background: 'linear-gradient(135deg, #10b981, #34d399)'}}><i className="fas fa-check-circle"></i></div><div className="dash-stat-info"><span className="dash-stat-num">{ideas.filter(i=>i.status==='approved').length}</span><span className="dash-stat-label">Disetujui</span></div></div>
                <div className="dash-stat-card"><div className="dash-stat-icon" style={{background: 'linear-gradient(135deg, #ef4444, #f87171)'}}><i className="fas fa-times-circle"></i></div><div className="dash-stat-info"><span className="dash-stat-num">{ideas.filter(i=>i.status==='rejected').length}</span><span className="dash-stat-label">Ditolak</span></div></div>
                <div className="dash-stat-card"><div className="dash-stat-icon" style={{background: 'linear-gradient(135deg, #6366f1, #818cf8)'}}><i className="fas fa-users"></i></div><div className="dash-stat-info"><span className="dash-stat-num">{ideas.length}</span><span className="dash-stat-label">Total Ide</span></div></div>
              </div>
              <div className="admin-tabs">
                <button className={`filter-tab admin-tab ${ideasTab === 'pending' ? 'active' : ''}`} onClick={() => setIdeasTab('pending')}><i className="fas fa-clock"></i> Pending</button>
                <button className={`filter-tab admin-tab ${ideasTab === 'approved' ? 'active' : ''}`} onClick={() => setIdeasTab('approved')}><i className="fas fa-check"></i> Approved</button>
                <button className={`filter-tab admin-tab ${ideasTab === 'rejected' ? 'active' : ''}`} onClick={() => setIdeasTab('rejected')}><i className="fas fa-times"></i> Rejected</button>
                <button className={`filter-tab admin-tab ${ideasTab === 'all' ? 'active' : ''}`} onClick={() => setIdeasTab('all')}><i className="fas fa-list"></i> Semua</button>
              </div>
              <div className="admin-ideas-list">
                {loading ? <div style={{textAlign:'center', padding:'2rem'}}>Loading...</div> : filteredIdeas.length === 0 ? (
                  <div className="empty-state"><div className="empty-icon"><i className="fas fa-inbox"></i></div><h3>Tidak Ada Ide</h3><p>Belum ada ide dengan status ini.</p></div>
                ) : filteredIdeas.map(idea => (
                  <div key={idea.id} className="admin-idea-card">
                    <div className="admin-idea-info">
                      <h4>{idea.title}</h4>
                      <div className="admin-idea-meta">
                        <span style={{textTransform:'capitalize'}}><i className="fas fa-tag"></i> {idea.category}</span>
                        <span><i className="fas fa-money-bill"></i> Rp {idea.price.toLocaleString('id-ID')}</span>
                        <span><i className="fas fa-calendar"></i> {new Date(idea.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                      <p className="admin-idea-desc">{idea.description}</p>
                    </div>
                    <div className="admin-idea-actions">
                      <button className="admin-btn admin-btn-view" onClick={() => alert('View Detail')}><i className="fas fa-eye"></i> Detail</button>
                      {idea.status === 'pending' && (
                        <>
                          <button className="admin-btn admin-btn-approve" onClick={() => handleApproveIdea(idea.id)}><i className="fas fa-check"></i> Approve</button>
                          <button className="admin-btn admin-btn-reject" onClick={() => handleRejectIdea(idea.id)}><i className="fas fa-times"></i> Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminMode === 'withdrawals' && (
            <div id="adminModeWithdrawals">
              <div className="admin-tabs">
                <button className={`filter-tab admin-wd-tab ${wdTab === 'pending' ? 'active' : ''}`} onClick={() => setWdTab('pending')}><i className="fas fa-clock"></i> Menunggu Transfer</button>
                <button className={`filter-tab admin-wd-tab ${wdTab === 'completed' ? 'active' : ''}`} onClick={() => setWdTab('completed')}><i className="fas fa-check"></i> Selesai</button>
                <button className={`filter-tab admin-wd-tab ${wdTab === 'rejected' ? 'active' : ''}`} onClick={() => setWdTab('rejected')}><i className="fas fa-times"></i> Ditolak</button>
              </div>
              <div className="admin-ideas-list">
                {loading ? <div style={{textAlign:'center', padding:'2rem'}}>Loading...</div> : filteredWithdrawals.length === 0 ? (
                  <div className="empty-state"><div className="empty-icon"><i className="fas fa-money-check"></i></div><h3>Tidak Ada Data</h3></div>
                ) : filteredWithdrawals.map(wd => (
                  <div key={wd.id} className="admin-idea-card">
                    <div className="admin-idea-info">
                      <h4 style={{marginBottom:'0.5rem'}}><i className="fas fa-university" style={{color:'#6366f1'}}></i> {wd.bank_name} - {wd.account_number}</h4>
                      <div className="admin-idea-meta">
                        <span><i className="fas fa-user"></i> A.N: <strong>{wd.account_name}</strong></span>
                        <span style={{color:'#10b981', fontWeight:'bold'}}><i className="fas fa-money-bill-wave"></i> Rp {wd.amount.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
