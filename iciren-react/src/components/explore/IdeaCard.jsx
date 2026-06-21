import React from 'react';

export const IdeaCard = ({ idea, onClick }) => {
  const getPlatformIcon = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'youtube': return <i className="fab fa-youtube"></i>;
      case 'tiktok': return <i className="fab fa-tiktok"></i>;
      case 'instagram': return <i className="fab fa-instagram"></i>;
      case 'podcast': return <i className="fas fa-podcast"></i>;
      case 'blog': return <i className="fas fa-blog"></i>;
      default: return <i className="fas fa-lightbulb"></i>;
    }
  };

  return (
    <div className="idea-card" onClick={() => onClick(idea)}>
      <div className="idea-image">
        {idea.emoji ? idea.emoji : getPlatformIcon(idea.category)}
      </div>
      <div className="idea-content">
        <span className="category-badge" style={{ textTransform: 'capitalize' }}>{idea.category}</span>
        <h3 className="idea-title">{idea.title}</h3>
        <p className="idea-description" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {idea.description || idea.desc}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="idea-price">Rp {idea.price.toLocaleString('id-ID')}</span>
          <span style={{ color: '#a3a3a3', fontSize: '0.9rem' }}>
            <i className="fas fa-user"></i> {idea.author_name || 'Kreator'}
          </span>
        </div>
      </div>
    </div>
  );
};
