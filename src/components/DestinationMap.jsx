import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import mapData from './destinationMapData.json'
import './DestinationMap.css'

const WIDTH = 1280
const HEIGHT = 1100
const MAP_SCALE = 1.78
const MAP_X = -160
const MAP_Y = 10
const INITIAL_VIEW = { scale: 1, x: 0, y: 0 }
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value))

const REGIONS = [
  { id: 'hokkaido', name: '홋카이도', color: '#247bed', soft: '#eaf3ff', border: '#bfd9ff', x: 590, y: 80, width: 225,
    cities: ['sapporo', 'hakodate'], anchor: 'sapporo', connection: [[815, 102], [850, 102]] },
  { id: 'tohoku', name: '도호쿠', color: '#41ad7e', soft: '#eaf7f0', border: '#bce6d4', x: 1030, y: 330, width: 220,
    cities: ['aomori', 'sendai'], anchor: 'aomori', connection: [[1030, 352], [980, 352]] },
  { id: 'chubu', name: '주부', color: '#efb50b', soft: '#fff8df', border: '#f8dd88', x: 550, y: 320, width: 220,
    cities: ['nagoya', 'niigata', 'komatsu', 'shizuoka'], anchor: 'niigata', connection: [[770, 342], [790, 342], [790, 440]] },
  { id: 'kanto', name: '간토', color: '#1785ec', soft: '#edf5ff', border: '#bcdcff', x: 995, y: 510, width: 255,
    cities: ['tokyo-narita', 'tokyo-haneda'], anchor: 'tokyo-narita', connection: [[995, 532], [950, 532]] },
  { id: 'chugoku', name: '주고쿠', color: '#f88929', soft: '#fff2e7', border: '#ffd2ad', x: 285, y: 400, width: 225,
    cities: ['okayama', 'hiroshima', 'yonago'], anchor: 'hiroshima', connection: [[510, 422], [540, 422], [540, 580]] },
  { id: 'kansai', name: '간사이', color: '#ed5b85', soft: '#fff0f5', border: '#ffc7d8', x: 955, y: 700, width: 285,
    cities: ['osaka-kansai', 'kobe'], anchor: 'osaka-kansai', connection: [[955, 722], [860, 722]] },
  { id: 'shikoku', name: '시코쿠', color: '#039ca5', soft: '#e8f8f9', border: '#b0e3e6', x: 660, y: 865, width: 230,
    cities: ['takamatsu', 'matsuyama'], anchor: 'takamatsu', connection: [[660, 887], [620, 887], [600, 760]] },
  { id: 'kyushu', name: '규슈', color: '#9562de', soft: '#f5efff', border: '#dfc9fc', x: 35, y: 570, width: 245,
    cities: ['fukuoka', 'oita', 'saga', 'kitakyushu', 'kumamoto', 'miyazaki', 'kagoshima'], anchor: 'fukuoka', connection: [[280, 592], [350, 592]] },
  { id: 'okinawa', name: '오키나와', color: '#247bed', soft: '#edf5ff', border: '#bfd9ff', x: 490, y: 980, width: 230,
    cities: ['okinawa'], anchor: 'okinawa', connection: [[490, 1002], [450, 1002]] },
]
const CITY_REGIONS = new Map(REGIONS.flatMap((region) => region.cities.map((id) => [id, region])))

function boundedView(view) {
  const horizontal = (view.scale - 1) * WIDTH / 2 + WIDTH * .2
  const vertical = (view.scale - 1) * HEIGHT / 2 + HEIGHT * .2
  return { ...view, x: clamp(view.x, -horizontal, horizontal), y: clamp(view.y, -vertical, vertical) }
}

function overlaps(left, right, padding = 0) {
  return left.x < right.x + right.width + padding && left.x + left.width + padding > right.x
    && left.y < right.y + right.height + padding && left.y + left.height + padding > right.y
}

