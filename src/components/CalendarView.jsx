import { useState } from 'react'
import './CalendarView.css'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

export function toDateStr(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getRangeLineType(date, rangeStart, rangeEnd) {
  if (!rangeStart || !rangeEnd) return null

  const time = date.getTime()
  const start = rangeStart.getTime()
  const end = rangeEnd.getTime()
  if (time < start || time > end) return null
  if (start === end) return 'single'
  if (time === start) return 'start'
  if (time === end) return 'end'
  return 'middle'
}

function getLineClass(lineType, date) {
  if (!lineType) return ''
  const dow = date.getDay()
  let extra = ''
  if (lineType === 'start' && dow === 0) extra = ' range-line--week-start'
  if (lineType === 'end' && dow === 6) extra = ' range-line--week-end'
  return `range-line--${lineType}${extra}`
}

function getTripLane(date, trip, tripRanges) {
  const weekStart = new Date(date)
  weekStart.setDate(date.getDate() - date.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const activeTrips = (tripRanges || [])
    .map((item) => {
      const start = new Date(item.start + 'T00:00:00')
      const end = new Date(item.end + 'T00:00:00')
      return {
        ...item,
        startDate: start,
        endDate: end,
      }
    })
    .filter((item) => item.startDate <= weekEnd && item.endDate >= weekStart)
    .sort((left, right) => {
      const startDifference = left.startDate.getTime() - right.startDate.getTime()
      if (startDifference !== 0) {
        return startDifference
      }
      return right.rank - left.rank
    })

  return Math.max(0, activeTrips.findIndex((item) => item.rank === trip.rank))
}

function MonthCalendar({
  year,
  month,
  startDate,
  endDate,
  onDayClick,
  onTripClick,
  tripRanges,
  readOnly,
}) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = getDaysInMonth(year, month)
  const cells = []

  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="cal-day empty" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dateStr = toDateStr(date)

    const tripLines = (tripRanges || [])
      .map((trip) => {
        const tripStart = new Date(trip.start + 'T00:00:00')
        const tripEnd = new Date(trip.end + 'T00:00:00')
        const lineType = getRangeLineType(date, tripStart, tripEnd)
        if (!lineType) return null
        return {
          type: lineType,
          color: trip.color,
          rank: trip.rank,
          destination: trip.destination,
          lane: getTripLane(date, trip, tripRanges),
        }
      })
      .filter(Boolean)

    let className = 'cal-day'
    if (startDate && toDateStr(startDate) === dateStr) className += ' selected-start'
    if (endDate && toDateStr(endDate) === dateStr) className += ' selected-end'
    if (startDate && endDate && date > startDate && date < endDate) className += ' in-range'
    if (readOnly) className += ' readonly'

    const DayElement = readOnly ? 'div' : 'button'

    cells.push(
      <DayElement
        key={day}
        className={className}
        onClick={readOnly ? undefined : () => onDayClick?.(date)}
        type={readOnly ? undefined : 'button'}
      >
        <span className="day-num">{day}</span>
        {tripLines.length > 0 && (
          <div className="day-lines">
            {tripLines.map((line) => (
              <span
                key={`trip-${line.rank}`}
                className={`range-line range-line--trip ${getLineClass(line.type, date)}`}
                style={{
                  '--trip-color': line.color,
                  bottom: `${3 + (line.lane % 2) * 6}px`,
                  zIndex: line.lane + 1,
                }}
              >
                {(line.type === 'start' || line.type === 'single') && (
                  readOnly ? (
                    <button
                      className="range-rank-badge"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onTripClick?.(line.rank)
                      }}
                      aria-label={`${line.rank}위 ${line.destination} 항공권 보기`}
                    >
                      <span>{line.rank}</span>
                      <span className="range-destination">{line.destination}</span>
                    </button>
                  ) : (
                    <b className="range-rank-badge">
                      <span>{line.rank}</span>
                      <span className="range-destination">{line.destination}</span>
                    </b>
                  )
                )}
              </span>
            ))}
          </div>
        )}
      </DayElement>
    )
  }

  return (
    <div className="month-cal">
      <div className="month-title">
        {year}년 {MONTHS[month]}
      </div>
      <div className="weekday-row">
        {WEEKDAYS.map((w) => (
          <span key={w} className="weekday">
            {w}
          </span>
        ))}
      </div>
      <div className="days-grid">{cells}</div>
    </div>
  )
}

export default function CalendarView({
  startDate,
  endDate,
  onDayClick,
  onTripClick,
  results = [],
  tripRanges = [],
  readOnly = false,
  initialYear = 2026,
  initialMonth = 0,
  showNav = true,
  title,
}) {
  const [viewYear, setViewYear] = useState(initialYear)
  const [viewMonth, setViewMonth] = useState(initialMonth)

  const month2 = viewMonth === 11 ? 0 : viewMonth + 1
  const year2 = viewMonth === 11 ? viewYear + 1 : viewYear

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1)
      setViewMonth(11)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1)
      setViewMonth(0)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  return (
    <div className={`calendar-view ${readOnly ? 'calendar-view--readonly' : ''}`}>
      {(showNav || title) && (
        <div className={`cal-header ${showNav ? '' : 'cal-header--title-only'}`}>
          {showNav && (
            <button className="cal-nav" onClick={prevMonth} type="button">
              ‹
            </button>
          )}
          <span className="cal-header-title">
            {readOnly && title ? (
              <>
                <span className="cal-period-label">선택한 여행 기간</span>
                <span className="cal-period-range">
                  <span className="cal-period-icon" aria-hidden="true">▣</span>
                  {title}
                </span>
              </>
            ) : (
              title || '여행 가능 기간'
            )}
          </span>
          {showNav && (
            <button className="cal-nav" onClick={nextMonth} type="button">
              ›
            </button>
          )}
        </div>
      )}

      <div className="cal-months">
        <MonthCalendar
          year={viewYear}
          month={viewMonth}
          startDate={startDate}
          endDate={endDate}
          onDayClick={onDayClick}
          onTripClick={onTripClick}
          tripRanges={tripRanges}
          readOnly={readOnly}
        />
        <MonthCalendar
          year={year2}
          month={month2}
          startDate={startDate}
          endDate={endDate}
          onDayClick={onDayClick}
          onTripClick={onTripClick}
          tripRanges={tripRanges}
          readOnly={readOnly}
        />
      </div>

      {results.length > 0 && (
        <>
          <div className="rank-legend">
            {results.map((r) => (
              <span key={r.rank} className="legend-item">
                <span className="legend-line" style={{ background: r.color }} />
                {r.rank}위 왕복
              </span>
            ))}
          </div>
          {readOnly && (
            <p className="rank-legend-caption">
              색상으로 표시된 기간이 왕복 최저가 순위입니다.
            </p>
          )}
        </>
      )}
    </div>
  )
}
