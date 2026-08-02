import { useEffect, useState } from 'react';
import titleImg from '../assets/title-image.png';

const pitchText = 'Manage production, sales, profits, and get AI-powered business advice.';

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