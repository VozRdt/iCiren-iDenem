import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <img src="/logo.png" alt="Logo" className="custom-logo" style={{ height: '70px', marginBottom: '1rem' }} />
            </Link>
            <p>Platform marketplace terbaik untuk jual beli ide konten kreatif di Indonesia.</p>
            <div className="social-links" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <a href="#" style={{ color: '#a3a3a3', fontSize: '1.5rem', transition: 'color 0.3s' }}><i className="fab fa-instagram"></i></a>
              <a href="#" style={{ color: '#a3a3a3', fontSize: '1.5rem', transition: 'color 0.3s' }}><i className="fab fa-tiktok"></i></a>
              <a href="#" style={{ color: '#a3a3a3', fontSize: '1.5rem', transition: 'color 0.3s' }}><i className="fab fa-youtube"></i></a>
            </div>
          </div>
          <div className="footer-links">
            <h3>Navigasi</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.8rem' }}><Link to="/explore" style={{ color: '#a3a3a3', textDecoration: 'none' }}>Jelajahi Ide</Link></li>
              <li style={{ marginBottom: '0.8rem' }}><Link to="/sell" style={{ color: '#a3a3a3', textDecoration: 'none' }}>Jual Ide</Link></li>
              <li style={{ marginBottom: '0.8rem' }}><Link to="/about" style={{ color: '#a3a3a3', textDecoration: 'none' }}>Tentang Kami</Link></li>
            </ul>
          </div>
          <div className="footer-links">
            <h3>Bantuan</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.8rem' }}><a href="#" style={{ color: '#a3a3a3', textDecoration: 'none' }}>Pusat Bantuan</a></li>
              <li style={{ marginBottom: '0.8rem' }}><a href="#" style={{ color: '#a3a3a3', textDecoration: 'none' }}>Syarat & Ketentuan</a></li>
              <li style={{ marginBottom: '0.8rem' }}><a href="#" style={{ color: '#a3a3a3', textDecoration: 'none' }}>Kebijakan Privasi</a></li>
            </ul>
          </div>
          <div className="footer-contact">
            <h3>Hubungi Kami</h3>
            <p style={{ color: '#a3a3a3', marginBottom: '0.5rem' }}><i className="fas fa-envelope" style={{ marginRight: '0.5rem' }}></i> support@iciren.id</p>
            <p style={{ color: '#a3a3a3' }}><i className="fab fa-whatsapp" style={{ marginRight: '0.5rem' }}></i> +62 812 3456 7890</p>
          </div>
        </div>
        <div className="footer-bottom" style={{ textAlign: 'center', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', color: '#a3a3a3', fontSize: '0.9rem' }}>
          <p>&copy; 2026 iCiren iDe'nem. Hak Cipta Dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}
