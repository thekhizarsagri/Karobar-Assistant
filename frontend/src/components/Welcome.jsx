import { useEffect, useState } from 'react';
import titleImg from '../assets/title-image.png';

const pitchText = 'Manage production, sales, profits, and get AI-powered business advice.';

const featureCards = [
  { id: 1, title: 'Production Tracking', desc: 'Monitor production workflows in real-time.' },
  { id: 2, title: 'Sales Analytics', desc: 'Track sales performance and insights.' },
  { id: 3, title: 'Profit Optimization', desc: 'AI suggestions to maximize profits.' },
  { id: 4, title: 'Business Advice', desc: 'Personalized AI advice for decisions.' },
];

function Welcome({ onDemoClick }) {
  const [pitch, setPitch] = useState('');

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setPitch(pitchText.slice(0, current));
      if (current >= pitchText.length) {
        clearInterval(interval);
      }
    }, 35);

    return () => clearInterval(interval);
  }, []);

  const [date, setDate] = useState('');
  useEffect(() => {
    const updateDate = () => {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      setDate(new Date().toLocaleDateString(undefined, options));
    };
    updateDate();
    const timer = setInterval(updateDate, 86400000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="welcome-container">
      <img
        src={titleImg}
        alt="Karobar Assistant"
        className="title-image"
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        onMouseDown={(e) => e.preventDefault()}
      />

      <p className="pitch-text">
        {pitch}
        <span className="cursor" />
      </p>

      <div className="date-section" style={{ position: 'absolute', top: 20, left: 20 }}>
        {date}
      </div>

      <div className="features-section">
        {featureCards.map((card) => (
          <div
            key={card.id}
            className="feature-card"
            style={{
              animationDelay: `${card.id * 0.2}s`,
            }}
          >
            <span className="feature-icon">📊</span>
            <h4 className="feature-title">{card.title}</h4>
            <p className="feature-desc">{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="action-container">
        <button type="button" className="register-btn" onMouseDown={(e)=>e.preventDefault()}>Register</button>
        <button type="button" className="demo-btn" onMouseDown={(e)=>e.preventDefault()} onClick={onDemoClick}>Demo Mode</button>
      </div>

      <div className="login-section">
        Already have an account?
        <button type="button" className="login-btn" onMouseDown={(e)=>e.preventDefault()}>Login</button>
      </div>
    </div>
  );
}

export default Welcome;