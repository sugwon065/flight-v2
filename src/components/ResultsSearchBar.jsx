import './ResultsSearchBar.css'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function formatDateShort(date) {
  if (!date) return ''
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`
}

export default function ResultsSearchBar({
  destination,
  startDate,
  endDate,
  tripDays,
  onBack,
}) {
  return (
    <div className="rs-bar">
      <div className="rs-bar-inner">
        <div className="rs-route-box">
          <button className="rs-back" onClick={onBack} type="button" aria-label="검색으로 돌아가기">
            <img src="/icons/search-button.png" alt="" />
          </button>
          <span className="rs-route">
            서울 (모두) – {destination === '일본 전체' ? '일본 (모두)' : `${destination} (모두)`} · 성인 1명, 일반석
          </span>
          <span className="rs-route-spacer" aria-hidden="true" />
        </div>

        <div className="rs-dates">
          <button className="rs-date-arrow" type="button" aria-label="이전 날짜">‹</button>
          <div className="rs-date-box"><span>{formatDateShort(startDate)}</span></div>
          <button className="rs-date-arrow" type="button" aria-label="다음 날짜">›</button>
          <span className="rs-date-separator" aria-hidden="true">·</span>
          <button className="rs-date-arrow" type="button" aria-label="이전 귀국 날짜">‹</button>
          <div className="rs-date-box"><span>{formatDateShort(endDate)}</span></div>
          <button className="rs-date-arrow" type="button" aria-label="다음 귀국 날짜">›</button>
        </div>
      </div>
    </div>
  )
}
