import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function WalletPage() {
  const { user, profile, setProfile } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const fetchWithdrawals = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setWithdrawals(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (profile) {
      fetchWithdrawals();
    }
  }, [user, profile, navigate]);

  const handleOpenWithdrawModal = () => {
    if (!profile.total_earnings || profile.total_earnings <= 0) {
      toast.error('Saldo tidak cukup untuk ditarik.');
      return;
    }
    
    if (!profile.bank_name || !profile.account_number || !profile.account_name) {
      toast.error('Lengkapi informasi rekening bank di profil Anda terlebih dahulu.');
      navigate('/profile');
      return;
    }

    setWithdrawAmount('');
    setShowWithdrawModal(true);
  };

  const submitWithdrawal = async () => {
    const amount = parseInt(withdrawAmount.replace(/[^0-9]/g, ''), 10);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Nominal tidak valid.');
      return;
    }

    if (amount > profile.total_earnings) {
      toast.error('Nominal melebihi saldo yang tersedia.');
      return;
    }
    
    if (amount < 10000) {
      toast.error('Minimal penarikan adalah Rp 10.000');
      return;
    }

    setLoading(true);
    try {
      const { error: wdError } = await supabase.from('withdrawals').insert([{
        user_id: user.id,
        amount: amount,
        bank_name: profile.bank_name,
        account_number: profile.account_number,
        account_name: profile.account_name,
        status: 'pending'
      }]);

      if (wdError) throw wdError;

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ total_earnings: profile.total_earnings - amount })
        .eq('id', user.id)
        .select()
        .single();
        
      if (updateError) throw updateError;
      
      setProfile(updatedProfile);
      toast.success('Permintaan tarik tunai berhasil dikirim!');
      setShowWithdrawModal(false);
      fetchWithdrawals();
    } catch (error) {
      console.error(error);
      toast.error('Gagal melakukan tarik tunai.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelWithdrawal = async (wd) => {
    setLoading(true);
    try {
      // 1. Update withdrawal status to cancelled
      const { error: wdErr } = await supabase
        .from('withdrawals')
        .update({ status: 'cancelled' })
        .eq('id', wd.id);
      if (wdErr) throw wdErr;

      // 2. Refund to user
      const { data: updatedProfile, error: profErr } = await supabase
        .from('profiles')
        .update({ total_earnings: profile.total_earnings + wd.amount })
        .eq('id', user.id)
        .select()
        .single();
      if (profErr) throw profErr;

      setProfile(updatedProfile);
      toast.success('Penarikan dibatalkan & saldo telah dikembalikan!');
      fetchWithdrawals();
    } catch (e) {
      console.error(e);
      toast.error('Gagal membatalkan penarikan.');
    } finally {
      setLoading(false);
    }
  };

  const CountdownTimer = ({ createdAt }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
      const targetDate = new Date(createdAt).getTime() + (72 * 60 * 60 * 1000);
      const updateTimer = () => {
        const now = new Date().getTime();
        const distance = targetDate - now;
        if (distance <= 0) {
          setTimeLeft('00:00:00');
          setIsExpired(true);
          return;
        }
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) + Math.floor(distance / (1000 * 60 * 60 * 24)) * 24;
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }, [createdAt]);

    return { timeLeft, isExpired };
  };

  const WithdrawalCard = ({ wd }) => {
    const { timeLeft, isExpired } = CountdownTimer({ createdAt: wd.created_at });
    
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <strong style={{ fontSize: '1.1rem' }}>Rp {wd.amount.toLocaleString('id-ID')}</strong>
          <span style={{ 
            padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase',
            background: wd.status === 'completed' ? 'rgba(16,185,129,0.1)' : wd.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
            color: wd.status === 'completed' ? '#10b981' : wd.status === 'pending' ? '#f59e0b' : '#ef4444'
          }}>
            {wd.status === 'completed' ? 'Selesai' : wd.status === 'pending' ? 'Diproses' : 'Ditolak/Batal'}
          </span>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#a3a3a3', marginBottom: '0.5rem' }}>
          Tujuan: {wd.bank_name} - {wd.account_number} (a.n. {wd.account_name})<br/>
          Tanggal: {new Date(wd.created_at).toLocaleString('id-ID')}
        </div>
        
        {wd.status === 'pending' && (
          <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Sisa Waktu Proses:</span>
              <span style={{ color: isExpired ? '#ef4444' : '#f59e0b', fontFamily: 'monospace', fontWeight: 'bold' }}>{timeLeft}</span>
            </div>
            {isExpired && (
              <button 
                onClick={() => handleCancelWithdrawal(wd)}
                disabled={loading}
                className="btn btn-outline" 
                style={{ width: '100%', borderColor: '#ef4444', color: '#ef4444', fontSize: '0.85rem', padding: '0.5rem' }}>
                <i className="fas fa-undo"></i> Batalkan & Kembalikan Saldo
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!user || !profile) return null;

  return (
    <div className="page active" id="page-wallet" style={{ display: 'block' }}>
      <section className="page-hero">
        <div className="container">
          <h1 className="page-hero-title"><i className="fas fa-wallet"></i> Dompet Saldo</h1>
          <p className="page-hero-subtitle">Kelola pendapatan dan penarikan tunaimu di sini</p>
        </div>
      </section>
      
      <section className="profile-section">
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          <div className="wallet-card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
            <p className="wallet-label" style={{ color: '#a3a3a3', fontSize: '1rem', marginBottom: '0.5rem' }}>Total Saldo Tersedia</p>
            <h3 className="wallet-balance" style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1.5rem', color: '#10b981' }}>
              Rp {(profile.total_earnings || 0).toLocaleString('id-ID')}
            </h3>
            
            <button className="btn btn-primary" style={{ width: '100%', maxWidth: '300px', padding: '1rem', fontSize: '1rem', fontWeight: '600', margin: '0 auto' }} onClick={handleOpenWithdrawModal} disabled={loading}>
              <i className="fas fa-money-check-alt"></i> Ajukan Penarikan Tunai
            </button>
            
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '1rem' }}>
              <i className="fas fa-exclamation-triangle" style={{ color: '#f59e0b' }}></i> Penarikan tunai memakan waktu maksimal hingga 3 hari kerja.
            </p>
          </div>

          <div className="form-card">
            <h2 className="form-title"><i className="fas fa-history"></i> Riwayat Penarikan Tunai</h2>
            {withdrawals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#a3a3a3', fontSize: '0.9rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                <i className="fas fa-inbox" style={{ fontSize: '2rem', marginBottom: '1rem', color: '#4b5563' }}></i>
                <p>Belum ada riwayat penarikan.</p>
              </div>
            ) : (
              <div>
                {withdrawals.map(wd => (
                  <WithdrawalCard key={wd.id} wd={wd} />
                ))}
              </div>
            )}
          </div>
          
        </div>
      </section>

      {showWithdrawModal && (
        <div className="modal show" onClick={() => setShowWithdrawModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', margin: '15vh auto', position: 'relative' }}>
            <span className="close" onClick={() => setShowWithdrawModal(false)}>&times;</span>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '2.5rem', color: '#f59e0b' }}>
                <i className="fas fa-money-bill-wave"></i>
              </div>
              <h2 className="modal-title" style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: '0.5rem', color: '#f8fafc' }}>Tarik Tunai</h2>
              <p style={{ color: '#a3a3a3', marginBottom: '1.5rem', fontSize: '0.95rem', textAlign: 'center' }}>
                Masukkan nominal yang ingin ditarik. Maksimal penarikan saat ini adalah <strong>Rp {profile.total_earnings.toLocaleString('id-ID')}</strong>.
              </p>
              <div className="form-group" style={{ textAlign: 'left' }}>
                <label>Nominal Penarikan (Rp)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="10000" 
                  value={withdrawAmount} 
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min="10000"
                  max={profile.total_earnings}
                  autoFocus
                />
                <small style={{ color: '#94a3b8', marginTop: '0.5rem', display: 'block' }}>Minimal Rp 10.000</small>
              </div>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.8rem', marginTop: '1rem' }} 
                onClick={submitWithdrawal} 
                disabled={loading || !withdrawAmount || parseInt(withdrawAmount) < 10000 || parseInt(withdrawAmount) > profile.total_earnings}
              >
                {loading ? 'Memproses...' : 'Tarik Dana Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
