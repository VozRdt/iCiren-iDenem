import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { IdeaCard } from '../components/explore/IdeaCard';

export default function ExplorePage() {
  const [ideas, setIdeas] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('semua');
  const [platform, setPlatform] = useState('semua');
  const [sort, setSort] = useState('newest');
  const [maxPrice, setMaxPrice] = useState(200000);

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      
      if (data) {
        setIdeas(data.map(idea => ({
          ...idea,
          author_name: 'Kreator Anonim' // Fallback because no direct FK to profiles exists
        })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredIdeas = ideas.filter(idea => {
    const matchSearch = idea.title.toLowerCase().includes(search.toLowerCase()) || 
                        (idea.description && idea.description.toLowerCase().includes(search.toLowerCase()));
    const matchCat = category === 'semua' || idea.category === category;
    const matchPlat = platform === 'semua' || idea.platform === platform || idea.category === platform; // fallback for older data
    const matchPrice = idea.price <= maxPrice;
    
    return matchSearch && matchCat && matchPlat && matchPrice;
  }).sort((a, b) => {
    if (sort === 'price-low') return a.price - b.price;
    if (sort === 'price-high') return b.price - a.price;
    // newest is default
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div className="page active" id="page-explore" style={{ display: 'block' }}>
      <section className="page-hero">
        <div className="container">
          <h1 className="page-hero-title"><i className="fas fa-compass"></i> Jelajahi Ide</h1>
          <p className="page-hero-subtitle">Temukan ribuan ide konten kreatif dari para kreator terbaik Indonesia</p>
          
          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Cari ide konten..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="advanced-filters">
            <div className="af-group">
              <label><i className="fas fa-layer-group"></i> Kategori</label>
              <select className="af-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="semua">Semua Kategori</option>
                <option value="makanan">Makanan</option>
                <option value="review">Review</option>
                <option value="pendidikan">Pendidikan</option>
                <option value="kesehatan">Kesehatan</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
            
            <div className="af-group">
              <label><i className="fas fa-mobile-alt"></i> Platform</label>
              <select className="af-select" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                <option value="semua">Semua Platform</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
                <option value="podcast">Podcast</option>
                <option value="blog">Blog</option>
              </select>
            </div>
            
            <div className="af-group">
              <label><i className="fas fa-sort-amount-down"></i> Urutkan</label>
              <select className="af-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">Terbaru</option>
                <option value="price-low">Termurah</option>
                <option value="price-high">Termahal</option>
                <option value="rating">Rating Tertinggi</option>
                <option value="views">Paling Dilihat</option>
              </select>
            </div>
            
            <div className="af-group">
              <label><i className="fas fa-money-bill-wave"></i> Harga Maks</label>
              <div className="af-range-wrapper">
                <input 
                  type="range" className="af-range" 
                  min="0" max="200000" step="5000"
                  value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                />
                <span className="af-range-label">Rp {parseInt(maxPrice).toLocaleString('id-ID')}</span>
              </div>
            </div>
            
            <div className="af-result-count">
              <span>{filteredIdeas.length}</span> ide ditemukan
            </div>
          </div>
        </div>
      </section>
      
      <section className="ideas-section" style={{ paddingTop: '2rem' }}>
        <div className="container">
          <div className="ideas-grid ready">
            {filteredIdeas.map(idea => (
              <IdeaCard key={idea.id} idea={idea} onClick={(idea) => console.log('view', idea)} />
            ))}
          </div>
          <div className="load-more">
            <button className="btn btn-secondary">Muat Lebih Banyak</button>
          </div>
        </div>
      </section>
    </div>
  );
}
