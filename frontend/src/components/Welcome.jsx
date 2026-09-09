import titleImg from "../assets/title-image.png";
import titleImgDark from "../assets/title-image-dark.png";
import { useTheme } from "../ThemeContext";

const FEATURES = [
  {
    title: "Track Performance",
    text: "Monitor sales, profit, expenses & more",
    tileClass: "welcome-feature-icon--green",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <line x1="5" y1="20" x2="5" y2="14" />
        <line x1="12" y1="20" x2="12" y2="8" />
        <line x1="19" y1="20" x2="19" y2="4" />
      </svg>
    ),
  },
  {
    title: "AI Insights",
    text: "Get smart suggestions to improve your business",
    tileClass: "welcome-feature-icon--blue",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6" />
        <path d="M10 21h4" />
        <path d="M12 3a6 6 0 0 0-3.5 10.9c.8.6 1.5 1.5 1.5 2.6V17h4v-.5c0-1.1.7-2 1.5-2.6A6 6 0 0 0 12 3z" />
      </svg>
    ),
  },
  {
    title: "Manage Inventory",
    text: "Keep track of your stock in real-time",
    tileClass: "welcome-feature-icon--purple",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
        <path d="M3 8l9 5 9-5" />
        <path d="M12 13v8" />
      </svg>
    ),
  },
  {
    title: "Grow Faster",
    text: "Make data-driven decisions with confidence",
    tileClass: "welcome-feature-icon--teal",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

function Welcome({ onDemoClick }) {
  const { dark, toggle } = useTheme();

  return (
    <div className="welcome-container">
      {/* soft background wave */}
      <svg className="welcome-bg-wave" viewBox="0 0 600 500" fill="none" aria-hidden="true" preserveAspectRatio="none">
        <path d="M20 380 C 150 380, 180 180, 300 180 S 450 60, 580 120" stroke="#bfdbfe" strokeOpacity="0.55" strokeWidth="2" />
      </svg>

      {/* top bar */}
      <header className="welcome-topbar">
        <div className="welcome-brand">
          <img
            src={dark ? titleImgDark : titleImg}
            alt="Karobar Assistant"
            className="welcome-brand-logo"
            draggable={false}
          />
        </div>
        <div className="welcome-topbar-right">
          <button type="button" className="welcome-theme-toggle" onClick={toggle} aria-label="Toggle theme">
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <div className="welcome-hero">
        {/* left column */}
        <div className="welcome-left">
          <h1 className="welcome-heading">
            Turn Your Business Data<br />
            Into <span className="welcome-heading-green">Smart</span>{" "}
            <span className="welcome-heading-blue">Decisions</span>
          </h1>

          <p className="welcome-lead">
            Karobar Assistant helps you analyze your business performance, track
            sales, manage inventory and get AI-powered insights to grow your
            business faster.
          </p>

          <div className="welcome-features">
            {FEATURES.map((f) => (
              <div className="welcome-feature" key={f.title}>
                <span className={`welcome-feature-icon ${f.tileClass}`}>
                  {f.icon}
                </span>
                <strong className="welcome-feature-title">{f.title}</strong>
                <span className="welcome-feature-text">{f.text}</span>
              </div>
            ))}
          </div>

          <button type="button" className="welcome-demo-card" onClick={onDemoClick}>
            <span className="welcome-demo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="13" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </span>
            <span className="welcome-demo-texts">
              <strong className="welcome-demo-title">Try Demo Mode</strong>
              <span className="welcome-demo-sub">Explore the app without creating an account</span>
            </span>
            <span className="welcome-demo-arrow" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          </button>

          <p className="welcome-script" aria-hidden="true">
            <span>Build</span>
            <span className="welcome-script-dot">·</span>
            <span className="welcome-script-analyze">
              Analyze
              <svg viewBox="0 0 90 12" preserveAspectRatio="none" aria-hidden="true">
                <path d="M3 9 C 30 3, 60 3, 87 7" stroke="#34d399" strokeWidth="3" strokeLinecap="round" fill="none" />
              </svg>
            </span>
            <span className="welcome-script-dot">·</span>
            <span>Grow</span>
          </p>
        </div>

        {/* right column — login card */}
        <div className="welcome-right">
          <div className="welcome-login-card">
            <div className="welcome-login-head">
              <span className="welcome-lang-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" />
                </svg>
                EN
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </div>

            <h2 className="welcome-login-title">Welcome Back</h2>
            <p className="welcome-login-sub">Log in to your account to continue</p>

            <div className="welcome-input-group">
              <span className="welcome-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
              <input type="email" placeholder="Enter your email address" className="welcome-input" disabled />
            </div>

            <div className="welcome-input-group">
              <span className="welcome-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input type="password" placeholder="Enter your password" className="welcome-input" disabled />
              <span className="welcome-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <line x1="2" y1="2" x2="22" y2="22" />
                </svg>
              </span>
            </div>

            <div className="welcome-forgot-row">
              <a href="#" className="welcome-forgot-link" onClick={(e) => e.preventDefault()}>Forgot password?</a>
            </div>

            <button type="button" className="welcome-login-btn" disabled>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Login
            </button>

            <div className="welcome-divider">
              <span>OR</span>
            </div>

            <button type="button" className="welcome-social-btn welcome-google-btn" disabled>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <button type="button" className="welcome-social-btn welcome-linkedin-btn" disabled>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0a66c2">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              Continue with LinkedIn
            </button>

            <p className="welcome-signup-text">
              Don&rsquo;t have an account? <a href="#" onClick={(e) => e.preventDefault()}>Sign Up</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
