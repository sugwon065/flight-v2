import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import './DateRangePicker.css'
import TRAVEL_DATE_RANGE from '../services/travelDateRange.json'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const TUTORIAL_KEY = 'skyfinder-range-tutorial-v1'
const DEMO_START = '2026-11-01'
const DEMO_END = '2026-12-31'
const toMonthIndex = (iso) => {
  const [year, month] = iso.slice(0, 7).split('-').map(Number)
  return year * 12 + month - 1
}
const FIRST_MONTH = toMonthIndex(TRAVEL_DATE_RANGE.startDate)
const LAST_MONTH = toMonthIndex(TRAVEL_DATE_RANGE.endDate)
const LAST_PAIR_START = Math.max(FIRST_MONTH, LAST_MONTH - 1)
const DEMO_MONTH = toMonthIndex(DEMO_START)
const clampMonth = (month) => Math.min(LAST_PAIR_START, Math.max(FIRST_MONTH, month))
const MONTH_OPTIONS = Array.from({ length: LAST_PAIR_START - FIRST_MONTH + 1 }, (_, index) => FIRST_MONTH + index)
const monthLabel = (month) => Math.floor(month / 12) + '년 ' + (month % 12 + 1) + '월'
const TUTORIAL_MESSAGES = [
  '두 달을 모두 비교하려면, 첫날과 마지막 날을 선택하세요.',
  '먼저 11월 1일을 클릭해 시작일을 정합니다.',
  '시작일이 선택됐어요. 이제 종료일을 정해볼까요?',
  '다음으로 12월 31일을 클릭합니다.',
  '이렇게 11월 1일 ~ 12월 31일의 일정을 비교할 수 있어요.',
]
const shouldShowTutorial = () => {
  try { return window.localStorage.getItem(TUTORIAL_KEY) !== 'seen' }
  catch { return true }
}
const formatDate = (iso) => iso ? iso.replaceAll('-', '.') + '(' + WEEKDAYS[new Date(iso + 'T00:00:00').getDay()] + ')' : '날짜 선택'

