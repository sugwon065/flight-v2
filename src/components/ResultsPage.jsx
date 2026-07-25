import { useState } from 'react'
import ResultsLayoutHeader from './ResultsLayoutHeader'
import ResultsSearchBar from './ResultsSearchBar'
import FilterSidebar from './FilterSidebar'
import PromoSidebar from './PromoSidebar'
import ResultsList from './ResultsList'
import CalendarView from './CalendarView'
import './ResultsPage.css'
import './FilterSidebar.css'

const RANK_COLORS = ['#22c55e', '#86efac', '#fde047', '#fb923c', '#ef4444']

function formatSelectedPeriod(startDate, endDate) {
  const format = (value) => {
    if (!value) return ''
    const date = value instanceof Date ? value : new Date(`${value}T00:00:00`)
    const year = String(date.getFullYear()).slice(-2)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}/${month}/${day}`
  }

  return `${format(startDate)} ~ ${format(endDate)}`
}

export default function ResultsPage({
  destination,
  startDate,
  endDate,
  tripDays,
  results,
  loading,
  error,
  onBack,
  onSearchAgain,
}) {
  const [timeOpen, setTimeOpen] = useState(true)
  const [activeRank, setActiveRank] = useState(null)

  const displayResults = [...results]
    .sort((left, right) => left.round_trip_price - right.round_trip_price)
    .map((item, index) => ({ ...item, rank: index + 1, color: RANK_COLORS[index] }))

  const calendarResults = [...results]
    .sort((left, right) => left.round_trip_price - right.round_trip_price)
    .slice(0, 5)
    .map((item, index) => ({ ...item, rank: index + 1, color: RANK_COLORS[index] }))
  const calendarRanges = calendarResults.map((item) => ({
    start: item.departure_date,
    end: item.return_date,
    color: item.color,
    rank: item.rank,
    destination: item.destination,
  }))
  const toLocalDate = (value) => {
    if (!value) return null
    if (value instanceof Date) return value
    return new Date(`${value}T00:00:00`)
  }
  const calendarStart = toLocalDate(startDate)
  const calendarEnd = toLocalDate(endDate)

  const handleCalendarTripClick = (rank) => {
    setActiveRank(rank)
    window.requestAnimationFrame(() => {
      document
        .getElementById(`flight-result-${rank}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  return (
    <div className="results-page">
      <ResultsLayoutHeader onHome={onBack} />
      <ResultsSearchBar
        destination={destination}
        startDate={startDate}
        endDate={endDate}
        tripDays={tripDays}
        onBack={onBack}
      />

      <div className="results-shell">
        <div className="results-grid">
          <div className="results-col-left">
            <button className="price-alert-button" type="button">
              <span aria-hidden="true">●</span>
              가격 변동 알림 받기
            </button>
            <FilterSidebar
              timeOpen={timeOpen}
              onToggleTime={() => setTimeOpen((v) => !v)}
              minPrice={results.length ? Math.min(...results.map((item) => item.round_trip_price)) : 0}
            />
          </div>

          <main className="results-col-center">
            {!loading && results.length > 0 && (
              <section className="results-calendar-card" aria-label="최저가 출발일 달력">
                <div className="results-calendar-panel">
                  <CalendarView
                    startDate={calendarStart}
                    endDate={calendarEnd}
                    results={calendarResults}
                    tripRanges={calendarRanges}
                    onTripClick={handleCalendarTripClick}
                    readOnly
                    initialYear={calendarStart?.getFullYear() || 2026}
                    initialMonth={calendarStart?.getMonth() || 0}
                    showNav={false}
                    title={formatSelectedPeriod(startDate, endDate)}
                  />
                </div>
              </section>
            )}

            {!loading && results.length > 0 && (
              <div className="results-order-label">최저가 순</div>
            )}

            {error && <p className="results-page-error">{error}</p>}

            <ResultsList
              results={displayResults}
              loading={loading}
              tripDays={tripDays}
              destination={destination}
              activeRank={activeRank}
              embedded
              showPromo={false}
            />

            {!loading && (
              <button className="search-again-btn" onClick={onSearchAgain} type="button">
                조건 변경하고 다시 검색
              </button>
            )}
          </main>

          <PromoSidebar destination={destination} />
        </div>
      </div>
    </div>
  )
}
