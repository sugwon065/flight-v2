import TRAVEL_DATE_RANGE from './travelDateRange.json'

const DATA_ROOT = '/data'
const jsonCache = new Map()

export const PRICE_COLORS = ['#acd1ff', '#d4e8ff', '#e3effc', '#fff0f2', '#ffe0e6']
const RANK_COLORS = PRICE_COLORS

function toIsoDate(value) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function fetchJson(path, { refresh = false } = {}) {
  let request = jsonCache.get(path)
  if (refresh || !request) {
    request = fetch(path, { cache: 'no-cache' }).then((response) => {
      if (!response.ok) throw new Error(`데이터를 불러오지 못했습니다: ${path}`)
      return response.json()
    }).catch((error) => {
      if (jsonCache.get(path) === request) jsonCache.delete(path)
      throw error
    })
    jsonCache.set(path, request)
  }
  return request
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

function chooseOffer(record, airlineType) {
  if (airlineType === 'LCC') return record.lcc
  if (airlineType === 'FSC') return record.fsc

  const choices = [record.lcc, record.fsc].filter(Boolean)
  if (choices.length === 0) return null
  return choices.reduce((best, offer) => (
    offer.roundTripPrice < best.roundTripPrice ? offer : best
  ))
}

function comparePrice(left, right) {
  return left.round_trip_price - right.round_trip_price
    || left.departure_date.localeCompare(right.departure_date)
    || left.destination_id.localeCompare(right.destination_id)
}

function colorText(color) {
  const channels = color.match(/\w\w/g).map((hex) => {
    const value = parseInt(hex, 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  return luminance > 0.179 ? '#000000' : '#ffffff'
}

function rankResults(items, colors = RANK_COLORS) {
  return items.map((item, index) => {
    const color = colors[Math.min(index, colors.length - 1)]
    return { ...item, rank: index + 1, color, color_text: colorText(color) }
  })
}

export function findCheapestRegions(candidates, limit = 5) {
  const bestByDestination = new Map()
  for (const candidate of candidates) {
    const best = bestByDestination.get(candidate.destination_id)
    if (!best || comparePrice(candidate, best) < 0) {
      bestByDestination.set(candidate.destination_id, candidate)
    }
  }
  return rankResults([...bestByDestination.values()].sort(comparePrice).slice(0, limit))
}

export function findCheapestPeriods(candidates, destinationId) {
  return rankResults(candidates
    .filter((item) => item.destination_id === destinationId)
    .sort(comparePrice)
    .slice(0, 5))
}

export function getDailyFlightPrices(candidates) {
  const bestByDate = new Map()
  for (const candidate of candidates) {
    const best = bestByDate.get(candidate.departure_date)
    if (!best || comparePrice(candidate, best) < 0) bestByDate.set(candidate.departure_date, candidate)
  }
  // One scale for the entire selected search range keeps a date's color
  // consistent when moving between months. Equal fares have equal colors.
  const prices = [...new Set([...bestByDate.values()].map((item) => item.round_trip_price))].sort((a, b) => a - b)
  const levels = new Map(prices.map((price, index) => [price,
    prices.length === 1 ? 0 : Math.round(index * 4 / (prices.length - 1)),
  ]))
  return [...bestByDate.values()].sort((a, b) => a.departure_date.localeCompare(b.departure_date)).map((item) => ({
    ...item, price_level: levels.get(item.round_trip_price), price_color: PRICE_COLORS[levels.get(item.round_trip_price)],
  }))
}

export async function loadDestinations({ refresh = false } = {}) {
  const payload = await fetchJson(`${DATA_ROOT}/destinations.json`, { refresh })
  return [
    { id: 'japan-all', name: '일본 전체', airportCode: 'JP' },
    ...payload.destinations,
  ]
}

export function resolveDestinationIds({ destinationIds, destinationId } = {}) {
  if (Array.isArray(destinationIds)) return [...new Set(destinationIds.filter((id) => id && id !== 'japan-all'))]
  return destinationId && destinationId !== 'japan-all' ? [destinationId] : []
}

export async function loadFlightCandidates({
  destinationId = 'japan-all',
  destinationIds,
  startDate,
  endDate,
  tripDays,
  airlineType = 'ALL',
}, { refresh = false } = {}) {
  const startIso = toIsoDate(startDate)
  const endIso = toIsoDate(endDate)
  if (startIso < TRAVEL_DATE_RANGE.startDate || endIso > TRAVEL_DATE_RANGE.endDate || startIso > endIso) {
    throw new Error('생성된 여행 후보 기한 밖의 검색입니다.')
  }
  const [destinations, ...monthlyPayloads] = await Promise.all([
    loadDestinations({ refresh }),
    ...monthsBetween(startDate, endDate).map((month) => (
      fetchJson(`${DATA_ROOT}/offers/${String(tripDays).padStart(2, '0')}/${month}.json`, { refresh })
    )),
  ])

  const destinationNames = new Map(destinations.map((item) => [item.id, item.name]))
  const candidates = []
  const destinationFilter = new Set(resolveDestinationIds({ destinationIds, destinationId }))

  for (const payload of monthlyPayloads) {
    for (const record of payload.offers) {
      if (destinationFilter.size > 0 && !destinationFilter.has(record.destinationId)) continue
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
      })
    }
  }

  return candidates
}

export async function searchFlightDeals(conditions) {
  const candidates = await loadFlightCandidates(conditions)
  const destinationIds = resolveDestinationIds(conditions)
  return destinationIds.length === 1
    ? findCheapestPeriods(candidates, destinationIds[0])
    : findCheapestRegions(candidates)
}
