import { useState } from 'react'
import ResultsLayoutHeader from './ResultsLayoutHeader'
import ResultsSearchBar from './ResultsSearchBar'
import FilterSidebar from './FilterSidebar'
import PromoSidebar from './PromoSidebar'
import ResultsList from './ResultsList'
import CalendarView from './CalendarView'
import './ResultsPage.css'
import './FilterSidebar.css'

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
  stage,
  onSelectRegion,
  onBackToRegions,
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
  const [activeRank, setActiveRank] = useState(stage === 'periods' ? results[0]?.rank ?? null : null)

  const isRegionStage = stage === 'regions'
  const displayResults = results
  const calendarResults = results
  const toLocalDate = (value) => {
    if (!value) return null
    if (value instanceof Date) return value
    return new Date(`${value}T00:00:00`)
  }
  const calendarStart = toLocalDate(startDate)
  const calendarEnd = toLocalDate(endDate)

  const handleCalendarTripClick = (rank) => {
    if (isRegionStage) {
      const region = results.find((item) => item.rank === rank)
      if (region) {
        onSelectRegion(region)
        window.scrollTo({ top: 0, behavior: 'auto' })
      }
      return
    }
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
            <div className="results-stage-header">
              <h1>{isRegionStage ? '1단계 · 저렴한 지역 5개' : destination + ' · 저렴한 여행 기간 5개'}</h1>
              <p>{isRegionStage
                ? '지역별 가장 저렴한 일정을 비교했습니다. 출발일의 숫자나 아래 지역 카드를 선택해 여행 기간을 비교해 보세요.'
                : '처음 선택한 날짜 범위 안에서 왕복 가격이 낮은 순서입니다. 기간이 겹치는 일정도 포함합니다.'}</p>
              {onBackToRegions && (
                <button className="results-region-back" onClick={onBackToRegions} type="button">← 저렴한 지역 5개 다시 보기</button>
              )}
            </div>
            {!loading && results.length > 0 && (
              <section className="results-calendar-card" aria-label="최저가 출발일 달력">
                <div className="results-calendar-panel">
                  <CalendarView
                    startDate={calendarStart}
                    endDate={calendarEnd}
                    results={calendarResults}
                    activeRank={activeRank}
                    regionStage={isRegionStage}
                    onTripClick={handleCalendarTripClick}
                    readOnly
                    initialYear={calendarStart?.getFullYear() || 2026}
                    initialMonth={calendarStart?.getMonth() || 0}
                    showNav
                    tripActionLabel={isRegionStage ? '저렴한 기간 5개 보기' : '항공권 보기'}
                    title={formatSelectedPeriod(startDate, endDate)}
                  />
                </div>
              </section>
            )}

            {!loading && results.length > 0 && (
              <div className="results-order-label">{isRegionStage ? '지역별 최저가 순' : '여행 기간별 최저가 순'}</div>
            )}

            {error && <p className="results-page-error">{error}</p>}

            <ResultsList
              results={displayResults}
              loading={loading}
              tripDays={tripDays}
              destination={destination}
              activeRank={activeRank}
              onSelect={(item) => handleCalendarTripClick(item.rank)}
              selectLabel={isRegionStage ? '이 지역의 기간 5개 보기' : '이 일정 선택'}
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
