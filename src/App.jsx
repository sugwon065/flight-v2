import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import RecommendationDashboard from './components/RecommendationDashboard'
import TRAVEL_DATE_RANGE from './services/travelDateRange.json'
import { resetVisitState } from './services/visitState'
import { findCheapestPeriods, findCheapestRegions, loadDestinations, loadFlightCandidates, resolveDestinationIds } from './services/flightData'

const INITIAL_FORM = {
  destinationIds: [], startDate: '2026-10-01', endDate: '2026-11-30',
  tripDays: 6, airlineType: 'ALL',
}

export default function App() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [conditions, setConditions] = useState(INITIAL_FORM)
  const [destinations, setDestinations] = useState([])
  const [candidates, setCandidates] = useState([])
  const [selectedCity, setSelectedCity] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const latestRequest = useRef(0)

  const runSearch = useCallback(async (nextForm) => {
    if (!nextForm.startDate || !nextForm.endDate) {
      setError('여행 가능한 시작일과 종료일을 선택해 주세요.')
      return
    }
    if (nextForm.startDate > nextForm.endDate) {
      setError('종료일은 시작일보다 뒤여야 합니다.')
      return
    }
    if (nextForm.startDate < TRAVEL_DATE_RANGE.startDate || nextForm.endDate > TRAVEL_DATE_RANGE.endDate) {
      setError(`여행 후보 기한은 ${TRAVEL_DATE_RANGE.startDate.replaceAll('-', '.')} ~ ${TRAVEL_DATE_RANGE.endDate.replaceAll('-', '.')} 안에서 선택해 주세요.`)
      return
    }
    const searchForm = { ...nextForm, destinationIds: resolveDestinationIds(nextForm) }
    const request = ++latestRequest.current
    setHasSearched(true)
    setLoading(true)
    setConditions(searchForm)
    setError('')
    setSelectedCity(null)
    setSelectedDate(null)
    setCandidates([])
    try {
      const data = await loadFlightCandidates({
        ...searchForm,
        startDate: new Date(nextForm.startDate + 'T00:00:00'),
        endDate: new Date(nextForm.endDate + 'T00:00:00'),
      }, { refresh: true })
      if (latestRequest.current !== request) return
      setCandidates(data)
      setSelectedCity(findCheapestRegions(data)[0] ?? null)
      setSelectedDate(null)
      return true
    } catch {
      if (latestRequest.current === request) setError('여행 데이터를 불러오지 못했습니다. 다시 검색해 주세요.')
    } finally {
      if (latestRequest.current === request) setLoading(false)
    }
  }, [])

  const resetSearch = useCallback(() => {
    // Invalidate pending searches so their responses cannot restore cleared results.
    latestRequest.current += 1
    const initialForm = { ...INITIAL_FORM, destinationIds: [] }
    setForm(initialForm)
    setConditions(initialForm)
    setCandidates([])
    setSelectedCity(null)
    setSelectedDate(null)
    setHasSearched(false)
    setLoading(false)
    setError('')
  }, [])

  useEffect(() => {
    resetVisitState()
    const previousScrollRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    const resetOnLeave = () => {
      resetVisitState()
      resetSearch()
    }
    const restartOnReturn = (event) => {
      if (event.persisted) window.location.reload()
    }
    window.addEventListener('pagehide', resetOnLeave)
    window.addEventListener('pageshow', restartOnReturn)
    return () => {
      window.removeEventListener('pagehide', resetOnLeave)
      window.removeEventListener('pageshow', restartOnReturn)
      window.history.scrollRestoration = previousScrollRestoration
    }
  }, [resetSearch])

  useEffect(() => {
    let active = true
    loadDestinations().then((data) => { if (active) setDestinations(data) }).catch(() => {
      if (active) setError('도시 목록을 불러오지 못했습니다. 페이지를 새로고침해 주세요.')
    })
    runSearch(INITIAL_FORM)
    return () => { active = false; latestRequest.current += 1 }
  }, [runSearch])

  const cities = useMemo(() => findCheapestRegions(candidates, Infinity), [candidates])
  const cityCandidates = useMemo(() => candidates.filter((item) => item.destination_id === selectedCity?.destination_id), [candidates, selectedCity])
  const periods = useMemo(() => selectedCity ? findCheapestPeriods(candidates, selectedCity.destination_id) : [], [candidates, selectedCity])
  const selectedOffer = cityCandidates.find((item) => item.departure_date === selectedDate)
  const formDestinationIds = resolveDestinationIds(form)
  const resultDestinationIds = resolveDestinationIds(conditions)
  const dirty = formDestinationIds.length !== resultDestinationIds.length
    || formDestinationIds.some((id) => !resultDestinationIds.includes(id))
    || ['startDate', 'endDate', 'tripDays', 'airlineType'].some((key) => form[key] !== conditions[key])

  return (
    <RecommendationDashboard
      form={{ ...form, destinationIds: formDestinationIds }} onFormChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))}
      conditions={{ ...conditions, destinationIds: resultDestinationIds }} destinations={destinations} cities={cities}
      selectedCity={selectedCity} cityCandidates={cityCandidates} periods={periods}
      selectedDate={selectedDate} selectedOffer={selectedOffer}
      onSelectDate={setSelectedDate}
      onSelectCity={(city) => { setSelectedCity(city); setSelectedDate(null) }}
      onBackToCities={() => { setSelectedCity(null); setSelectedDate(null) }}
      onSearch={() => runSearch(form)} onReset={resetSearch} hasSearched={hasSearched}
      loading={loading} error={error} dirty={dirty}
    />
  )
}
