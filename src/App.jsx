import { useCallback, useEffect, useMemo, useState } from 'react'
import CalendarPopup from './components/CalendarPopup'
import ResultsPage from './components/ResultsPage'
import SearchHome from './components/SearchHome'
import { loadDestinations, searchFlightDeals } from './services/flightData'
import './App.css'

export default function App() {
  const [page, setPage] = useState('search')
  const [destinations, setDestinations] = useState([])
  const [destinationId, setDestinationId] = useState('japan-all')
  const [startDate, setStartDate] = useState(new Date(2026, 0, 1))
  const [endDate, setEndDate] = useState(new Date(2026, 1, 28))
  const [tripDays, setTripDays] = useState(6)
  const [airlineType, setAirlineType] = useState('ALL')
  const [showCalendar, setShowCalendar] = useState(false)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDestinations()
      .then(setDestinations)
      .catch(() => setError('여행지 데이터를 불러오지 못했습니다.'))
  }, [])

  const destinationName = useMemo(
    () => destinations.find((item) => item.id === destinationId)?.name || '일본 전체',
    [destinationId, destinations],
  )

  const handleSearch = useCallback(async () => {
    if (!startDate || !endDate) {
      setError('여행 가능한 시작일과 종료일을 선택해 주세요.')
      return
    }
    if (startDate > endDate) {
      setError('종료일은 시작일보다 뒤여야 합니다.')
      return
    }

    setError('')
    setLoading(true)
    setShowCalendar(false)
    setPage('results')
    setResults([])

    try {
      const data = await searchFlightDeals({
        destinationId,
        startDate,
        endDate,
        tripDays,
        airlineType,
      })
      setResults(data)
    } catch {
      setError('검색 데이터를 불러오지 못했습니다. 2026년 범위에서 다시 선택해 주세요.')
    } finally {
      setLoading(false)
    }
  }, [airlineType, destinationId, endDate, startDate, tripDays])

  const handleBackToSearch = () => {
    setPage('search')
    setError('')
  }

  if (page === 'results') {
    return (
      <ResultsPage
        destination={destinationName}
        startDate={startDate}
        endDate={endDate}
        tripDays={tripDays}
        results={results}
        loading={loading}
        error={error}
        onBack={handleBackToSearch}
        onSearchAgain={handleBackToSearch}
      />
    )
  }

  return (
    <div className="app">
      <SearchHome
        destinationId={destinationId}
        destinations={destinations}
        onDestinationChange={setDestinationId}
        startDate={startDate}
        endDate={endDate}
        onPeriodClick={() => setShowCalendar(true)}
        tripDays={tripDays}
        onTripDaysChange={setTripDays}
        airlineType={airlineType}
        onAirlineTypeChange={setAirlineType}
        onSearch={handleSearch}
        loading={loading}
        error={error}
      />

      {showCalendar && (
        <CalendarPopup
          startDate={startDate}
          endDate={endDate}
          onSelectRange={(start, end) => {
            setStartDate(start)
            setEndDate(end)
          }}
          onClose={() => setShowCalendar(false)}
          onConfirm={() => setShowCalendar(false)}
        />
      )}
    </div>
  )
}
