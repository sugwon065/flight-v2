import { useState } from 'react'
import './FilterSidebar.css'

function TimeSlider({ label, rangeLabel }) {
  const [min, setMin] = useState(0)
  const [max, setMax] = useState(100)

  return (
    <div className="filter-block">
      <div className="filter-block-title">{label}</div>
      <div className="time-range-label">{rangeLabel}</div>
      <div className="dual-slider">
        <div className="dual-slider-track">
          <div
            className="dual-slider-fill"
            style={{ left: `${min}%`, right: `${100 - max}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={min}
          className="dual-slider-input dual-slider-input--min"
          onChange={(e) => setMin(Math.min(Number(e.target.value), max - 5))}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={max}
          className="dual-slider-input dual-slider-input--max"
          onChange={(e) => setMax(Math.max(Number(e.target.value), min + 5))}
        />
      </div>
    </div>
  )
}

export default function FilterSidebar({ timeOpen, onToggleTime, minPrice = 0 }) {
  return (
    <aside className="filter-sidebar">
      <section className="filter-stops">
        <h3><span>경유</span><span className="filter-chevron">⌃</span></h3>
        <label className="filter-check"><input type="checkbox" defaultChecked /> <span>직항<small>{minPrice ? `₩${minPrice.toLocaleString('ko-KR')}부터` : '가격 확인 중'}</small></span></label>
        <label className="filter-check is-muted"><input type="checkbox" disabled /> <span>1회 경유<small>없음</small></span></label>
        <label className="filter-check is-muted"><input type="checkbox" disabled /> <span>2번 이상 경유<small>없음</small></span></label>
      </section>

      <div className="filter-card">
        <button className="filter-section-head" onClick={onToggleTime} type="button">
          <span>출발 시간대 설정</span>
          <span className="filter-chevron">{timeOpen ? '∧' : '∨'}</span>
        </button>

        {timeOpen && (
          <div className="filter-section-body">
            <TimeSlider label="가는날 출발시간" rangeLabel="오전 12:00 – 오후 11:59" />
            <TimeSlider label="오는편" rangeLabel="오전 12:00 – 오후 11:59" />
          </div>
        )}
      </div>
    </aside>
  )
}
