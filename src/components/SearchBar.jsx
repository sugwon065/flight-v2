import './SearchBar.css'

export default function SearchBar({
  destination,
  destinations,
  onDestinationChange,
  dateRangeLabel,
  onDateClick,
  tripDays,
  onTripDaysChange,
  onSearch,
  loading,
}) {
  return (
    <div className="search-bar-wrapper">
      <div className="search-bar">
        <div className="search-field origin">
          <label>출발지</label>
          <div className="field-value">인천 국제 (ICN)</div>
        </div>

        <div className="search-divider" />

        <div className="search-field destination">
          <label>도착지</label>
          <select
            value={destination}
            onChange={(e) => onDestinationChange(e.target.value)}
          >
            {destinations.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="search-divider" />

        <div className="search-field trip-days">
          <label>여행 일수</label>
          <select
            value={tripDays}
            onChange={(e) => onTripDaysChange(Number(e.target.value))}
          >
            <option value={2}>2일</option>
            <option value={3}>3일</option>
            <option value={4}>4일</option>
          </select>
        </div>

        <div className="search-divider" />

        <div className="search-field dates" onClick={onDateClick}>
          <label>여행 가능 기간</label>
          <div className={`field-value ${dateRangeLabel.includes('선택') ? 'placeholder' : ''}`}>
            {dateRangeLabel}
          </div>
        </div>

        <div className="search-divider" />

        <button className="search-btn" onClick={onSearch} disabled={loading}>
          {loading ? '검색 중...' : '검색하기'}
        </button>
      </div>
    </div>
  )
}
