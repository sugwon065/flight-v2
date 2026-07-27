import { useEffect, useState } from 'react'
import './SearchHome.css'

function formatPeriodRange(startDate, endDate) {
  if (!startDate || !endDate) return '여행 날짜 선택'
  const format = (value) => `${value.getFullYear()}년 ${value.getMonth() + 1}월 ${value.getDate()}일`
  return `${format(startDate)} – ${format(endDate)}`
}

const MINI_CALENDAR_DAYS = Array.from({ length: 31 }, (_, index) => index + 1)
const MINI_CALENDAR_OFFSET = 0

function MiniCalendar({ compact = false, highlightDays = [] }) {
  const rangeStart = highlightDays.length ? Math.min(...highlightDays) : null
  const rangeEnd = highlightDays.length ? Math.max(...highlightDays) : null

  return (
    <div className={`project-mini-calendar ${compact ? 'project-mini-calendar--compact' : ''}`}>
      <div className="project-mini-calendar-title">{compact ? '8월' : '2026년 8월'}</div>
      <div className="project-mini-weekdays">
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="project-mini-days">
        {Array.from({ length: MINI_CALENDAR_OFFSET }, (_, index) => (
          <span className="is-empty" aria-hidden="true" key={`empty-${index}`} />
        ))}
        {MINI_CALENDAR_DAYS.map((day) => {
          const gridIndex = MINI_CALENDAR_OFFSET + day - 1

          return (
            <span
              className={[
                rangeStart !== null && day >= rangeStart && day <= rangeEnd ? 'is-in-range' : '',
                day === rangeStart || gridIndex % 7 === 0 ? 'is-line-start' : '',
                day === rangeEnd || gridIndex % 7 === 6 ? 'is-line-end' : '',
                highlightDays.includes(day) ? 'is-point' : '',
              ].filter(Boolean).join(' ')}
              key={day}
            >
              <b>{day}</b>
            </span>
          )
        })}
      </div>
    </div>
  )
}

function ProjectDescriptionContent() {
  return (
    <div className="project-story">
      <section className="project-story-intro">
        <h3>최저 가격 찾기에서, 최저 가격 기간 찾기로</h3>
        <ul>
          <li>기존 항공권 서비스는 사용자가 정한 출발일과 귀국일을 기준으로 최저가 항공권을 제공합니다.</li>
          <li>하지만 날짜를 유연하게 조정할 수 있는 사용자는 언제 출발해야 가장 저렴한지 직접 비교해야 합니다.</li>
        </ul>
      </section>

      <h4 className="project-story-question">
        <span aria-hidden="true">▦</span>
        8월 중 3박 4일 왕복 항공권이 가장 저렴한 기간 찾기
      </h4>

      <section className="project-compare-grid">
        <article className="project-compare-card project-compare-card--old">
          <header className="project-compare-heading">
            <span className="project-compare-icon project-compare-icon--old" aria-hidden="true">⌕</span>
            <div>
              <h5>기존 방식</h5>
              <p>날짜를 바꿔가며 반복 검색</p>
            </div>
          </header>

          <div className="project-old-flow">
            <div className="project-calendar-stack">
              <MiniCalendar compact highlightDays={[1, 4]} />
              <MiniCalendar compact highlightDays={[2, 5]} />
              <span className="project-calendar-ellipsis" aria-hidden="true">...</span>
              <MiniCalendar compact highlightDays={[28, 31]} />
            </div>
            <div className="project-repeat-count">
              <span aria-hidden="true">↻</span>
              <small>검색</small>
              <strong>28번</strong>
              <small>반복</small>
            </div>
          </div>

          <div className="project-compare-note project-compare-note--old">
            <span aria-hidden="true">!</span>
            가능한 날짜를 하나씩 바꿔가며 직접 비교해야 함
          </div>
        </article>

        <article className="project-compare-card project-compare-card--new">
          <header className="project-compare-heading">
            <span className="project-compare-icon project-compare-icon--new" aria-hidden="true">✦</span>
            <div>
              <h5>개선 방식</h5>
              <p>가능한 모든 일정을 한 번에 비교</p>
            </div>
          </header>

          <div className="project-new-flow">
            <MiniCalendar highlightDays={[1, 31]} />
            <div className="project-benefits">
              <strong className="project-once-badge">✓&nbsp; 1회 검색</strong>
              <div>
                <span aria-hidden="true">⌕</span>
                <p><strong>한 번의 검색으로 비교</strong><small>모든 가능한 일정을 한눈에</small></p>
              </div>
              <div>
                <span aria-hidden="true">★</span>
                <p><strong>최저가 기간 자동 추천</strong><small>가장 저렴한 일정이 한눈에</small></p>
              </div>
              <div>
                <span aria-hidden="true">▥</span>
                <p><strong>직관적인 시각화 제공</strong><small>비교가 쉬운 캘린더 뷰</small></p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="project-core-value">
        <span className="project-target-icon" aria-hidden="true">!</span>
        <strong>데이터 안내:</strong>
        <p>임의로 생성한 데이터로 진행한 프로젝트입니다. 실제와 다릅니다.</p>
      </section>
    </div>
  )
}

