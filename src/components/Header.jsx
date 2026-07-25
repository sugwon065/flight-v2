import './Header.css'

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="14" fill="#0770e3" />
            <path
              d="M8 14.5L12 10.5L16 14.5L20 10.5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M12 17.5H16" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="logo-text">SkyFinder</span>
        </div>
        <nav className="header-nav">
          <span>항공권</span>
          <span>호텔</span>
          <span>렌터카</span>
        </nav>
      </div>
    </header>
  )
}
