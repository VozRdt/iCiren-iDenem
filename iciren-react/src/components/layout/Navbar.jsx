import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <>
      <div id="nav-progress" className={location.pathname ? '' : 'running'}></div>
      <div className={`nav-menu-backdrop ${menuOpen ? 'show' : ''}`} onClick={() => setMenuOpen(false)}></div>
      <nav className="navbar" id="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-logo" style={{ cursor: 'pointer', textDecoration: 'none' }}>
            <img src="/logo.png" alt="Logo iCiren iDe'nem" className="custom-logo" />
          </Link>
          
          <ul className={`nav-menu ${menuOpen ? 'open' : ''}`} id="navMenu">
            <li className="nav-item">
              <Link to="/" className={`nav-link ${isActive('/')}`} onClick={() => setMenuOpen(false)}>Home</Link>
            </li>
            <li className="nav-item">
              <Link to="/explore" className={`nav-link ${isActive('/explore')}`} onClick={() => setMenuOpen(false)}>Jelajahi Ide</Link>
            </li>
            <li className="nav-item">
              <Link to="/sell" className={`nav-link ${isActive('/sell')}`} style={{ display: 'flex', alignItems: 'center' }} onClick={() => setMenuOpen(false)}>
                <img src="/logo.png" className="inline-logo-only" alt="Jual Ide" />
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/about" className={`nav-link ${isActive('/about')}`} onClick={() => setMenuOpen(false)}>Tentang</Link>
            </li>
            <li className="nav-item">
              <Link to="/myideas" className={`nav-link ${isActive('/myideas')}`} onClick={() => setMenuOpen(false)}>Ide Saya</Link>
            </li>
          </ul>

          <div className="nav-cta">
            {!user ? (
              <>
                <button className="btn btn-outline btn-auth-nav" onClick={() => navigate('/auth?tab=login')}>
                  <i className="fas fa-sign-in-alt"></i> Masuk
                </button>
                <button className="btn btn-primary btn-auth-nav" onClick={() => navigate('/auth?tab=register')}>
                  <i className="fas fa-user-plus"></i> Daftar
                </button>
              </>
            ) : (
              <div className="nav-user-profile" style={{ display: 'flex' }}>
                <div className="nav-notif-wrapper">
                  <button className="nav-notif-btn">
                    <i className="fas fa-bell"></i>
                  </button>
                </div>
                <div className="nav-user-avatar" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }} title="Profil Saya">
                  <span>{profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}</span>
                </div>
                <span className="nav-user-name" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
                  {profile?.full_name || user.email}
                </span>
                <button className="btn btn-outline btn-sm" onClick={signOut}>
                  <i className="fas fa-sign-out-alt"></i> Keluar
                </button>
              </div>
            )}
          </div>

          <div className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>
    </>
  );
}
