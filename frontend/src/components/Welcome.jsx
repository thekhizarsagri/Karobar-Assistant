import titleImg from '../assets/title-image.png';

function Welcome() {
  return (
    <div className="welcome-container">
      <img src={titleImg} alt="Karobar Assistant" className="title-image" draggable={false} onDragStart={(e)=>e.preventDefault()} onMouseDown={(e)=>e.preventDefault()} />

      <p>Manage production, sales, profits, and get AI-powered business advice.</p>

      <div className="action-container">
        <button type="button" className="register-btn" onMouseDown={(e)=>e.preventDefault()}>Register</button>
        <button type="button" className="demo-btn" onMouseDown={(e)=>e.preventDefault()}>Demo Mode</button>
      </div>

      <div className="login-section">
        Already have an account?
        <button type="button" className="login-btn" onMouseDown={(e)=>e.preventDefault()}>Login</button>
      </div>
    </div>
  );
}

export default Welcome;