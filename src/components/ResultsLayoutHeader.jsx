import './ResultsLayoutHeader.css'

export default function ResultsLayoutHeader({ onHome }) {
  return (
    <header className="rl-header">
      <div className="rl-header-top">
        <div className="rl-header-inner">
          <div className="rl-header-row">
            <button
              className="rl-logo"
              type="button"
              onClick={onHome}
              aria-label="SkyFinder 홈으로 이동"
            >
              <span className="rl-logo-mark" aria-hidden="true">✈</span>
              <span>SkyFinder</span>
            </button>

            <div className="rl-header-actions">
              <span className="rl-action">도움말</span>
              <span className="rl-action rl-locale">한국어 · 🇰🇷 대한민국 · ₩ KRW</span>
              <span className="rl-action rl-icon">♥</span>
              <span className="rl-profile">수권</span>
            </div>
          </div>

          <nav className="rl-tabs">
            <span className="rl-tab active">✈ 항공권</span>
            <span className="rl-tab">▰ 숙소</span>
            <span className="rl-tab">● 렌터카</span>
          </nav>
        </div>
      </div>
    </header>
  )
}
