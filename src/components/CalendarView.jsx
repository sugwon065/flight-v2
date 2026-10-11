import { useEffect, useState } from 'react'
import './CalendarView.css'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export function toDateStr(date) {
  if (!date) return ''
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')
}

function shortDate(value) {
  const date = new Date(value + 'T00:00:00')
  return (date.getMonth() + 1) + '/' + date.getDate()
}

function MonthCalendar({ year, month, startDate, endDate, onDayClick, onTripClick,
  results, selectedTrip, onPreview, readOnly, tripActionLabel }) {
  const [expandedDay, setExpandedDay] = useState(null)
  const cells = []
  const offset = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  for (let i = 0; i < offset; i++) cells.push(<div key={'empty-' + i} className="cal-day empty" />)

  for (let day = 1; day <= days; day++) {
    const date = new Date(year, month, day)
    const iso = toDateStr(date)
    const departures = results.filter((item) => item.departure_date === iso)
    let className = 'cal-day'
    if (readOnly) {
      className += ' readonly'
      if (selectedTrip && iso >= selectedTrip.departure_date && iso <= selectedTrip.return_date) className += ' trip-preview'
      if (selectedTrip?.departure_date === iso) className += ' trip-preview-start'
      if (selectedTrip?.return_date === iso) className += ' trip-preview-end'
      if (iso < toDateStr(startDate) || iso > toDateStr(endDate)) className += ' outside-search'
    } else {
      if (toDateStr(startDate) === iso) className += ' selected-start'
      if (toDateStr(endDate) === iso) className += ' selected-end'
      if (startDate && endDate && date > startDate && date < endDate) className += ' in-range'
    }
    const Day = readOnly ? 'div' : 'button'
    cells.push(
      <Day key={day} className={className} style={readOnly && selectedTrip ? { '--preview-color': selectedTrip.color } : undefined} type={readOnly ? undefined : 'button'} onClick={readOnly ? undefined : () => onDayClick?.(date)}>
        <span className="day-num">{day}</span>
        {readOnly && departures.length > 0 && (
          <div className="departure-markers">
            <button className={'departure-rank' + (selectedTrip?.rank === departures[0].rank ? ' is-active' : '')}
              type="button" style={{ backgroundColor: departures[0].color, color: departures[0].color_text }} onClick={() => onTripClick?.(departures[0].rank)}
              onMouseEnter={() => onPreview(departures[0].rank)} onMouseLeave={() => onPreview(null)}
              onFocus={() => onPreview(departures[0].rank)} onBlur={() => onPreview(null)}
              aria-label={departures[0].rank + '위 ' + departures[0].destination + ' ' + tripActionLabel}>
              {departures[0].rank}
            </button>
            {departures.length > 1 && (
              <button className="departure-more" type="button" aria-expanded={expandedDay === iso}
                aria-label={shortDate(iso) + ' 출발 일정 ' + departures.length + '개 보기'}
                onClick={() => setExpandedDay(expandedDay === iso ? null : iso)}>+{departures.length - 1}</button>
            )}
          </div>
        )}
        {readOnly && expandedDay === iso && departures.length > 1 && (
          <div className="departure-popover" onKeyDown={(event) => { if (event.key === 'Escape') setExpandedDay(null) }}>
            <div className="departure-popover-heading">{shortDate(iso)} 출발 <button type="button" aria-label="출발 일정 목록 닫기" onClick={() => setExpandedDay(null)}>×</button></div>
            {departures.map((item) => (
              <button type="button" key={item.rank} onClick={() => { setExpandedDay(null); onTripClick?.(item.rank) }}
                onMouseEnter={() => onPreview(item.rank)} onMouseLeave={() => onPreview(null)}
                onFocus={() => onPreview(item.rank)} onBlur={() => onPreview(null)}>
                <span>{item.rank}위 {item.destination}</span><strong>₩{item.round_trip_price.toLocaleString('ko-KR')}</strong>
              </button>
            ))}
          </div>
        )}
      </Day>,
    )
  }
  if (readOnly) {
    while (cells.length % 7 !== 0) cells.push(<div key={'tail-' + cells.length} className="cal-day empty" />)
  }
  return (
    <div className="month-cal">
      <div className="month-title">{year}년 {month + 1}월</div>
      <div className="weekday-row">{WEEKDAYS.map((day) => <span key={day} className="weekday">{day}</span>)}</div>
      <div className="days-grid">{cells}</div>
    </div>
  )
}

