import React from 'react';

export default function AboutPage() {
  return (
    <div className="page active" id="page-about" style={{ display: 'block' }}>
      <section className="page-hero">
        <div className="container">
          <h1 className="page-hero-title"><i className="fas fa-info-circle"></i> Tentang iCiren iDe'nem</h1>
          <p className="page-hero-subtitle">Mengenal lebih dekat platform ide konten terbesar di Indonesia</p>
        </div>
      </section>
      <section className="about-section">
        <div className="container">
          <div className="about-story">
            <div className="about-text">
              <h2 className="about-heading">Cerita di Balik iCiren iDe'nem</h2>
              <p>Pernahkah Anda memiliki ide brilian yang terlintas di kepala, namun bingung bagaimana mewujudkannya menjadi sebuah karya? Atau sebaliknya, Anda adalah seorang konten kreator yang sedang kehabisan inspirasi (creator's block) dan butuh materi segar?</p>
              <p>Dari kedua keresahan inilah iCiren iDe'nem lahir.</p>
              <p>Mengambil akar dari bahasa Jawa khas dialek Tuban, Jawa Timur, nama iCiren iDe'nem memiliki arti yang sangat mendalam: "Tanamlah Idemu". Kata "iCiren" berarti tanamlah atau ajakan untuk menabur, sedangkan "iDe'nem" adalah gabungan kata ide dan akhiran "nem" sebutan khas masyarakat Tuban untuk menyatakan kepemilikan orang kedua (milikmu).</p>
              <br />
              <h2 className="about-heading">Bagaimana Kami Bekerja?</h2>
              <p>Kami percaya bahwa setiap ide kreatif—baik itu untuk konten edukasi yang mencerdaskan maupun konten hiburan yang menyenangkan adalah sebuah "benih" yang berharga. Di sinilah iCiren iDe'nem mengambil peran. Kami hadir sebagai "tanah yang subur" untuk merawat benih-benih tersebut.</p>
              <div className="about-stats">
                <div className="about-stat"><span className="about-stat-num">2025</span><span className="about-stat-label">Didirikan</span></div>
                <div className="about-stat"><span className="about-stat-num">850+</span><span className="about-stat-label">Kreator Aktif</span></div>
                <div className="about-stat"><span className="about-stat-num">2.500+</span><span className="about-stat-label">Ide Terjual</span></div>
              </div>
            </div>
            <div className="about-visual">
              <div className="about-card-visual"><div className="av-icon"><i className="fas fa-rocket"></i></div><h3>Misi Kami</h3><p>Menjadi jembatan antara kreativitas dan kreator, memungkinkan setiap ide brilian menemukan rumahnya yang tepat.</p></div>
            </div>
          </div>
          <div className="team-section">
            <h2 className="section-title">Tim Kami</h2>
            <div className="team-grid">
              <div className="team-card"><div className="team-avatar" style={{display:'flex', alignItems:'center', justifyContent:'center'}}>HI</div><h3>Hauzan Irhab</h3><span>Founder</span><p>Penggagas awal iCiren iDe'nem yang memiliki visi kuat tentang potensi tak terbatas dari sebuah ide kreatif.</p></div>
              <div className="team-card"><div className="team-avatar" style={{display:'flex', alignItems:'center', justifyContent:'center'}}>RP</div><h3>Raditya Pratama</h3><span>CEO</span><p>Mengarahkan pengembangan platform dan memastikan iCiren iDe'nem terus berinovasi untuk para kreator.</p></div>
            </div>
          </div>
          <div className="values-section">
            <h2 className="section-title">Nilai-Nilai Kami</h2>
            <div className="values-grid">
              <div className="value-card"><i className="fas fa-heart"></i><h3>Passion</h3><p>Kami mencintai kreativitas dan berkomitmen untuk mendukung para kreator.</p></div>
              <div className="value-card"><i className="fas fa-handshake"></i><h3>Integritas</h3><p>Transparansi dan kejujuran adalah fondasi dari setiap transaksi kami.</p></div>
              <div className="value-card"><i className="fas fa-bolt"></i><h3>Inovasi</h3><p>Selalu berinovasi untuk memberikan pengalaman terbaik bagi pengguna.</p></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