export default function DateRangePicker({ startDate, endDate, onApply, onClose }) {
  const [tutorialActive, setTutorialActive] = useState(shouldShowTutorial)
  const [tutorialStep, setTutorialStep] = useState(0)
  const [tutorialRun, setTutorialRun] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(null)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [phase, setPhase] = useState('idle')
  const [hoverDate, setHoverDate] = useState(null)
  const [month, setMonth] = useState(() => tutorialActive ? DEMO_MONTH : clampMonth(toMonthIndex(startDate || endDate || TRAVEL_DATE_RANGE.startDate)))
  const dialog = useRef(null)
  const monthsRef = useRef(null)
  const demoStartRef = useRef(null)
  const demoEndRef = useRef(null)
  const closeButton = useRef(null)
  const closeAction = useRef(onClose)
  closeAction.current = onClose

  useEffect(() => {
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus()
    const handleKey = (event) => {
      if (event.key === 'Escape') closeAction.current()
      if (event.key !== 'Tab') return
      const controls = dialog.current?.querySelectorAll('button:not(:disabled), select:not(:disabled), [tabindex="0"]')
      if (!controls?.length) return
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [])

  useEffect(() => {
    if (!tutorialActive) return
    try { window.localStorage.setItem(TUTORIAL_KEY, 'seen') } catch { /* The guide still works when browser storage is unavailable. */ }
    const timers = [1400, 2500, 3900, 5100].map((delay, index) => window.setTimeout(() => setTutorialStep(index + 1), delay))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [tutorialActive, tutorialRun])

  const tutorialAtEnd = tutorialStep >= 3
  useLayoutEffect(() => {
    if (!tutorialActive) return
    const months = monthsRef.current
    const target = tutorialAtEnd ? demoEndRef.current : demoStartRef.current
    if (!months || !target) return
    const positionCursor = () => {
      const area = months.getBoundingClientRect()
      const day = target.getBoundingClientRect()
      setCursorPosition({ left: day.left - area.left + day.width * .53, top: day.top - area.top + day.height * .52 })
    }
    positionCursor()
    const observer = new ResizeObserver(positionCursor)
    observer.observe(months)
    return () => observer.disconnect()
  }, [tutorialActive, tutorialAtEnd])

  const replayTutorial = () => {
    setHoverDate(null)
    setTutorialStep(0)
    setTutorialRun((current) => current + 1)
    setTutorialActive(true)
    closeButton.current?.focus({ preventScroll: true })
  }
  const finishTutorial = () => {
    setTutorialActive(false)
    setTutorialStep(0)
    setHoverDate(null)
    window.requestAnimationFrame(() => dialog.current?.querySelector('.sf-range-day:not(:disabled)')?.focus({ preventScroll: true }))
  }
  const clearSelection = () => {
    setStart('')
    setEnd('')
    setPhase('idle')
    setHoverDate(null)
  }
  const chooseDate = (iso) => {
    if (tutorialActive) return
    if (phase === 'complete') {
      clearSelection()
      return
    }
    setHoverDate(null)
    if (phase === 'start' || !start || iso < start) {
      setStart(iso)
      setEnd('')
      setPhase('end')
    } else {
      setEnd(iso)
      setPhase('complete')
    }
  }

  const displayMonth = tutorialActive ? DEMO_MONTH : month
  const displayStart = tutorialActive ? tutorialStep >= 2 ? DEMO_START : '' : start
  const displayEnd = tutorialActive ? tutorialStep >= 4 ? DEMO_END : '' : end
  const displayPhase = tutorialActive ? tutorialStep < 2 ? 'start' : tutorialStep < 4 ? 'end' : 'complete' : phase
  const previewEnd = tutorialActive ? displayEnd : start && phase === 'end' && !end && hoverDate && hoverDate >= start ? hoverDate : end
  const renderMonth = (monthIndex) => {
    const year = Math.floor(monthIndex / 12)
    const calendarMonth = monthIndex % 12
    const offset = new Date(year, calendarMonth, 1).getDay()
    const days = new Date(year, calendarMonth + 1, 0).getDate()
    return <section className="sf-range-month" aria-label={monthLabel(monthIndex)} key={monthIndex}>
      <h3>{year}<span>.</span>{String(calendarMonth + 1).padStart(2, '0')}</h3>
      <div className="sf-range-weekdays">{WEEKDAYS.map((day, index) => <span className={index === 0 ? 'is-sunday' : index === 6 ? 'is-saturday' : ''} key={day}>{day}</span>)}</div>
      <div className="sf-range-days" onMouseLeave={() => setHoverDate(null)}>
        {Array.from({ length: 42 }, (_, index) => {
          const day = index - offset + 1
          if (day < 1 || day > days) return <span className="sf-range-day-empty" key={'empty-' + index} aria-hidden="true" />
          const iso = year + '-' + String(calendarMonth + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0')
          const isStart = iso === displayStart
          const isEnd = iso === displayEnd
          const inRange = displayStart && previewEnd && iso > displayStart && iso < previewEnd
          const demoClick = tutorialActive && ((tutorialStep === 2 && iso === DEMO_START) || (tutorialStep === 4 && iso === DEMO_END))
          const dayOfWeek = index % 7
          return <button type="button" key={iso}
            ref={iso === DEMO_START ? demoStartRef : iso === DEMO_END ? demoEndRef : undefined}
            disabled={tutorialActive || iso < TRAVEL_DATE_RANGE.startDate || iso > TRAVEL_DATE_RANGE.endDate}
            className={['sf-range-day', dayOfWeek === 0 ? 'is-sunday' : dayOfWeek === 6 ? 'is-saturday' : '', inRange ? 'is-in-range' : '', isStart ? 'is-start' : '', isEnd ? 'is-end' : '', !displayEnd && iso === previewEnd ? 'is-preview-end' : '', demoClick ? 'is-demo-click' : ''].filter(Boolean).join(' ')}
            onClick={() => chooseDate(iso)} onMouseEnter={() => { if (!tutorialActive) setHoverDate(iso) }} onFocus={() => { if (!tutorialActive) setHoverDate(iso) }} onBlur={() => setHoverDate(null)}
            aria-pressed={isStart || isEnd} aria-label={`${year}년 ${calendarMonth + 1}월 ${day}일 ${WEEKDAYS[dayOfWeek]}요일${isStart ? ' 선택한 시작일' : ''}${isEnd ? ' 선택한 종료일' : ''}`}>
            <span>{day}</span>{(isStart || isEnd) && <strong>{isStart && isEnd ? '시작·종료' : isStart ? '시작일' : '종료일'}</strong>}
          </button>
        })}
      </div>
    </section>
  }

  return <div className="sf-range-overlay" onClick={onClose}>
    <section className={'sf-range-dialog' + (tutorialActive ? ' is-tutorial' : '')} ref={dialog} role="dialog" aria-modal="true" aria-labelledby="sf-range-title" aria-describedby="sf-range-description" onClick={(event) => event.stopPropagation()}>
      <header className="sf-range-header"><div><h2 id="sf-range-title">여행 후보 기한 선택</h2><p id="sf-range-description" className="sf-range-example">{tutorialActive ? <>11·12월 중 언제가 최저가인지 궁금하신가요?<br />달력에서 여행 후보 기한을 선택하는 방법을 보여드릴게요.</> : <>예) 6·7월 중에 여름휴가를 가고 싶다면<br /><strong>6월 1일 ~ 7월 31일</strong>을 선택하세요.</>}</p></div><button type="button" ref={closeButton} onClick={onClose} className="sf-range-close" aria-label="날짜 선택 닫기">×</button></header>
      {tutorialActive && <aside className="sf-range-tutorial" aria-label="날짜 선택 방법 예시"><span>선택 방법 예시</span><p aria-live="polite" aria-atomic="true">{TUTORIAL_MESSAGES[tutorialStep]}</p></aside>}
      <div className="sf-range-selection" aria-live="polite">
        <button type="button" className={displayPhase === 'start' ? 'is-active' : ''} disabled={tutorialActive} onClick={() => setPhase('start')}><small>시작일</small><strong>{formatDate(displayStart)}</strong></button>
        <span>→</span>
        <button type="button" className={displayPhase === 'end' ? 'is-active' : ''} disabled={tutorialActive || !start} onClick={() => setPhase('end')}><small>종료일</small><strong>{formatDate(displayEnd)}</strong></button>
      </div>
      <div className="sf-range-navigation"><button type="button" className="sf-range-arrow" aria-label="날짜 선택 이전 달" disabled={tutorialActive || month <= FIRST_MONTH} onClick={() => setMonth((current) => clampMonth(current - 1))}>‹</button><label>월 바로가기<select aria-label="날짜 선택 표시 월" disabled={tutorialActive} value={displayMonth} onChange={(event) => setMonth(Number(event.target.value))}>{MONTH_OPTIONS.map((index) => <option key={index} value={index}>{monthLabel(index)}</option>)}</select></label><button type="button" className="sf-range-arrow" aria-label="날짜 선택 다음 달" disabled={tutorialActive || month >= LAST_PAIR_START} onClick={() => setMonth((current) => clampMonth(current + 1))}>›</button></div>
      <div className="sf-range-months" ref={monthsRef}>{renderMonth(displayMonth)}{renderMonth(displayMonth + 1)}{tutorialActive && tutorialStep > 0 && cursorPosition && <span className={'sf-range-demo-pointer' + (tutorialStep === 2 || tutorialStep === 4 ? ' is-clicking' : '')} style={cursorPosition} aria-hidden="true"><svg viewBox="0 0 24 28" fill="white" stroke="#0755df" strokeWidth="1.6" strokeLinejoin="round"><path d="M2 2v21l6-5 5 8 4-2-5-8 8-1Z" /></svg></span>}</div>
      <div className="sf-range-hint" role="status">{tutorialActive ? tutorialStep === 4 ? '파란색으로 표시된 두 달이 비교할 기간입니다.' : '예시를 보고 있거나, 아래 버튼을 눌러 바로 선택할 수 있어요.' : !start ? '시작일을 선택하세요.' : !end ? '종료일을 선택하세요.' : `${formatDate(start)} ~ ${formatDate(end)} 선택됨 · 다른 날짜를 누르면 선택이 해제됩니다.`}</div>
      <footer className="sf-range-footer">{tutorialActive ? <><button type="button" className="sf-range-reset" onClick={replayTutorial}>처음부터 보기</button><button type="button" className="sf-range-confirm" onClick={finishTutorial}>직접 선택하기</button></> : <><button type="button" className="sf-range-reset" onClick={clearSelection}>선택 해제</button><button type="button" className="sf-range-tutorial-link" onClick={replayTutorial}>선택 방법 보기</button><button type="button" className="sf-range-confirm" disabled={!start || !end} onClick={() => onApply(start, end)}>적용</button></>}</footer>
    </section>
  </div>
}
