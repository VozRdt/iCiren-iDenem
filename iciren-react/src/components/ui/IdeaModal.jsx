import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export function IdeaModal({ idea, isOpen, onClose, isPurchased }) {
  const { user } = useAuth();
  const [loadingPayment, setLoadingPayment] = useState(false);

  useEffect(() => {
    // Load Midtrans Snap script
    const snapScriptUrl = 'https://app.sandbox.midtrans.com/snap/snap.js';
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-dummy';
    
    let scriptTag = document.querySelector(`script[src="${snapScriptUrl}"]`);
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.src = snapScriptUrl;
      scriptTag.setAttribute('data-client-key', clientKey);
      scriptTag.async = true;
      document.body.appendChild(scriptTag);
    }
  }, []);

  const handleBuyIdea = async () => {
    if (!user) {
      toast.error('Silakan login terlebih dahulu untuk membeli ide.');
      return;
    }
    
    setLoadingPayment(true);
    try {
      // 1. Create transaction in Supabase
      const { data: intentData, error: intentError } = await supabase.rpc('create_payment_intent', {
        p_idea_id: idea.id || idea.idea_id
      });
      
      if (intentError) throw intentError;
      if (!intentData.success) {
        toast.error(intentData.error || 'Gagal memproses pembayaran.');
        setLoadingPayment(false);
        return;
      }
      
      // 2. Fetch snap token from backend (Vercel)
      const API_URL = import.meta.env.VITE_API_URL || 'https://icirenidenem.vercel.app';
      const response = await fetch(`${API_URL}/api/payment/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: intentData.transaction_id,
          amount: intentData.amount,
          idea_title: intentData.idea_title,
          customer_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Customer',
          customer_email: user.email || 'customer@example.com'
        })
      });
      
      if (!response.ok) {
        throw new Error('Gagal mendapatkan token pembayaran dari server.');
      }
      
      const { token } = await response.json();
      
      if (!token) {
        throw new Error('Token Midtrans tidak ditemukan.');
      }
      
      // 3. Open Snap Payment Popup
      window.snap.pay(token, {
        onSuccess: function(result) {
          toast.success('Pembayaran berhasil! Memproses pesananmu...');
          if (onClose) onClose();
          setTimeout(() => {
            window.location.href = '/myideas';
          }, 1000);
        },
        onPending: function(result) {
          toast.success('Menunggu pembayaran diselesaikan.');
          if (onClose) onClose();
        },
        onError: function(result) {
          toast.error('Pembayaran gagal.');
          setLoadingPayment(false);
        },
        onClose: function() {
          setLoadingPayment(false);
        }
      });
      
    } catch (err) {
      console.error('Payment Error:', err);
      toast.error(err.message || 'Terjadi kesalahan saat memproses pembayaran.');
      setLoadingPayment(false);
    }
  };
  
  if (!isOpen || !idea) return null;

  const canViewContent = isPurchased;

  const p = idea.platform || idea.category || '';
  const c = idea.category || 'lainnya';
  const platformLabel = { youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', podcast: 'Podcast', blog: 'Blog' }[p] || p;

  const modalElement = (
    <div className="modal show">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <div className="modal-body">
          <div style={{ textAlign: 'center', marginBottom: '0.3rem', fontSize: '2.2rem' }}>
            {idea.emoji || idea.idea_emoji || '💡'}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
            <span className="category-badge" style={{textTransform: 'capitalize'}}>{platformLabel}</span>
            <span className="category-badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', textTransform: 'capitalize' }}>
              {c}
            </span>
          </div>
          <h2 style={{ color: '#f8fafc', fontSize: '1.05rem', margin: '0.5rem 0 0.2rem', textAlign: 'center' }}>
            {idea.title || idea.idea_title}
          </h2>
          <p style={{ color: '#a3a3a3', lineHeight: '1.3', marginBottom: '0.6rem', fontSize: '0.85rem', textAlign: 'center' }}>
            {idea.desc || idea.description || idea.idea_desc || ''}
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.8rem', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', marginBottom: '0.6rem' }}>
            <div>
              <div style={{ color: '#a3a3a3', fontSize: '0.7rem', marginBottom: '0.1rem' }}>Harga</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', background: 'linear-gradient(135deg,#F59E0B,#FBBF24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Rp {(idea.price || idea.idea_price || 0).toLocaleString('id-ID')}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#a3a3a3', fontSize: '0.7rem' }}>
                {(idea.views || idea.idea_views || 0).toLocaleString()} kali dilihat
              </div>
            </div>
          </div>
          
          {canViewContent ? (
            <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', padding: '1rem', borderRadius: '10px', marginBottom: '0.6rem', textAlign: 'left' }}>
              <h3 style={{ color: '#10B981', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                <i className="fas fa-lock-open"></i> Isi Ide (Rahasia)
              </h3>
              <p style={{ color: '#f8fafc', fontSize: '0.85rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {idea.content || idea.idea_content || 'Isi ide belum tersedia (Atau kamu sedang membuka tabel pembelian yang tidak menyimpan salinan isi).'}
              </p>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                <i className="fas fa-info-circle"></i> Harga belum termasuk biaya transaksi Midtrans.
              </div>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginBottom: '0.4rem', padding: '0.6rem 1rem', fontSize: '0.9rem' }}
                onClick={handleBuyIdea}
                disabled={loadingPayment}
              >
                <i className="fas fa-shopping-cart"></i> {loadingPayment ? 'Memproses...' : 'Beli Ide Ini'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalElement, document.body);
}
