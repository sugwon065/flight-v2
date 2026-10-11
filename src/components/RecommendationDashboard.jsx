import { useEffect, useMemo, useRef, useState } from 'react'
import { getDailyFlightPrices, PRICE_COLORS } from '../services/flightData'
import { DESTINATION_IMAGES, HERO_IMAGE_CREDIT } from './destinationImages'
import './RecommendationDashboard.css'
import DateRangePicker from './DateRangePicker'
import TripDurationSelect from './TripDurationSelect'
import ResultsList from './ResultsList'
import DestinationMap from './DestinationMap'
import TRAVEL_DATE_RANGE from '../services/travelDateRange.json'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const LEVELS = ['최저가 구간', '저렴한 편', '보통', '비싼 편', '매우 비쌈']
const DESTINATION_ORDER = [
  'fukuoka', 'osaka-kansai', 'tokyo-narita', 'tokyo-haneda', 'sapporo', 'okinawa', 'nagoya',
  'hiroshima', 'kobe', 'kumamoto', 'kagoshima', 'sendai', 'matsuyama', 'shizuoka',
  'kitakyushu', 'takamatsu', 'oita', 'saga', 'yonago', 'okayama', 'komatsu', 'niigata',
  'hakodate', 'miyazaki', 'aomori',
]
const money = (price) => price.toLocaleString('ko-KR')
const shortDate = (iso) => Number(iso.slice(5, 7)) + '/' + Number(iso.slice(8, 10))

