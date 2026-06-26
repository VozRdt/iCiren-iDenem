import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const ProtectedRoute = ({ children, requireBankInfo = false }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      toast.error('Silakan daftar atau login terlebih dahulu untuk mengakses halaman ini.');
      navigate('/auth', { replace: true });
      return;
    }

    if (requireBankInfo) {
      const hasBankInfo = profile?.bank_name && profile?.account_number && profile?.account_name;
      if (!hasBankInfo) {
        toast.error('Silakan lengkapi data rekening Anda terlebih dahulu untuk menjual ide.');
        navigate('/profile#bank-info', { replace: true });
        return;
      }
    }
  }, [user, profile, requireBankInfo, navigate]);

  if (!user) return null;
  if (requireBankInfo && (!profile?.bank_name || !profile?.account_number || !profile?.account_name)) return null;

  return children;
};

