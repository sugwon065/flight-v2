import { useEffect, useState } from 'react'
import './CityCarousel.css'

const PAGE_SIZE = 5

function Chevron({ previous = false }) {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={previous ? 'm15 5-7 7 7 7' : 'm9 5 7 7-7 7'} />
  </svg>
}

export default function CityCarousel({ cities, renderCity }) {
  const [expanded, setExpanded] = useState(false)
  const [page, setPage] = useState(0)

  useEffect(() => {
    setExpanded(false)
    setPage(0)
  }, [cities])

  const pageCount = Math.ceil(cities.length / PAGE_SIZE)
  const hasMore = pageCount > 1
  const visiblePageCount = expanded ? pageCount : 1
  const activePage = Math.min(page, visiblePageCount - 1)
  const firstRank = activePage * PAGE_SIZE + 1
  const lastRank = Math.min((activePage + 1) * PAGE_SIZE, cities.length)
  const next = () => {
    setExpanded(true)
    setPage((current) => Math.min(current + 1, pageCount - 1))
  }

  return <div className={'sf-city-carousel' + (hasMore ? ' sf-city-carousel--more' : '')}>
    <div className="sf-city-carousel-viewport">
      <div id="sf-city-carousel-track" className="sf-city-carousel-track" style={{ transform: 'translateX(-' + activePage * 100 + '%)' }}>
        {Array.from({ length: visiblePageCount }, (_, index) => <div
          key={index} className="sf-city-grid" role="group"
          aria-label={(index * PAGE_SIZE + 1) + '위부터 ' + Math.min((index + 1) * PAGE_SIZE, cities.length) + '위 도시'}
          aria-hidden={index !== activePage} inert={index !== activePage}>
          {cities.slice(index * PAGE_SIZE, (index + 1) * PAGE_SIZE).map(renderCity)}
        </div>)}
      </div>
    </div>
    {hasMore && <>
      <button type="button" className="sf-city-carousel-previous" aria-label="이전 도시 보기"
        aria-controls="sf-city-carousel-track" disabled={activePage === 0}
        onClick={() => setPage((current) => Math.max(0, current - 1))}>
        <Chevron previous />
      </button>
      <button type="button" className={'sf-city-carousel-next' + (!expanded ? ' is-more' : '')}
        aria-label={expanded ? '다음 도시 보기' : '나머지 도시 더보기'} aria-controls="sf-city-carousel-track"
        aria-expanded={expanded} disabled={expanded && activePage >= pageCount - 1} onClick={next}>
        {!expanded && <span>더보기</span>}<Chevron />
      </button>
    </>}
    <p className="sf-city-carousel-status" role="status" aria-live="polite" aria-atomic="true">
      {firstRank}위부터 {lastRank}위 도시 · 총 {cities.length}개
    </p>
  </div>
}