export default function SearchHome({
  destinationId,
  destinations,
  onDestinationChange,
  startDate,
  endDate,
  onPeriodClick,
  tripDays,
  onTripDaysChange,
  airlineType,
  onAirlineTypeChange,
  onSearch,
  loading,
  error,
}) {
  const [projectOpen, setProjectOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [algorithmOpen, setAlgorithmOpen] = useState(false)

  useEffect(() => {
    if (!projectOpen && !guideOpen && !algorithmOpen) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setProjectOpen(false)
        setGuideOpen(false)
        setAlgorithmOpen(false)
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [algorithmOpen, guideOpen, projectOpen])

  return (
    <main className="search-home">
      <section className="sh-hero">
        <header className="sh-topbar sh-shell">
          <a className="sh-logo" href="#top" aria-label="SkyFinder 홈">
            <span className="sh-logo-mark" aria-hidden="true">✈</span>
            <span>SkyFinder</span>
          </a>

          <nav className="sh-topbar-actions" aria-label="보조 메뉴">
            <span className="sh-top-link">도움말</span>
            <span className="sh-top-icon" aria-label="언어">●</span>
            <span className="sh-top-icon sh-heart" aria-label="찜">♥</span>
            <a
              className="sh-avatar sh-github-button"
              href="https://github.com/sugwon065/flight-v2"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub 프로젝트 저장소 열기"
              title="GitHub"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.49v-1.91c-2.78.62-3.37-1.21-3.37-1.21-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.34 1.12 2.91.86.09-.66.35-1.12.64-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.34 9.34 0 0 1 12 6.93a9.3 9.3 0 0 1 2.5.35c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9v2.81c0 .27.18.59.69.49A10.25 10.25 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" />
              </svg>
            </a>
          </nav>
        </header>

        <div className="sh-hero-main sh-shell" id="top">
          <div className="sh-service-pills" aria-label="서비스">
            <button className="sh-pill active" type="button">
              <span aria-hidden="true">✈</span> 항공권
            </button>
            <button className="sh-pill" type="button" disabled>
              <span aria-hidden="true">▰</span> 숙소
            </button>
            <button className="sh-pill" type="button" disabled>
              <span aria-hidden="true">●</span> 렌터카
            </button>
          </div>

          <h1 className="sh-headline">수백만 개의 저가 항공권. 검색 한 번으로 간단하게.</h1>

          <div className="sh-search-area">
            <div className="sh-trip-controls">
              <span className="sh-trip-pill">왕복 <span aria-hidden="true">⌄</span></span>
              <span className="sh-trip-pill sh-trip-pill--muted">인천 출발</span>
            </div>

            <div className="sh-search-row">
              <div className="sh-search-grid">
                <div className="sh-field sh-field--origin">
                  <label>출발지</label>
                  <div className="sh-field-value">인천 국제 (ICN)</div>
                </div>

                <div className="sh-field sh-field--destination">
                  <span className="sh-swap" aria-hidden="true">⇄</span>
                  <label htmlFor="destination">도착지</label>
                  <select
                    id="destination"
                    value={destinationId}
                    onChange={(event) => onDestinationChange(event.target.value)}
                    className="sh-select"
                  >
                    {destinations.map((destination) => (
                      <option key={destination.id} value={destination.id}>
                        {destination.name}
                        {destination.airportCode && destination.id !== 'japan-all'
                          ? ` (${destination.airportCode})`
                          : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sh-field sh-field--select">
                  <label htmlFor="trip-days">여행 기간</label>
                  <select
                    id="trip-days"
                    value={tripDays}
                    onChange={(event) => onTripDaysChange(Number(event.target.value))}
                    className="sh-select"
                  >
                    {Array.from({ length: 15 }, (_, index) => index + 1).map((days) => (
                      <option key={days} value={days}>{days - 1}박 {days}일</option>
                    ))}
                  </select>
                </div>

                <button
                  className="sh-field sh-field--period"
                  onClick={onPeriodClick}
                  type="button"
                >
                  <span className="sh-label">여행 가능 날짜</span>
                  <span className="sh-field-value">{formatPeriodRange(startDate, endDate)}</span>
                </button>

                <div className="sh-field sh-field--select sh-field--airline">
                  <label htmlFor="airline-type">항공사</label>
                  <select
                    id="airline-type"
                    value={airlineType}
                    onChange={(event) => onAirlineTypeChange(event.target.value)}
                    className="sh-select"
                  >
                    <option value="ALL">전체 항공사</option>
                    <option value="LCC">저비용 항공사</option>
                    <option value="FSC">대한항공·아시아나 등</option>
                  </select>
                </div>
              </div>

              <button
                className="sh-search-btn"
                onClick={onSearch}
                disabled={loading}
                type="button"
              >
                {loading ? '검색 중' : '검색하기'}
              </button>
            </div>

            <div className="sh-options">
              <div className="sh-options-column">
                <label className="sh-checkbox">
                  <input type="checkbox" disabled />
                  <span>주변 공항 추가</span>
                </label>
                <label className="sh-checkbox">
                  <input type="checkbox" disabled />
                  <span>직항 항공편</span>
                </label>
              </div>
              <label className="sh-checkbox sh-checkbox--destination">
                <input type="checkbox" disabled />
                <span>주변 공항 추가</span>
              </label>
              <label className="sh-checkbox sh-checkbox--stay">
                <input type="checkbox" defaultChecked disabled />
                <span>숙소 추가</span>
              </label>
            </div>
          </div>

          {error && <p className="sh-error" role="alert">{error}</p>}
        </div>
      </section>

      <section className="sh-content">
        <div className="sh-content-inner sh-shell">
          <div className="sh-quick-links">
            <button
              className="sh-quick-card sh-quick-card--guide"
              type="button"
              onClick={() => setProjectOpen(true)}
              aria-haspopup="dialog"
            >
              <small>클릭하세요</small>
              <strong>프로젝트 설명</strong>
            </button>
            <button
              className="sh-quick-card sh-quick-card--guide"
              type="button"
              onClick={() => setGuideOpen(true)}
              aria-haspopup="dialog"
            >
              <small>클릭하세요</small>
              <strong>사용법</strong>
            </button>
            <button
              className="sh-quick-card"
              type="button"
              onClick={() => setAlgorithmOpen(true)}
              aria-haspopup="dialog"
            >
              <strong>알고리즘</strong>
            </button>
          </div>

          <article className="sh-promo-banner">
            <div className="sh-promo-copy">
              <span className="sh-promo-kicker">SKYFINDER PRICE GUIDE</span>
              <h2>언제 떠날지<br />고민되나요?</h2>
              <p>여행 가능한 기간만 선택하면 지역별 최저가 날짜를 한눈에 비교해 드려요.</p>
              <span className="sh-promo-link">최저가 날짜 찾아보기 <b aria-hidden="true">→</b></span>
            </div>
            <div className="sh-promo-visual" aria-hidden="true">
              <span className="sh-plane">✈</span>
              <span className="sh-calendar">12</span>
            </div>
          </article>
        </div>
      </section>

      {projectOpen && (
        <div
          className="sh-modal-backdrop"
          role="presentation"
          onMouseDown={() => setProjectOpen(false)}
        >
          <section
            className="sh-project-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="sh-project-modal-header">
              <div>
                <span className="sh-project-modal-kicker">SKYFINDER PROJECT</span>
                <h2 id="project-modal-title">프로젝트 설명</h2>
              </div>
              <button
                className="sh-project-modal-close"
                type="button"
                onClick={() => setProjectOpen(false)}
                aria-label="프로젝트 설명 닫기"
              >
                ×
              </button>
            </header>
            <div className="sh-project-modal-body">
              <ProjectDescriptionContent />
            </div>
          </section>
        </div>
      )}

      {guideOpen && (
        <div
          className="sh-modal-backdrop"
          role="presentation"
          onMouseDown={() => setGuideOpen(false)}
        >
          <section
            className="sh-project-modal sh-guide-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="sh-project-modal-header">
              <div>
                <span className="sh-project-modal-kicker">SKYFINDER GUIDE</span>
                <h2 id="guide-modal-title">사용법</h2>
              </div>
              <button
                className="sh-project-modal-close"
                type="button"
                onClick={() => setGuideOpen(false)}
                aria-label="사용법 닫기"
              >
                ×
              </button>
            </header>

            <div className="sh-project-modal-body sh-guide-body">
              <div className="sh-guide-overview">
                <div className="sh-guide-overview-copy">
                  <blockquote className="sh-guide-question sh-guide-question--compact">
                    <span aria-hidden="true">“</span>
                    <p>여름 휴가로 8~9월 사이에 후쿠오카<br />4박 5일 여행을 갈 건데 <strong>언제가 저렴할까?</strong></p>
                    <span aria-hidden="true">”</span>
                  </blockquote>
                </div>

              </div>

              <ol className="sh-guide-flow">
                <li className="sh-guide-step-card">
                  <header><span>1</span><strong>도착지 후쿠오카 선택</strong></header>
                  <div className="sh-guide-shot">
                    <img src="/guide-destination.png" alt="도착지 목록에서 후쿠오카를 선택하는 화면" />
                  </div>
                </li>

                <li className="sh-guide-step-card">
                  <header><span>2</span><strong>여행 일수 선택</strong></header>
                  <div className="sh-guide-shot">
                    <img src="/guide-duration.png" alt="여행 기간 목록에서 4박 5일을 선택하는 화면" />
                  </div>
                </li>

                <li className="sh-guide-step-card">
                  <header><span>3</span><strong>검색 기간 선택</strong></header>
                  <div className="sh-guide-shot">
                    <img src="/guide-period.png" alt="8월부터 9월까지 여행 가능 날짜를 선택하는 화면" />
                  </div>
                </li>
              </ol>

              <div className="sh-guide-flow-arrows" aria-hidden="true">
                <span>→</span>
                <span>→</span>
              </div>
            </div>
          </section>
        </div>
      )}

      {algorithmOpen && (
        <div
          className="sh-modal-backdrop"
          role="presentation"
          onMouseDown={() => setAlgorithmOpen(false)}
        >
          <section
            className="sh-project-modal sh-algorithm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="algorithm-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="sh-project-modal-header">
              <div>
                <span className="sh-project-modal-kicker">SKYFINDER LOGIC</span>
                <h2 id="algorithm-modal-title">최적 기간 추천 알고리즘</h2>
              </div>
              <button
                className="sh-project-modal-close"
                type="button"
                onClick={() => setAlgorithmOpen(false)}
                aria-label="알고리즘 닫기"
              >
                ×
              </button>
            </header>

            <div className="sh-project-modal-body sh-algorithm-body">
              <section className="sh-algorithm-intro">
                <span>REVISED ALGORITHM</span>
                <h3>여러 지역·여러 기간의 최저가 Top 5</h3>
                <p>
                  검색 범위 안의 모든 가능한 일정을 비교한 뒤, 비슷한 지역과 날짜를
                  제거해 다양한 최저가 일정을 추천합니다.
                </p>
              </section>

              <ol className="sh-algorithm-pipeline">
                <li>
                  <span>01</span>
                  <strong>조건 필터링</strong>
                  <p>목적지 · 여행 일수 · 날짜 · 항공사</p>
                </li>
                <li>
                  <span>02</span>
                  <strong>최저가 선택</strong>
                  <p>같은 지역·날짜에서 왕복 최종가가 가장 낮은 항공권</p>
                </li>
                <li>
                  <span>03</span>
                  <strong>유사 일정 제거</strong>
                  <p>같은 지역·같은 출발 주차는 가장 싼 일정 하나만</p>
                </li>
                <li>
                  <span>04</span>
                  <strong>다양성 적용</strong>
                  <p>지역 중복 방지 · 출발 주차 분산 · 여러 달 분산</p>
                </li>
                <li>
                  <span>05</span>
                  <strong>Top 5 정렬</strong>
                  <p>가격 → 할인율 → 출발일 순</p>
                </li>
              </ol>

              <div className="sh-algorithm-rules">
                <article>
                  <span>DATE</span>
                  <h4>기간 조건</h4>
                  <p>출발일은 검색 시작일 이후, 귀국일은 검색 종료일 이전이어야 합니다.</p>
                </article>
                <article>
                  <span>AREA</span>
                  <h4>지역 규칙</h4>
                  <p>일본 전체 검색은 서로 다른 목적지를, 특정 지역 검색은 서로 다른 출발 주차를 우선합니다.</p>
                </article>
                <article>
                  <span>RANGE</span>
                  <h4>분산 규칙</h4>
                  <p>같은 주에 시작하는 유사 일정은 하나만 남기고, 여러 달 검색은 월별 후보를 우선 포함합니다.</p>
                </article>
              </div>

              <div className="sh-algorithm-relax">
                <strong>후보가 5개보다 적을 때만 규칙 완화</strong>
                <span>월 다양성 완화</span>
                <b aria-hidden="true">→</b>
                <span>주차 중복 일부 허용</span>
                <b aria-hidden="true">→</b>
                <span>목적지 중복 허용</span>
              </div>

              <p className="sh-algorithm-core">
                가격을 1순위로 유지하면서 지역과 기간의 다양성을 규칙으로 보장합니다.
              </p>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