function separateMarkers(points, unitScale, cards) {
  // Keep circles separated in screen pixels, including when the map is zoomed.
  const spacing = 42 / unitScale
  const radius = 17 / unitScale
  const margin = 20 / unitScale
  const placed = []
  const byId = new Map()
  const distanceSquared = (left, right) => (left.x - right.x) ** 2 + (left.y - right.y) ** 2
  const available = (candidate) => candidate.x >= margin && candidate.x <= WIDTH - margin
    && candidate.y >= margin && candidate.y <= HEIGHT - margin
    && !(candidate.x > WIDTH - 70 / unitScale && candidate.y > HEIGHT - 140 / unitScale)
    && !cards.some((card) => overlaps({ x: candidate.x - radius, y: candidate.y - radius, width: radius * 2, height: radius * 2 }, card, 6 / unitScale))
    && placed.every((other) => distanceSquared(candidate, other) >= spacing * spacing)
  const density = new Map(points.map((point) => [point.destination.id,
    points.filter((other) => other !== point && distanceSquared(point, other) < spacing * spacing).length,
  ]))
  const sorted = [...points].sort((left, right) => density.get(left.destination.id) - density.get(right.destination.id)
    || left.y - right.y || left.x - right.x || left.destination.id.localeCompare(right.destination.id))
  for (const point of sorted) {
    let position = available(point) ? { x: point.x, y: point.y } : null
    for (let radius = spacing / 8; !position && radius <= spacing * 6; radius += spacing / 8) {
      for (let index = 0; index < 32; index += 1) {
        const angle = index * Math.PI / 16
        const candidate = { x: point.x + Math.cos(angle) * radius, y: point.y + Math.sin(angle) * radius }
        if (available(candidate)) { position = candidate; break }
      }
    }
    if (!position) {
      let nearestDistance = Infinity
      for (let y = margin; y <= HEIGHT - margin; y += spacing) {
        for (let x = margin; x <= WIDTH - margin; x += spacing) {
          const candidate = { x, y }
          const distance = distanceSquared(candidate, point)
          if (distance < nearestDistance && available(candidate)) { position = candidate; nearestDistance = distance }
        }
      }
    }
    if (!position) continue
    const marker = { ...point, anchorX: point.x, anchorY: point.y, ...position }
    placed.push(marker)
    byId.set(point.destination.id, marker)
  }
  return points.flatMap((point) => byId.has(point.destination.id) ? [byId.get(point.destination.id)] : [])
}

function placeLabels(points, unitScale, cards) {
  const occupied = [...cards, { x: WIDTH - 70 / unitScale, y: HEIGHT - 140 / unitScale, width: 70 / unitScale, height: 140 / unitScale }]
  const placements = new Map()
  const padding = 7 / unitScale
  const radius = 18 / unitScale
  const fontSize = clamp(16 * unitScale, 11, 18)
  const sorted = [...points].sort((left, right) => left.y - right.y || left.x - right.x)
  for (const point of sorted) {
    const textWidth = [...point.destination.name].reduce((width, character) => width + (/[\u3131-\uD79D]/.test(character) ? fontSize : fontSize * .6), 0)
    const width = (textWidth + 6) / unitScale
    const height = fontSize * 1.5 / unitScale
    const gap = 22 / unitScale
    const available = (candidate) => candidate.x >= padding && candidate.y >= padding
      && candidate.x + width <= WIDTH - padding && candidate.y + height <= HEIGHT - padding
      && !occupied.some((rectangle) => overlaps(candidate, rectangle, padding))
      && !points.some((anchor) => overlaps(candidate, { x: anchor.x - radius, y: anchor.y - radius, width: radius * 2, height: radius * 2 }, padding / 2))
    let chosen
    for (const vertical of [-height / 2, -height - gap / 2, gap / 2, -2 * (height + gap), height + 2 * gap, -3 * (height + gap), 2 * height + 3 * gap]) {
      for (const horizontal of [gap, -width - gap, gap * 2.5, -width - gap * 2.5, gap * 4, -width - gap * 4]) {
        const candidate = { x: point.x + horizontal, y: point.y + vertical, width, height }
        if (available(candidate)) { chosen = candidate; break }
      }
      if (chosen) break
    }
    if (!chosen) {
      let nearestDistance = Infinity
      for (let y = padding; y < HEIGHT - height - padding; y += height + padding) {
        for (let x = padding; x < WIDTH - width - padding; x += gap) {
          const candidate = { x, y, width, height }
          const distance = (x + width / 2 - point.x) ** 2 + (y + height / 2 - point.y) ** 2
          if (distance < nearestDistance && available(candidate)) { chosen = candidate; nearestDistance = distance }
        }
      }
    }
    if (chosen) occupied.push(chosen)
    placements.set(point.destination.id, chosen ? { ...chosen, fontSize } : null)
  }
  return points.map((point) => ({ ...point, label: placements.get(point.destination.id) }))
}

