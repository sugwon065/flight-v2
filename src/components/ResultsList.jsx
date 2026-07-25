import './ResultsList.css'

const AIRPORT_CODES = {
  '도쿄(나리타)': 'NRT',
  '도쿄(하네다)': 'HND',
  '오사카(간사이)': 'KIX',
  '후쿠오카': 'FUK',
  '삿포로': 'CTS',
  '나고야': 'NGO',
  '오키나와': 'OKA',
  '센다이': 'SDJ',
  '히로시마': 'HIJ',
  '가고시마': 'KOJ',
  '구마모토': 'KMJ',
  '미야자키': 'KMI',
  '오ita': 'OIT',
  '오이타': 'OIT',
  '고베': 'UKB',
  '마쓰야마': 'MYJ',
  '다카마쓰': 'TAK',
  '기타큐슈': 'KKJ',
  '사가': 'HSG',
  '하코다테': 'HKD',
  '요나고': 'YGJ',
  '시즈오카': 'FSZ',
  '니가타': 'KIJ',
  '아오모리': 'AOJ',
  '고마쓰': 'KMJ',
  '오카야마': 'OKJ',
}

const AIRLINE_LOGOS = {
  대한항공: '/airlines/korean-air.png',
  아시아나항공: '/airlines/asiana.png',
  제주항공: '/airlines/jeju-air.png',
  진에어: '/airlines/jin-air.png',
  티웨이항공: '/airlines/tway.png',
  에어부산: '/airlines/air-busan.png',
  에어서울: '/airlines/air-seoul.png',
  JAL: '/airlines/jal.png',
  ANA: '/airlines/ana.png',
  피치항공: '/airlines/peach.png',
}

function getAirportCode(destination) {
  return AIRPORT_CODES[destination] || destination.slice(0, 3).toUpperCase()
}

function formatPrice(price) {
  return '₩' + price.toLocaleString('ko-KR')
}

function formatShortDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`)
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

function hashSeed(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0
  }
  return h
}

function formatKoreanTime(hour24, minute) {
  const period = hour24 < 12 ? '오전' : '오후'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const min = minute.toString().padStart(2, '0')
  return `${period} ${hour12}:${min}`
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}분`
  if (m === 0) return `${h}시간`
  return `${h}시간 ${m}분`
}

function getFlightSchedule(dateStr, airline, leg) {
  const seed = hashSeed(`${dateStr}-${airline}-${leg}`)
  const depHour = 6 + (seed % 14)
  const depMin = (Math.floor(seed / 7) % 4) * 15
  const durationMin = 80 + (seed % 40)
  const depTotal = depHour * 60 + depMin
  const arrTotal = depTotal + durationMin
  const arrHour = Math.floor(arrTotal / 60) % 24
  const arrMin = arrTotal % 60

  return {
    departure: formatKoreanTime(depHour, depMin),
    arrival: formatKoreanTime(arrHour, arrMin),
    duration: formatDuration(durationMin),
  }
}

function FlightLeg({ from, to, fromCity, toCity, dateStr, airline, leg }) {
  const { departure, arrival, duration } = getFlightSchedule(dateStr, airline, leg)
  const logoSrc = AIRLINE_LOGOS[airline]

  return (
    <div className="flight-leg">
      <div className="flight-airline-slot">
        {logoSrc ? (
          <img className="flight-airline-logo" src={logoSrc} alt={airline} />
        ) : (
          <span>{airline}</span>
        )}
      </div>

      <div className="leg-endpoint leg-departure">
        <span className="leg-time">{departure}</span>
        <span className="leg-airport">{fromCity ? `${fromCity}(${from})` : from}</span>
      </div>

      <div className="leg-route">
        <span className="leg-duration">{duration}</span>
        <div className="leg-line">
          <span className="leg-bar" />
          <span className="leg-dot" aria-hidden="true" />
          <span className="leg-bar" />
        </div>
        <span className="leg-direct">직항</span>
      </div>

      <div className="leg-endpoint leg-arrival">
        <span className="leg-time">{arrival}</span>
        <span className="leg-airport">{toCity ? `${toCity}(${to})` : to}</span>
      </div>
    </div>
  )
}

export default function ResultsList({
  results,
  loading,
  destination = '',
  activeRank = null,
  embedded = false,
  showPromo = false,
}) {
  const isJapanAll = destination === '일본 전체'

  if (loading) {
    return (
      <div className={`results-container ${embedded ? 'embedded' : ''}`}>
        <div className="results-loading">최저가 날짜를 검색하고 있습니다...</div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className={`results-container ${embedded ? 'embedded' : ''}`}>
        <div className="results-empty">
          <p>검색 결과가 없습니다.</p>
          <p className="results-empty-sub">다른 기간이나 도착지를 선택해 보세요.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`results-container ${embedded ? 'embedded' : ''}`}>
      <div className="results-list">
        {results.map((item, index) => {
          const itemDestination = item.destination || destination
          const destCode = getAirportCode(itemDestination)

          return (
          <div key={`${item.rank}-${itemDestination}-${item.departure_date}`}>
            <article
              id={`flight-result-${item.rank}`}
              className={`sky-card-wrap ${activeRank === item.rank ? 'sky-card-wrap--active' : ''}`}
            >
              <span
                className="sky-card-rank"
                style={{ backgroundColor: item.color }}
              >
                <span>{item.rank}위</span>
                {activeRank === item.rank && (
                  <span className="sky-card-rank-destination">{itemDestination}</span>
                )}
              </span>
              <div className="sky-card">
              <div className="sky-card-body">
                <div className="sky-card-legs">
                  <FlightLeg
                    from="ICN"
                    to={destCode}
                    fromCity="인천"
                    toCity={itemDestination}
                    dateStr={item.departure_date}
                    airline={item.airline_name}
                    leg="out"
                  />
                  <FlightLeg
                    from={destCode}
                    to="ICN"
                    fromCity={itemDestination}
                    toCity="인천"
                    dateStr={item.return_date}
                    airline={item.airline_name}
                    leg="in"
                  />
                </div>
              </div>

              <div className="sky-card-price">
                <button className="save-btn" type="button" tabIndex={-1} aria-hidden="true">
                  ♡
                </button>
                <span className="price-tag">
                  {formatShortDate(item.departure_date)} 출발 ·{' '}
                  {formatShortDate(item.return_date)} 도착
                </span>
                <span className="price-amount">{formatPrice(item.round_trip_price)}</span>
                <button className="sky-select-btn" type="button">
                  선택하기
                  <span className="sky-select-arrow" aria-hidden="true">→</span>
                </button>
              </div>
              </div>
            </article>

            {showPromo && index === 0 && (
              <div className="price-alert-promo">
                <div className="promo-text">
                  <strong>이 항공편이 마음에 드셨나요?</strong>
                  <span>가격이 변동되면 알려드릴게요.</span>
                </div>
                <span className="promo-alert-btn">가격 알림 설정</span>
              </div>
            )}
          </div>
          )
        })}
      </div>
    </div>
  )
}
