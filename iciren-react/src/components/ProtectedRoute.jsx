import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children, requireBankInfo = false }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 100px)', marginTop: '100px', padding: '1rem' }}>
        <div style={{ background: 'rgba(25, 25, 25, 0.95)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '16px', padding: '2rem 1.5rem', textAlign: 'center', maxWidth: '400px', width: '100%', boxShadow: '0 15px 35px rgba(0,0,0,0.6)' }}>
          <div style={{ fontSize: '3.5rem', color: '#f59e0b', marginBottom: '1.2rem', textShadow: '0 0 20px rgba(245,158,11,0.4)' }}>
            <i className="fas fa-lock"></i>
          </div>
          <h2 style={{ color: '#f8fafc', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Akses Terbatas</h2>
          <p style={{ color: '#a3a3a3', marginBottom: '1.5rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
            Anda harus mendaftar atau login terlebih dahulu untuk mengakses halaman ini.
          </p>
          <button 
            onClick={() => navigate('/auth')} 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.8rem 1.5rem', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <i className="fas fa-sign-in-alt"></i> Login / Daftar
          </button>
        </div>
      </div>
    );
  }

  if (requireBankInfo) {
    const hasBankInfo = profile?.bank_name && profile?.account_number && profile?.account_name;
    if (!hasBankInfo) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 100px)', marginTop: '100px', padding: '1rem' }}>
          <div style={{ background: 'rgba(25, 25, 25, 0.95)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '16px', padding: '2rem 1.5rem', textAlign: 'center', maxWidth: '400px', width: '100%', boxShadow: '0 15px 35px rgba(0,0,0,0.6)' }}>
            <div style={{ fontSize: '3.5rem', color: '#f59e0b', marginBottom: '1.2rem', textShadow: '0 0 20px rgba(245,158,11,0.4)' }}>
              <i className="fas fa-money-check-alt"></i>
            </div>
            <h2 style={{ color: '#f8fafc', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Data Rekening Kosong</h2>
            <p style={{ color: '#a3a3a3', marginBottom: '1.5rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
              Silakan lengkapi informasi rekening bank Anda terlebih dahulu sebelum mulai menjual ide.
            </p>
            <button 
              onClick={() => navigate('/profile#bank-info')} 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.8rem 1.5rem', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <i className="fas fa-user-edit"></i> Lengkapi Sekarang
            </button>
          </div>
        </div>
      );
    }
  }

  return children;
};