export default function DestinationMap({ destinations, selectedIds, onToggle }) {
  const [view, setView] = useState(INITIAL_VIEW)
  const [stageWidth, setStageWidth] = useState(WIDTH)
  const [dragging, setDragging] = useState(false)
  const regionRefs = useRef(new Map())
  const [regionWidths, setRegionWidths] = useState({})
  const panelRef = useRef(null)
  const [panelHeight, setPanelHeight] = useState(undefined)
  const stageRef = useRef(null)
  const dragRef = useRef(null)
  const unitScale = stageWidth / WIDTH
  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    // Reserve only the rendered height after scaling the entire panel.
    const updateHeight = () => setPanelHeight(panel.getBoundingClientRect().height)
    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(panel)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    setStageWidth(stage.clientWidth || WIDTH)
    const observer = new ResizeObserver(([entry]) => setStageWidth(entry.contentRect.width || WIDTH))
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])
  const regions = useMemo(() => {
    const byId = new Map(destinations.map((destination) => [destination.id, destination]))
    return REGIONS.flatMap((region) => {
      const cities = region.cities.flatMap((id) => byId.has(id) ? [byId.get(id)] : [])
      return cities.length ? [{ ...region, cities, height: 59 + cities.length * 38 }] : []
    })
  }, [destinations])
  useLayoutEffect(() => {
    // Keep marker collision bounds aligned with each list's natural text width.
    const updateWidths = () => {
      const measured = [...regionRefs.current].map(([id, element]) => [id,
        Number.parseFloat(getComputedStyle(element).width) / (unitScale * view.scale),
      ])
      setRegionWidths((current) => {
        let next = current
        for (const [id, width] of measured) {
          if (!Number.isFinite(width) || width <= 0 || Math.abs((current[id] ?? 0) - width) < .25) continue
          if (next === current) next = { ...current }
          next[id] = width
        }
        return next
      })
    }
    updateWidths()
    const observer = new ResizeObserver(updateWidths)
    regionRefs.current.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [regions, unitScale, view.scale])
  const cards = useMemo(() => regions.map((region) => ({
    ...region, x: region.x * view.scale + view.x, y: region.y * view.scale + view.y,
    width: (regionWidths[region.id] ?? region.width) * view.scale, height: region.height * view.scale,
  })), [regions, regionWidths, view])
  const markers = useMemo(() => {
    const points = destinations.flatMap((destination) => {
      const location = mapData.cities[destination.id]
      const region = CITY_REGIONS.get(destination.id)
      if (!location || !region) return []
      const x = (location.x * MAP_SCALE + MAP_X) * view.scale + view.x
      const y = (location.y * MAP_SCALE + MAP_Y) * view.scale + view.y
      return x < 8 || y < 8 || x > WIDTH - 8 || y > HEIGHT - 8 ? [] : [{ destination, region, x, y }]
    })
    return placeLabels(separateMarkers(points, unitScale, cards), unitScale, cards)
  }, [destinations, view, unitScale, cards])
  const zoom = (factor) => setView((current) => {
    const scale = clamp(current.scale * factor, 1, 6)
    const ratio = scale / current.scale
    return boundedView({ scale, x: WIDTH / 2 - (WIDTH / 2 - current.x) * ratio, y: HEIGHT / 2 - (HEIGHT / 2 - current.y) * ratio })
  })
  const startDrag = (event) => {
    if (event.button !== 0 || event.target.closest?.('button')) return
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, view }
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
  }
  const moveDrag = (event) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const rectangle = event.currentTarget.getBoundingClientRect()
    setView(boundedView({ ...drag.view, x: drag.view.x + (event.clientX - drag.x) * WIDTH / rectangle.width, y: drag.view.y + (event.clientY - drag.y) * HEIGHT / rectangle.height }))
  }
  const stopDrag = (event) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  const moveWithKeys = (event) => {
    if (event.target !== event.currentTarget) return
    const directions = { ArrowLeft: [36, 0], ArrowRight: [-36, 0], ArrowUp: [0, 36], ArrowDown: [0, -36] }
    const direction = directions[event.key]
    if (!direction) return
    event.preventDefault()
    setView((current) => boundedView({ ...current, x: current.x + direction[0], y: current.y + direction[1] }))
  }

  return <div className="sf-destination-map-shell" style={{ height: panelHeight }}><section ref={panelRef} className="sf-destination-map" id="sf-destination-map" aria-label="일본 도착지 선택">
    <div ref={stageRef} className={'sf-map-stage' + (dragging ? ' is-dragging' : '')} tabIndex={0} role="region" aria-label="일본 도착지 지도. 드래그 또는 방향키로 지도를 이동할 수 있습니다."
      onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag} onLostPointerCapture={stopDrag} onKeyDown={moveWithKeys}>
      <svg className="sf-map-geography" viewBox={'0 0 ' + WIDTH + ' ' + HEIGHT} aria-hidden="true">
        <defs><linearGradient id="sf-map-land-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#cbe5fc" /><stop offset="100%" stopColor="#9fc9f0" /></linearGradient></defs>
        <g transform={'translate(' + view.x + ' ' + view.y + ') scale(' + view.scale + ')'}>
          <g transform={'translate(' + MAP_X + ' ' + MAP_Y + ') scale(' + MAP_SCALE + ')'}>
            {mapData.paths.map((path, index) => <path key={index} d={path} className="sf-map-land" fillRule="evenodd" vectorEffect="non-scaling-stroke" />)}
          </g>
        </g>
        <g className="sf-map-region-lines">{regions.map((region) => {
          const marker = markers.find(({ destination }) => destination.id === region.anchor)
          if (!marker) return null
          const width = regionWidths[region.id] ?? region.width
          const points = [...region.connection.map(([x, y], index) => {
            const edgeX = index === 0 && x === region.x + region.width ? region.x + width : x
            return [edgeX * view.scale + view.x, y * view.scale + view.y]
          }), [marker.x, marker.y]]
          return <polyline key={region.id} points={points.map((point) => point.join(',')).join(' ')} stroke={region.color} vectorEffect="non-scaling-stroke" />
        })}</g>
        <g className="sf-map-anchor-lines">{markers.filter(({ x, y, anchorX, anchorY }) => Math.hypot(x - anchorX, y - anchorY) * unitScale > 2)
          .map(({ destination, region, x, y, anchorX, anchorY }) => <g key={destination.id} style={{ '--region-color': region.color }}>
            <line x1={anchorX} y1={anchorY} x2={x} y2={y} vectorEffect="non-scaling-stroke" />
            <circle cx={anchorX} cy={anchorY} r={1.8 / unitScale} vectorEffect="non-scaling-stroke" />
          </g>)}</g>
        <g className="sf-map-label-lines">{markers.filter(({ x, y, label }) => label && Math.hypot(x - clamp(x, label.x, label.x + label.width), y - clamp(y, label.y, label.y + label.height)) * unitScale > 32)
          .map(({ destination, region, x, y, label }) => <line key={destination.id} x1={x} y1={y}
            x2={clamp(x, label.x, label.x + label.width)} y2={clamp(y, label.y, label.y + label.height)} stroke={region.color} vectorEffect="non-scaling-stroke" />)}</g>
      </svg>
      {cards.map((region) => <div key={region.id} className="sf-map-region-card"
        ref={(element) => { if (element) regionRefs.current.set(region.id, element); else regionRefs.current.delete(region.id) }}
        style={{ left: region.x / WIDTH * 100 + '%', top: region.y / HEIGHT * 100 + '%', '--region-color': region.color, '--region-soft': region.soft, '--region-border': region.border, '--region-unit': unitScale * view.scale }}>
        <h4 className="sf-map-region-title">{region.name}</h4>
        <div className="sf-map-region-list" role="group" aria-label={region.name + ' 도착지'}>{region.cities.map((destination) => {
          const selected = selectedIds.includes(destination.id)
          return <button key={destination.id} type="button" className={'sf-map-region-city' + (selected ? ' is-selected' : '')}
            aria-pressed={selected} onClick={() => onToggle(destination.id)}>
            <strong>{destination.name}</strong><span className="sf-map-airport-code">({destination.airportCode || mapData.cities[destination.id]?.airportCode})</span>
            <span className="sf-map-region-check" aria-hidden="true">{selected ? '✓' : ''}</span>
          </button>
        })}</div>
      </div>)}
      {markers.map(({ destination, region, x, y, label }) => {
        const selected = selectedIds.includes(destination.id)
        return <button key={destination.id} type="button" className={'sf-map-marker' + (selected ? ' is-selected' : '')}
          style={{ left: x / WIDTH * 100 + '%', top: y / HEIGHT * 100 + '%', '--region-color': region.color }} aria-pressed={selected}
          aria-label={destination.name + ' 도착지 ' + (selected ? '선택 해제' : '선택')} onClick={() => onToggle(destination.id)}>
          <span className="sf-map-marker-check" aria-hidden="true">{selected ? '✓' : ''}</span>
          {label && <span className="sf-map-marker-label" aria-hidden="true"
            style={{ left: (label.x - x) * unitScale + 8.25, top: (label.y - y) * unitScale + 8.25, fontSize: label.fontSize, lineHeight: label.height * unitScale + 'px' }}>{destination.name}</span>}
        </button>
      })}
      <div className="sf-map-zoom-controls">
        <button type="button" onClick={() => zoom(1.4)} disabled={view.scale >= 6} aria-label="지도 확대">+</button>
        <button type="button" onClick={() => zoom(1 / 1.4)} disabled={view.scale <= 1} aria-label="지도 축소">−</button>
        <button type="button" onClick={() => setView(INITIAL_VIEW)} className="sf-map-reset" aria-label="일본 전체 지도 보기">전체</button>
      </div>
    </div>
  </section></div>
}
