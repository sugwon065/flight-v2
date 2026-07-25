import './PromoSidebar.css'

export default function PromoSidebar() {
  return (
    <aside className="promo-sidebar" aria-label="광고 영역">
      <div className="promo-placeholder promo-placeholder--rental">
        <img
          className="promo-ad-image"
          src="/ads/rental-car-promo.png"
          alt="부산 렌터카 특가 광고"
        />
      </div>
      <div className="promo-placeholder promo-placeholder--small">
        <img
          className="promo-ad-image"
          src="/ads/data-analysis.webp"
          alt="데이터 분석 프로젝트"
        />
        <span className="promo-ad-caption">
          경기대 데이터 분석동아리 D.N.A
        </span>
      </div>
    </aside>
  )
}
