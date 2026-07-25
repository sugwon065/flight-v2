import CalendarView, { toDateStr } from './CalendarView'
import './CalendarPopup.css'

export default function CalendarPopup({
  startDate,
  endDate,
  onSelectRange,
  onClose,
  onConfirm,
}) {
  const handleDayClick = (date) => {
    if (!startDate || endDate) {
      onSelectRange(date, null)
      return
    }

    if (date < startDate) {
      onSelectRange(date, startDate)
    } else {
      onSelectRange(startDate, date)
    }
  }

  return (
    <div className="cal-overlay" onClick={onClose}>
      <div className="cal-popup" onClick={(e) => e.stopPropagation()}>
        <div className="cal-body">
          <p className="cal-hint" style={{ marginTop: 4 }}>
            {!startDate
              ? '여행날짜 시작일을 선택하세요'
              : !endDate
                ? '여행날짜 종료일을 선택하세요'
                : `${toDateStr(startDate)} ~ ${toDateStr(endDate)} 선택됨`}
          </p>
          <CalendarView
            startDate={startDate}
            endDate={endDate}
            onDayClick={handleDayClick}
            title="여행날짜 선택"
          />
        </div>

        <div className="cal-footer">
          <button className="cal-cancel" onClick={onClose} type="button">
            닫기
          </button>
          <button
            className="cal-search"
            onClick={onConfirm}
            disabled={!startDate || !endDate}
            type="button"
          >
            선택
          </button>
        </div>
      </div>
    </div>
  )
}
