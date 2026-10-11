import { useEffect, useRef, useState } from 'react'
import './TripDurationSelect.css'

const OPTIONS = Array.from({ length: 15 }, (_, index) => ({
  value: index + 1,
  label: `${index}박 ${index + 1}일`,
}))

export default function TripDurationSelect({ value, onChange, open, onOpenChange, icon }) {
  const container = useRef(null)
  const trigger = useRef(null)
  const list = useRef(null)
  const optionRefs = useRef([])
  const selectedIndex = Math.max(0, OPTIONS.findIndex((option) => option.value === value))
  const [activeIndex, setActiveIndex] = useState(selectedIndex)

  useEffect(() => {
    if (!open) return
    const closeOutside = (event) => {
      if (!container.current?.contains(event.target)) onOpenChange(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('focusin', closeOutside)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('focusin', closeOutside)
    }
  }, [open, onOpenChange])

  useEffect(() => {
    if (!open) return
    const menu = list.current
    const option = optionRefs.current[activeIndex]
    if (!menu || !option) return
    const top = option.offsetTop
    const bottom = top + option.offsetHeight
    if (top < menu.scrollTop) menu.scrollTop = top
    else if (bottom > menu.scrollTop + menu.clientHeight) menu.scrollTop = bottom - menu.clientHeight
  }, [open, activeIndex])

  const openList = (index = selectedIndex) => {
    setActiveIndex(index)
    onOpenChange(true)
  }
  const choose = (index) => {
    onChange(OPTIONS[index].value)
    onOpenChange(false)
    trigger.current?.focus({ preventScroll: true })
  }
  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) openList()
      else setActiveIndex((current) => Math.max(0, Math.min(OPTIONS.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1))))
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      const index = event.key === 'Home' ? 0 : OPTIONS.length - 1
      if (!open) openList(index)
      else setActiveIndex(index)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (open) choose(activeIndex)
      else openList()
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      event.stopPropagation()
      onOpenChange(false)
    } else if (event.key === 'Tab') {
      onOpenChange(false)
    }
  }

  return <div ref={container} className={'sf-duration-field sf-duration-select' + (open ? ' is-open' : '')}>
    <button ref={trigger} id="sf-trip-days" type="button" className="sf-search-field sf-duration-trigger"
      role="combobox" aria-haspopup="listbox" aria-expanded={open}
      aria-controls={open ? 'sf-trip-days-options' : undefined}
      aria-activedescendant={open ? `sf-trip-days-option-${activeIndex}` : undefined}
      aria-labelledby="sf-trip-days-label sf-trip-days-value"
      onClick={() => open ? onOpenChange(false) : openList()} onKeyDown={handleKeyDown}>
      {icon}
      <span className="sf-search-control-value">
        <span id="sf-trip-days-label" className="sf-field-label">여행일수</span>
        <span id="sf-trip-days-value" className="sf-duration-trigger-value">{OPTIONS[selectedIndex].label}</span>
      </span>
      <svg className="sf-duration-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
    </button>
    {open && <ul ref={list} id="sf-trip-days-options" className="sf-duration-menu" role="listbox" aria-labelledby="sf-trip-days-label">
      {OPTIONS.map((option, index) => <li key={option.value} ref={(node) => { optionRefs.current[index] = node }}
        id={`sf-trip-days-option-${index}`} role="option" aria-selected={option.value === value}
        className={'sf-duration-option' + (index === activeIndex ? ' is-active' : '')}
        onMouseEnter={() => setActiveIndex(index)} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(index)}>
        <span>{option.label}</span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4 10-10" /></svg>
      </li>)}
    </ul>}
  </div>
}
