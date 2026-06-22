import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export function IdeaModal({ idea, isOpen, onClose, isPurchased }) {
  const { user } = useAuth();
  
  if (!isOpen || !idea) return null;

  const canViewContent = isPurchased;

  const p = idea.platform || idea.category || '';
  const c = idea.category || 'lainnya';
  const platformLabel = { youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', podcast: 'Podcast', blog: 'Blog' }[p] || p;

  return (
    <div className="modal show" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="modal-content" style={{ maxWidth: '380px', width: '90%', margin: 0, maxHeight: '90vh', overflowY: 'auto' }}>
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
                onClick={() => alert('Fitur Midtrans Payment Gateway sedang dipindahkan ke versi React. Harap tunggu update selanjutnya.')}
              >
                <i className="fas fa-shopping-cart"></i> Beli Ide Ini
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