export default function CalendarView({ startDate, endDate, onDayClick, onTripClick,
  results = [], readOnly = false, initialYear = 2026, initialMonth = 0, showNav = true,
  title, tripActionLabel = '항공권 보기', activeRank = null, regionStage = false }) {
  const firstDeparture = readOnly && results[0] ? new Date(results[0].departure_date + 'T00:00:00') : null
  const [viewDate, setViewDate] = useState(() => new Date(firstDeparture?.getFullYear() ?? initialYear, firstDeparture?.getMonth() ?? initialMonth, 1))
  const [previewRank, setPreviewRank] = useState(null)
  const selectedTrip = results.find((item) => item.rank === (previewRank ?? activeRank))
  const viewYear = viewDate.getFullYear()
  const viewMonth = viewDate.getMonth()

  useEffect(() => {
    const active = results.find((item) => item.rank === activeRank)
    if (readOnly && active) {
      const date = new Date(active.departure_date + 'T00:00:00')
      setViewDate(new Date(date.getFullYear(), date.getMonth(), 1))
    }
  }, [activeRank, readOnly, results])

  const preview = (rank) => {
    setPreviewRank(rank)
    const item = results.find((result) => result.rank === rank)
    if (item) {
      const date = new Date(item.departure_date + 'T00:00:00')
      if (date.getFullYear() !== viewYear || date.getMonth() !== viewMonth) {
        setViewDate(new Date(date.getFullYear(), date.getMonth(), 1))
      }
    }
  }
  const moveMonth = (offset) => setViewDate(new Date(viewYear, viewMonth + offset, 1))
  const calendarProps = { startDate, endDate, onDayClick, onTripClick, results, selectedTrip, onPreview: preview, readOnly, tripActionLabel }

  return (
    <div className={'calendar-view' + (readOnly ? ' calendar-view--readonly calendar-view--deals' : '')}>
      {(showNav || title) && (
        <div className="cal-header">
          {showNav && <button className="cal-nav" type="button" aria-label="이전 달" onClick={() => moveMonth(-1)}>‹</button>}
          <span className="cal-header-title">
            {readOnly ? <><span className="cal-period-label">여행 가능 기간</span><span className="cal-period-range">{title}</span></> : title || '여행 가능 기간'}
          </span>
          {showNav && <button className="cal-nav" type="button" aria-label="다음 달" onClick={() => moveMonth(1)}>›</button>}
        </div>
      )}
      <div className="cal-months">
        <MonthCalendar key={viewYear + '-' + viewMonth} year={viewYear} month={viewMonth} {...calendarProps} />
        {!readOnly && <MonthCalendar year={viewMonth === 11 ? viewYear + 1 : viewYear} month={(viewMonth + 1) % 12} {...calendarProps} />}
      </div>
      {readOnly && results.length > 0 && (
        <div className="deal-picker">
          <div className="deal-picker-heading"><span>{regionStage ? '어디로 떠날까요?' : '언제 떠날까요?'}</span><small>{regionStage ? '초록 → 빨강 · 왕복 가격순' : '짙은색 → 옅은색 · 왕복 가격순'}</small></div>
          <div className="deal-options">
            {results.map((item) => (
              <button type="button" key={item.rank} style={{ '--deal-color': item.color, '--deal-text': item.color_text }} className={'deal-option' + (selectedTrip?.rank === item.rank ? ' is-active' : '')}
                onClick={() => onTripClick?.(item.rank)} onMouseEnter={() => preview(item.rank)} onMouseLeave={() => preview(null)}
                onFocus={() => preview(item.rank)} onBlur={() => preview(null)}
                aria-label={item.rank + '위 ' + item.destination + ' ' + shortDate(item.departure_date) + ' 출발 ' + tripActionLabel}>
                <span className="deal-option-top"><span className="deal-option-rank">{item.rank}</span><span>{regionStage ? item.destination : shortDate(item.departure_date) + ' – ' + shortDate(item.return_date)}</span></span>
                <strong>₩{item.round_trip_price.toLocaleString('ko-KR')}</strong>
                <span className="deal-option-meta">{regionStage ? shortDate(item.departure_date) + ' – ' + shortDate(item.return_date) : item.destination}</span>
              </button>
            ))}
          </div>
          <p className="deal-picker-hint">{regionStage ? '숫자는 출발일 순위입니다. 지역을 선택하면 저렴한 기간 5개를 보여드려요.' : '숫자는 출발일 순위입니다. 일정을 선택하면 아래 항공권으로 이동해요.'}</p>
          <div className="deal-preview-summary" aria-live="polite">
            {selectedTrip ? <><strong>{selectedTrip.destination}</strong><span>{shortDate(selectedTrip.departure_date)} 출발 → {shortDate(selectedTrip.return_date)} 귀국</span></> : <span>카드에 마우스를 올리거나 키보드로 선택하면 여행 기간을 미리 볼 수 있어요.</span>}
          </div>
        </div>
      )}
    </div>
  )
}
