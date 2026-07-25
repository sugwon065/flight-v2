import './ResultsSortTabs.css'

function formatPrice(price) {
  if (!price) return '—'
  return '₩' + price.toLocaleString('ko-KR')
}

export default function ResultsSortTabs({ results, activeTab, onTabChange }) {
  const recommended = results[0]?.round_trip_price
  const cheapest = Math.min(...results.map((item) => item.round_trip_price))
  const bestDiscount = Math.max(...results.map((item) => item.discount_percent || 0))

  const tabs = [
    { id: 'recommend', label: '추천순', price: recommended, meta: '지역·기간 다양성' },
    { id: 'cheapest', label: '최저가', price: cheapest, meta: '왕복 최종가 기준' },
    { id: 'discount', label: '할인율순', price: null, meta: `최대 ${bestDiscount.toFixed(1)}% 할인` },
  ]

  return (
    <div className="sort-tabs-wrap">
      <div className="sort-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`sort-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="sort-tab-label">{tab.label}</span>
            <span className="sort-tab-price">{formatPrice(tab.price)}</span>
            <span className="sort-tab-meta">{tab.meta}</span>
          </button>
        ))}
      </div>
      <div className="sort-dropdown">
        <span>정렬</span>
        <span className="sort-chevron">▾</span>
      </div>
    </div>
  )
}
