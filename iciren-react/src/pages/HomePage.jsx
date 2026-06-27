import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="page active" id="page-home" style={{ display: 'block' }}>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge" data-gsap="hero"><i className="fas fa-fire"></i> Platform #1 Ide Konten Indonesia</div>
            <h1 className="hero-title" data-gsap="hero">Temukan Ide Kontenmu yang Viral</h1>
            <p className="hero-subtitle" data-gsap="hero">Platform marketplace untuk jual beli ide konten kreatif. Ribuan ide siap mengubah channelmu!</p>
            <div className="hero-buttons" data-gsap="hero">
              <button className="btn btn-primary btn-large" onClick={() => navigate('/explore')} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '60px', padding: '0 2.5rem' }}>
                <i className="fas fa-compass" style={{ marginRight: '8px' }}></i> Jelajahi Ide
              </button>
              <button className="btn btn-outline btn-large" onClick={() => navigate('/sell')} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '60px', padding: '0 1.5rem' }}>
                <img src="/logo.png" alt="Jual Ide" style={{ height: '3.5rem', width: 'auto', objectFit: 'contain' }} />
              </button>
            </div>
            <div className="hero-stats" data-gsap="hero">
              <div className="stat-item">
                <span className="stat-number">2.500+</span>
                <span className="stat-label">Ide Tersedia</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">850+</span>
                <span className="stat-label">Kreator Aktif</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">98%</span>
                <span className="stat-label">Kepuasan</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-footnote">Batik Gedhog Tuban</div>
      </section>

      {/* Cara Kerja Section */}
      <section className="how-it-works" data-gsap-section>
        <div className="container">
          <h2 className="section-title">Cara Kerja iCiren iDe'nem</h2>
          <p className="section-subtitle">Simpel, cepat, dan menguntungkan untuk semua pihak</p>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon"><i className="fas fa-lightbulb"></i></div>
              <h3>Jual Ide</h3>
              <p>Bagikan ide konten kreatifmu dengan detail lengkap dan harga yang kamu tentukan sendiri.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon"><i className="fas fa-search-plus"></i></div>
              <h3>Kami Kurasi</h3>
              <p>Tim iCiren iDe'nem review dan pastikan ide berkualitas tinggi sebelum dipublikasikan ke marketplace.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon"><i className="fas fa-shopping-cart"></i></div>
              <h3>Kreator Beli</h3>
              <p>Konten kreator membeli ide dan langsung bisa produksi konten viral!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits" data-gsap-section>
        <div className="container">
          <h2 className="section-title">Mengapa Memilih iCiren iDe'nem?</h2>
          <p className="section-subtitle">Keunggulan yang membuat kami berbeda dari platform lainnya</p>
          <div className="benefits-grid">
            <div className="benefit-item"><i className="fas fa-check-circle"></i><h3>100% Original</h3><p>Semua ide dijamin orisinal dan belum pernah dipakai oleh siapapun sebelumnya.</p></div>
            <div className="benefit-item"><i className="fas fa-shield-alt"></i><h3>Terjamin Aman</h3><p>Sistem pembayaran aman dengan garansi kepuasan dan perlindungan pembeli.</p></div>
            <div className="benefit-item"><i className="fas fa-chart-line"></i><h3>Potensi Viral</h3><p>Ide dirancang untuk engagement tinggi dan potensi viral yang luar biasa.</p></div>
            <div className="benefit-item"><i className="fas fa-headset"></i><h3>Support 24/7</h3><p>Tim kami siap membantu kamu kapan saja selama 24 jam penuh 7 hari seminggu.</p></div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials" data-gsap-section>
        <div className="container">
          <h2 className="section-title">Apa Kata Kreator?</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="stars"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></div>
              <p>"Ide dari iCiren iDe'nem bikin video saya viral! 1M views dalam 3 hari! Benar-benar worth it!"</p>
              <div className="author"><div className="author-avatar" style={{width:'50px',height:'50px',borderRadius:'50%',border:'2px solid rgba(245,158,11,0.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>RK</div><div><h4 style={{color:'#f8fafc',marginBottom:'0.2rem'}}>Hetty</h4><span style={{color:'#a3a3a3',fontSize:'0.9rem'}}>500K Subscribers</span></div></div>
            </div>
            <div className="testimonial-card">
              <div className="stars"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></div>
              <p>"Platform terbaik buat dapet ide segar. Sudah jual 15 ide di iCiren iDe'nem dan hasilnya memuaskan!"</p>
              <div className="author"><div className="author-avatar" style={{width:'50px',height:'50px',borderRadius:'50%',border:'2px solid rgba(245,158,11,0.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>BA</div><div><h4 style={{color:'#f8fafc',marginBottom:'0.2rem'}}>Budi A</h4><span style={{color:'#a3a3a3',fontSize:'0.9rem'}}>Penjual Ide Pro</span></div></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
