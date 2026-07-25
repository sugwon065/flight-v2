const DATA_ROOT = '/data'
const jsonCache = new Map()

const RANK_COLORS = ['#22c55e', '#86efac', '#fde047', '#fb923c', '#ef4444']

function toIsoDate(value) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function fetchJson(path) {
  if (!jsonCache.has(path)) {
    jsonCache.set(
      path,
      fetch(path).then((response) => {
        if (!response.ok) throw new Error(`데이터를 불러오지 못했습니다: ${path}`)
        return response.json()
      }),
    )
  }
  return jsonCache.get(path)
}

function monthsBetween(startDate, endDate) {
  const months = []
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  const finalMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1)

  while (current <= finalMonth) {
    months.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`)
    current.setMonth(current.getMonth() + 1)
  }
  return months
}

function offerScore(offer) {
  return offer.discountPercent - offer.roundTripPrice / 200000
}

function chooseOffer(record, airlineType) {
  if (airlineType === 'LCC') return record.lcc
  if (airlineType === 'FSC') return record.fsc

  const choices = [record.lcc, record.fsc].filter(Boolean)
  if (choices.length === 0) return null
  return choices.reduce((best, offer) => (
    offer.roundTripPrice < best.roundTripPrice ? offer : best
  ))
}

function startDateGap(left, right) {
  const leftDate = new Date(`${left.departure_date}T00:00:00`)
  const rightDate = new Date(`${right.departure_date}T00:00:00`)
  return Math.abs((leftDate - rightDate) / 86400000)
}

function selectWithGap(candidates, limit, minimumGap) {
  const selected = []
  for (const candidate of candidates) {
    if (selected.every((item) => startDateGap(item, candidate) >= minimumGap)) {
      selected.push(candidate)
    }
    if (selected.length === limit) break
  }
  return selected
}

function selectDiverseResults(candidates, destinationId, tripDays) {
  const sorted = [...candidates].sort((left, right) => (
    right.score - left.score || left.round_trip_price - right.round_trip_price
  ))

  let pool = sorted
  if (destinationId === 'japan-all') {
    const bestByDestination = new Map()
    for (const candidate of sorted) {
      if (!bestByDestination.has(candidate.destination_id)) {
        bestByDestination.set(candidate.destination_id, candidate)
      }
    }
    pool = [...bestByDestination.values()].sort((left, right) => (
      right.score - left.score || left.round_trip_price - right.round_trip_price
    ))
  }

  for (const minimumGap of [tripDays, 5, 3, 0]) {
    const selected = selectWithGap(pool, 5, minimumGap)
    if (selected.length === 5) return selected
  }
  return pool.slice(0, 5)
}

export async function loadDestinations() {
  const payload = await fetchJson(`${DATA_ROOT}/destinations.json`)
  return [
    { id: 'japan-all', name: '일본 전체', airportCode: 'JP' },
    ...payload.destinations,
  ]
}

export async function searchFlightDeals({
  destinationId,
  startDate,
  endDate,
  tripDays,
  airlineType = 'ALL',
}) {
  const [destinations, ...monthlyPayloads] = await Promise.all([
    loadDestinations(),
    ...monthsBetween(startDate, endDate).map((month) => (
      fetchJson(`${DATA_ROOT}/offers/${String(tripDays).padStart(2, '0')}/${month}.json`)
    )),
  ])

  const destinationNames = new Map(destinations.map((item) => [item.id, item.name]))
  const startIso = toIsoDate(startDate)
  const endIso = toIsoDate(endDate)
  const candidates = []

  for (const payload of monthlyPayloads) {
    for (const record of payload.offers) {
      if (destinationId !== 'japan-all' && record.destinationId !== destinationId) continue
      if (record.departureDate < startIso || record.returnDate > endIso) continue

      const offer = chooseOffer(record, airlineType)
      if (!offer) continue
      const resolvedType = record.lcc === offer ? 'LCC' : 'FSC'
      candidates.push({
        destination_id: record.destinationId,
        destination: destinationNames.get(record.destinationId),
        departure_date: record.departureDate,
        return_date: record.returnDate,
        airline_name: offer.airlineName,
        airline_type: resolvedType,
        outbound_price: offer.outboundPrice,
        return_price: offer.returnPrice,
        round_trip_price: offer.roundTripPrice,
        usual_price: offer.usualPrice,
        discount_percent: offer.discountPercent,
        score: offerScore(offer),
      })
    }
  }

  return selectDiverseResults(candidates, destinationId, tripDays).map((item, index) => ({
    ...item,
    rank: index + 1,
    color: RANK_COLORS[index],
  }))
}