function Icon({ name, size = 20, ...props }) {
  const paths = {
    plane: <path d="m21 3-6.4 7L3 7l-1 2 9 5-5 5-3-1-1 1 4 3 3-1 5-6 5 9 2-1-3-12L23 5Z" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2" /></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" /><path d="M9 3v15m6-12v15" /></>,
    chevron: <path d="m9 5 7 7-7 7" />,
    crown: <><path d="m3 6 4 5 5-8 5 8 4-5-2 14H5Z" /><path d="M6 16h12" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10v1" /></>,
    check: <path d="m5 12 4 4 10-10" />,
    reset: <><path d="M3 10a9 9 0 1 1 2.6 8.4" /><path d="M3 4v6h6" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>
}

function toMonthIndex(iso) {
  const [year, month] = iso.slice(0, 7).split('-').map(Number)
  return year * 12 + month - 1
}

function PriceCalendar({ daily, periods, city, conditions, selectedDate, onSelectDate }) {
  const pricesByDate = useMemo(() => new Map(daily.map((item) => [item.departure_date, item])), [daily])
  const lowestDate = useMemo(() => daily.reduce((lowest, item) => {
    if (!lowest || item.round_trip_price < lowest.round_trip_price
      || (item.round_trip_price === lowest.round_trip_price && item.departure_date < lowest.departure_date)) return item
    return lowest
  }, null)?.departure_date, [daily])
  const firstMonth = toMonthIndex(conditions.startDate)
  const lastMonth = toMonthIndex(conditions.endDate)
  const visibleMonthCount = Math.min(2, lastMonth - firstMonth + 1)
  const lastStartMonth = lastMonth - visibleMonthCount + 1
  const initialMonth = toMonthIndex(selectedDate || periods[0]?.departure_date || conditions.startDate)
  const [viewMonth, setViewMonth] = useState(() => Math.max(firstMonth, Math.min(lastStartMonth, initialMonth)))
  const selectedTrip = pricesByDate.get(selectedDate)
  const selectedReturnDate = selectedTrip?.return_date
  useEffect(() => {
    setViewMonth((current) => {
      const bounded = Math.max(firstMonth, Math.min(lastStartMonth, current))
      if (!selectedDate) return bounded
      const departureMonth = toMonthIndex(selectedDate)
      const returnMonth = toMonthIndex(selectedReturnDate || selectedDate)
      if (departureMonth >= bounded && returnMonth < bounded + visibleMonthCount) return bounded
      return Math.max(firstMonth, Math.min(lastStartMonth, departureMonth))
    })
  }, [selectedDate, selectedReturnDate, firstMonth, lastStartMonth, visibleMonthCount])
  const currentMonth = Math.max(firstMonth, Math.min(lastStartMonth, viewMonth))
  const visibleMonths = Array.from({ length: visibleMonthCount }, (_, index) => {
    const monthIndex = currentMonth + index
    const year = Math.floor(monthIndex / 12)
    const month = monthIndex % 12 + 1
    const iso = year + '-' + String(month).padStart(2, '0')
    const count = new Date(year, month, 0).getDate()
    const offset = new Date(year, month - 1, 1).getDay()
    return { year, month, iso, count, offset }
  })
  const cellCount = Math.max(...visibleMonths.map(({ count, offset }) => Math.ceil((offset + count) / 7))) * 7
  const isDual = visibleMonthCount === 2
  const move = (amount) => setViewMonth((current) => Math.max(firstMonth, Math.min(lastStartMonth, current + amount)))
  const previousButton = <button type="button" aria-label="이전 달" disabled={currentMonth <= firstMonth} onClick={() => move(-1)}><Icon name="chevron" className="sf-flip" /></button>
  const nextButton = <button type="button" aria-label="다음 달" disabled={currentMonth >= lastStartMonth} onClick={() => move(1)}><Icon name="chevron" /></button>

  return <div className={'sf-calendar' + (isDual ? ' sf-calendar--dual' : '')}>
    <div className="sf-calendar-toolbar">
      {!isDual && <div className="sf-month-navigation">
        {previousButton}<h3>{visibleMonths[0].year}년 {visibleMonths[0].month}월</h3>{nextButton}
      </div>}
      <div className="sf-price-legend" aria-label="가격 색상 범례">{LEVELS.map((level, index) => <span key={level}><i style={{ backgroundColor: PRICE_COLORS[index] }} />{level}</span>)}</div>
    </div>
    <div className={'sf-calendar-months' + (isDual ? ' sf-calendar-months--dual' : '')}>
      {visibleMonths.map(({ year, month, iso: monthIso, count, offset }, monthIndex) => {
        const cells = Array.from({ length: cellCount }, (_, index) => {
          const day = index - offset + 1
          if (day < 1 || day > count) return <div className="sf-price-day sf-price-day--empty" key={'empty-' + index} aria-hidden="true" />
          const iso = monthIso + '-' + String(day).padStart(2, '0')
          const outside = iso < conditions.startDate || iso > conditions.endDate
          const offer = outside ? undefined : pricesByDate.get(iso)
          const isLowest = Boolean(offer && iso === lowestDate)
          const inTrip = selectedTrip && iso >= selectedTrip.departure_date && iso <= selectedTrip.return_date
          const rangeStart = inTrip && iso === selectedTrip.departure_date
          const rangeEnd = inTrip && iso === selectedTrip.return_date
          const isDeparture = iso === selectedTrip?.departure_date
          const isReturn = iso === selectedTrip?.return_date
          return <button key={iso} type="button" className={'sf-price-day' + (selectedDate === iso ? ' is-selected' : '') + (inTrip ? ' is-travel-range' : '') + (rangeStart ? ' is-range-start' : '') + (rangeEnd ? ' is-range-end' : '') + (!offer ? ' is-unavailable' : '')}
            style={offer ? { backgroundColor: offer.price_color } : undefined} disabled={!offer}
            onClick={() => onSelectDate(iso)} aria-pressed={selectedDate === iso}
            aria-label={offer ? `${city.destination} ${month}월 ${day}일 출발 ${shortDate(offer.return_date)} 귀국 왕복 ${money(offer.round_trip_price)}원${isLowest ? ' 최저가' : ''}` : isReturn ? `${city.destination} ${month}월 ${day}일 선택한 일정의 귀국일` : `${month}월 ${day}일 ${inTrip ? '선택한 여행 일정' : outside ? '검색 기간 밖' : '가능한 왕복 일정 없음'}`}>
            <span className="sf-price-day-number">{day}{(isDeparture || isReturn) && <span className="sf-trip-endpoint-label">{isDeparture && isReturn ? '출발·귀국' : isDeparture ? '출발' : '귀국'}</span>}{isLowest && <span className="sf-day-lowest">최저가</span>}</span>
            {offer ? <span className={'sf-price-day-fare' + (isLowest ? ' is-recommended' : '')}>{money(offer.round_trip_price)}<span>원</span></span> : <span className="sf-price-day-empty-label">-</span>}
          </button>
        })
        return <section className="sf-calendar-month" key={monthIso} aria-label={year + '년 ' + month + '월 가격 달력'}>
          {isDual && <div className="sf-month-navigation sf-calendar-month-heading">
            {monthIndex === 0 ? previousButton : <span className="sf-month-navigation-spacer" aria-hidden="true" />}
            <h3>{year}년 {month}월</h3>
            {monthIndex === visibleMonthCount - 1 ? nextButton : <span className="sf-month-navigation-spacer" aria-hidden="true" />}
          </div>}
          <div className="sf-calendar-grid" aria-label={city.destination + ' ' + year + '년 ' + month + '월 날짜별 왕복 가격 달력'}>
            {WEEKDAYS.map((day, index) => <div key={day} className={'sf-calendar-weekday' + (index === 0 ? ' is-sunday' : index === 6 ? ' is-saturday' : '')}>{day}</div>)}
            {cells}
          </div>
        </section>
      })}
    </div>
  </div>
}

function DestinationPhoto({ city, photo }) {
  const [failed, setFailed] = useState(false)
  if (!photo || failed) return <span className="sf-city-photo-placeholder"><Icon name="pin" size={26} /><span>{city.destination}</span></span>
  return <img src={photo.src} alt={photo.alt} onError={() => setFailed(true)} style={{ objectPosition: photo.position || 'center' }} />
}

export default function RecommendationDashboard({ form, onFormChange, conditions, destinations, cities, selectedCity,
  cityCandidates, periods, selectedDate, selectedOffer, onSelectDate, onSelectCity, onBackToCities, onSearch, onReset, hasSearched, loading, error, dirty }) {
  const [guideOpen, setGuideOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [durationOpen, setDurationOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(true)
  const calendarRef = useRef(null)
  const searchRef = useRef(null)
  const guideRef = useRef(null)
  const guideTrigger = useRef(null)
  const citiesRef = useRef(null)
  useEffect(() => {
    if (!guideOpen) return
    const previousFocus = guideTrigger.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const close = (event) => {
      if (event.key === 'Escape') setGuideOpen(false)
      if (event.key === 'Tab') {
        const controls = guideRef.current?.querySelectorAll('button, a, input, select, [tabindex="0"]')
        if (!controls?.length) return
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', close)
    return () => { window.removeEventListener('keydown', close); document.body.style.overflow = previousOverflow; previousFocus?.focus() }
  }, [guideOpen])
  const singleDestinationMode = conditions.destinationIds.length === 1
  const orderedDestinations = useMemo(() => destinations.filter((item) => item.id !== 'japan-all').sort((left, right) => {
    const leftIndex = DESTINATION_ORDER.indexOf(left.id)
    const rightIndex = DESTINATION_ORDER.indexOf(right.id)
    return (leftIndex < 0 ? DESTINATION_ORDER.length : leftIndex)
      - (rightIndex < 0 ? DESTINATION_ORDER.length : rightIndex)
      || left.name.localeCompare(right.name, 'ko')
  }), [destinations])
  const toggleDestination = (id) => {
    const selected = form.destinationIds
    onFormChange('destinationIds', selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id])
  }
  const shizuokaIndex = orderedDestinations.findIndex((destination) => destination.id === 'shizuoka')
  const destinationRowBreak = shizuokaIndex < 0 ? orderedDestinations.length : shizuokaIndex
  const renderDestinationButton = (destination) => {
    const selected = form.destinationIds.includes(destination.id)
    return <button key={destination.id} type="button" className={'sf-destination-chip' + (selected ? ' is-selected' : '')}
      aria-pressed={selected} onClick={() => toggleDestination(destination.id)}>{destination.name}</button>
  }
  const openDestinationSelection = () => {
    if (singleDestinationMode) {
      searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      document.getElementById('sf-destination-all')?.focus({ preventScroll: true })
      return
    }
    onBackToCities()
  }
  const resetSearch = () => {
    setDurationOpen(false)
    setMapOpen(true)
    setDatePickerOpen(false)
    setGuideOpen(false)
    onReset()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const submitSearch = async (event) => {
    event.preventDefault()
    setDurationOpen(false)
    setMapOpen(false)
    const singleDestinationSearch = form.destinationIds.length === 1
    const searched = await onSearch()
    if (searched) window.requestAnimationFrame(() => {
      const target = singleDestinationSearch ? calendarRef.current : citiesRef.current
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
  const selectCity = (city) => {
    onSelectCity(city)
    window.requestAnimationFrame(() => citiesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const destinationCode = destinations.find((destination) => destination.id === selectedCity?.destination_id)?.airportCode
  const dailyPrices = useMemo(() => getDailyFlightPrices(cityCandidates), [cityCandidates])
  const selectedRecommendedRank = periods.find((period) => period.departure_date === selectedDate)?.rank
  const selectedFlightOffer = selectedOffer
    ? { ...selectedOffer, rank: 0, price_color: dailyPrices.find((item) => item.departure_date === selectedDate)?.price_color ?? PRICE_COLORS[0] }
    : null
  const photoCredits = [...new Set(cities.map((city) => city.destination_id))].filter((id) => DESTINATION_IMAGES[id])

  return <div className="sf-dashboard">
    <header className="sf-header">
      <div className="sf-container sf-header-inner">
        <button className="sf-brand" type="button" onClick={openDestinationSelection} aria-label="SkyFinder 여행 검색"><Icon name="plane" size={30} /><span>Sky<span>Finder</span></span></button>
        <nav aria-label="주요 메뉴" className="sf-navigation">
          <button type="button" className="is-active" onClick={openDestinationSelection}>항공권 비교</button>
          <button type="button" onClick={(event) => { guideTrigger.current = event.currentTarget; setGuideOpen(true) }}>이용 방법</button>
        </nav>
        <button type="button" className="sf-header-reset" onClick={resetSearch} aria-label="검색 초기화"><Icon name="reset" size={16} /><span>초기화</span></button>
      </div>
    </header>

    <section className="sf-hero">
      <div className="sf-container sf-hero-inner">
        <div className="sf-hero-copy"><h1><span>떠날 수 있는 날 중,</span><em>가장 저렴한 날로.</em></h1></div>
        <div className="sf-step-guide">
          <div className="sf-steps">
            <button type="button" onClick={() => { searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setDatePickerOpen(true) }} className={dirty || !selectedCity ? 'is-current' : 'is-complete'} aria-current={dirty || !selectedCity ? 'step' : undefined}><b>1</b><span>여행 일정 선택</span></button>
            <span className="sf-step-line" />
            <button type="button" className={!dirty && selectedCity ? 'sf-step is-current' : 'sf-step'} aria-current={!dirty && selectedCity ? 'step' : undefined} onClick={() => (singleDestinationMode ? searchRef.current : citiesRef.current)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><b>2</b><span>도시 선택</span></button>
          </div>
        </div>
      </div>
    </section>

    <main className="sf-container sf-main">
      <form className="sf-search-panel" ref={searchRef} onSubmit={submitSearch} aria-label="여행 조건 검색">
        <div className="sf-search-primary">
          <div className="sf-origin sf-search-field"><Icon name="pin" /><div><span className="sf-field-label">출발지</span><strong>인천 (ICN)</strong></div></div>
          <TripDurationSelect value={form.tripDays} onChange={(days) => onFormChange('tripDays', days)} open={durationOpen} onOpenChange={setDurationOpen} icon={<Icon name="calendar" />} />
          <button type="button" className="sf-search-field sf-date-field sf-date-trigger" aria-label="여행 후보 기한 선택" aria-haspopup="dialog" aria-expanded={datePickerOpen} onClick={() => setDatePickerOpen(true)}>
            <Icon name="calendar" /><span className="sf-search-control-value"><span className="sf-field-label">여행 후보 기한</span><span className="sf-date-trigger-value">{form.startDate ? form.startDate.replaceAll('-', '.') : '시작일'}<i>–</i>{form.endDate ? form.endDate.replaceAll('-', '.') : '종료일'}</span></span><Icon name="calendar" size={16} className="sf-date-trigger-icon" />
          </button>
          <label className="sf-search-field sf-airline-field" htmlFor="sf-airline-type">
            <Icon name="plane" /><span className="sf-search-control-value"><span className="sf-field-label">항공사</span><select id="sf-airline-type" aria-label="항공사 유형" value={form.airlineType} onChange={(event) => onFormChange('airlineType', event.target.value)}><option value="ALL">전체 항공사</option><option value="LCC">저비용 항공사</option><option value="FSC">일반 항공사</option></select></span>
          </label>
          <button type="submit" className="sf-search-button" disabled={loading}><Icon name="search" />{loading ? '가격 비교 중…' : form.destinationIds.length === 1 ? '최저가 일정 찾기' : '최저가 도시 찾기'}</button>
        </div>
        <div className="sf-destination-field" role="group" aria-labelledby="sf-destination-label">
          <div className="sf-destination-label"><Icon name="pin" size={18} /><strong id="sf-destination-label">도착지</strong><small>복수 선택 가능</small></div>
          <div className="sf-destination-options">
            <button id="sf-destination-all" type="button" className={'sf-destination-chip' + (!form.destinationIds.length ? ' is-selected' : '')}
              aria-pressed={!form.destinationIds.length} onClick={() => onFormChange('destinationIds', [])}>전체</button>
            <span className="sf-destination-divider" aria-hidden="true" />
            {orderedDestinations.slice(0, destinationRowBreak).map(renderDestinationButton)}
          </div>
          <button id="sf-destination-map-toggle" type="button" className={'sf-destination-map-toggle' + (mapOpen ? ' is-open' : '')}
            aria-expanded={mapOpen} aria-controls="sf-destination-map" onClick={() => setMapOpen((open) => !open)}>
            <Icon name="map" size={13} />{mapOpen ? '지도 접기' : '지도 보기'}
          </button>
          <div className="sf-destination-options">
            {orderedDestinations.slice(destinationRowBreak).map(renderDestinationButton)}
          </div>
        </div>
        {mapOpen && <DestinationMap destinations={orderedDestinations} selectedIds={form.destinationIds} onToggle={toggleDestination} />}
        {dirty && <div className="sf-search-secondary"><span className="sf-search-note is-dirty" role="status">검색 조건이 변경되었습니다. 다시 검색하세요.</span></div>}
      </form>

      {error && <div className="sf-status sf-status--error" role="alert"><Icon name="info" />{error}</div>}
      {hasSearched && !singleDestinationMode && <section className="sf-city-section" ref={citiesRef} aria-labelledby="sf-cities-heading" aria-busy={loading}>
        <div className="sf-section-heading"><div><Icon name="crown" size={27} /><h2 id="sf-cities-heading">가격이 낮은 도시 <span>TOP {cities.length || 5}</span></h2></div></div>
        {loading ? <div className="sf-city-grid sf-skeletons" role="status" aria-label="도시 가격을 비교하는 중">{Array.from({ length: 5 }, (_, index) => <div className="sf-city-skeleton" key={index}><div /><span /><span /></div>)}</div> : cities.length ? <div className="sf-city-grid">
          {cities.map((city) => {
            const photo = DESTINATION_IMAGES[city.destination_id]
            const selected = selectedCity?.destination_id === city.destination_id
            return <button key={city.destination_id} type="button" className={'sf-city-card' + (selected ? ' is-selected' : '')} onClick={() => selectCity(city)} aria-pressed={selected} aria-label={`${city.rank}위 ${city.destination} 왕복 최저가 ${money(city.round_trip_price)}원 가격 달력 보기`}>
              <div className="sf-city-photo"><DestinationPhoto city={city} photo={photo} /><span className={'sf-city-rank' + (city.rank === 1 ? ' is-first' : '')}>{city.rank}</span>{selected && <span className="sf-city-selected-mark" aria-label="선택한 도시"><Icon name="check" size={14} /></span>}</div>
              <div className="sf-city-body"><div className="sf-city-name"><h3>{city.destination}</h3></div><div className="sf-city-bottom"><div><span className="sf-city-price-basis">왕복</span><strong>{money(city.round_trip_price)}<small>원</small></strong></div><span className="sf-card-arrow"><Icon name="chevron" size={17} /></span></div><p>{shortDate(city.departure_date)} 출발 · {conditions.tripDays - 1}박 {conditions.tripDays}일</p></div>
            </button>
          })}
        </div> : !error && <div className="sf-status sf-empty-results"><Icon name="calendar" size={32} /><h3>조건에 맞는 일정이 없습니다.</h3><p>여행 후보 기한이나 항공사 조건을 변경하세요.</p></div>}
      </section>}

      {hasSearched && singleDestinationMode && (loading || (!selectedCity && !error)) && <section className="sf-calendar-section" ref={calendarRef} aria-busy={loading}>
        {loading ? <div className="sf-status" role="status"><Icon name="calendar" />날짜별 가격을 불러오는 중입니다.</div> : <div className="sf-status sf-empty-results"><Icon name="calendar" size={32} /><h3>조건에 맞는 일정이 없습니다.</h3><p>여행 후보 기한이나 항공사 조건을 변경하세요.</p></div>}
      </section>}


      {hasSearched && !loading && selectedCity && <section className="sf-calendar-section" ref={calendarRef} aria-labelledby="sf-calendar-heading">
        <div className="sf-calendar-section-heading"><div className="sf-calendar-title"><span className="sf-calendar-title-emoji" aria-hidden="true">🗓️</span><h2 id="sf-calendar-heading">{selectedCity.destination} <span>· 가격 달력</span></h2></div><div className="sf-calendar-heading-actions"><span className="sf-result-period">{conditions.startDate.replaceAll('-', '.')} – {conditions.endDate.replaceAll('-', '.')}<b>{conditions.tripDays - 1}박 {conditions.tripDays}일</b></span></div></div>
        <PriceCalendar key={selectedCity.destination_id + conditions.startDate + conditions.endDate + conditions.tripDays + conditions.airlineType} daily={dailyPrices} periods={periods} city={selectedCity} conditions={conditions} selectedDate={selectedDate} onSelectDate={onSelectDate} />
        <div className="sf-period-recommendations">
          {selectedFlightOffer && <>
            <section className="sf-calendar-picked-flight" aria-labelledby="sf-selected-flight-heading"
              style={{ '--selected-flight-color': selectedFlightOffer.price_color }}>
              <div className="sf-period-heading"><Icon name="check" size={18} /><h3 id="sf-selected-flight-heading">선택한 여행 일정</h3></div>
              <ResultsList results={[selectedFlightOffer]} embedded variant="flight" airportCode={destinationCode}
                activeRank={0} onSelect={(item) => onSelectDate(item.departure_date)} />
            </section>
            <hr className="sf-flight-divider" />
          </>}
          <div className="sf-period-heading"><Icon name="crown" size={18} /><h3>저렴한 여행 일정 TOP {periods.length}</h3><span>왕복 가격순</span></div>
          <ResultsList results={periods} embedded variant="flight" airportCode={destinationCode}
            activeRank={selectedRecommendedRank ?? null} onSelect={(item) => onSelectDate(item.departure_date)} />
        </div>
      </section>}

      <footer className="sf-footer"><span><Icon name="plane" size={17} />SkyFinder</span><p>가격과 운항 시간은 예시 데이터입니다.</p><details className="sf-photo-credits"><summary>사진 출처</summary><div><p><a href={HERO_IMAGE_CREDIT.source} target="_blank" rel="noreferrer">비행기 날개 · {HERO_IMAGE_CREDIT.author}</a> · <a href={HERO_IMAGE_CREDIT.licenseUrl} target="_blank" rel="noreferrer">{HERO_IMAGE_CREDIT.license}</a> · 화면에 맞게 자름·색조 조정</p>{photoCredits.map((id) => <p key={id}><a href={DESTINATION_IMAGES[id].source} target="_blank" rel="noreferrer">{cities.find((c) => c.destination_id === id)?.destination} · {DESTINATION_IMAGES[id].author}</a> · <a href={DESTINATION_IMAGES[id].licenseUrl} target="_blank" rel="noreferrer">{DESTINATION_IMAGES[id].license}</a> · 화면에 맞게 자름</p>)}</div></details></footer>
    </main>

    {datePickerOpen && <DateRangePicker startDate={form.startDate} endDate={form.endDate} onClose={() => setDatePickerOpen(false)} onApply={(start, end) => { onFormChange('startDate', start); onFormChange('endDate', end); setDatePickerOpen(false) }} />}

    {guideOpen && <div className="sf-dialog-backdrop" onClick={() => setGuideOpen(false)}><section ref={guideRef} className="sf-guide-dialog" role="dialog" aria-modal="true" aria-label="SkyFinder 이용 방법" onClick={(event) => event.stopPropagation()}><button className="sf-dialog-close" type="button" onClick={() => setGuideOpen(false)} autoFocus aria-label="이용 방법 닫기">×</button><h2>이용 방법</h2><ol><li><b>여행 일정 선택</b><p>여행일수와 여행 후보 기한을 정하고, 도착지와 항공사 조건을 설정해 검색합니다.</p></li><li><b>도시 선택</b><p>왕복 최저가순으로 최대 5개 도시와 1위 도시의 가격 달력을 표시합니다. 다른 도시를 누르면 그 도시의 달력으로 바뀝니다.</p></li><li><b>일정 비교</b><p>달력의 출국일이나 추천 일정을 선택해 날짜와 왕복 가격을 확인합니다.</p></li></ol><p className="sf-guide-note">{TRAVEL_DATE_RANGE.startDate.replaceAll('-', '.')} ~ {TRAVEL_DATE_RANGE.endDate.replaceAll('-', '.')} 일본 노선의 예시 데이터를 제공합니다.</p></section></div>}
  </div>
}
