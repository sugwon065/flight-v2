# SkyFinder v2 데이터

## 생성

프로젝트 루트(`flight-v2`)에서 실행합니다.

```powershell
python scripts/generate_data.py
```

생성기는 고정 시드를 사용하므로 규칙이 같으면 같은 JSON을 다시 만듭니다.

## 구성

```text
public/data/
├── airlines.json
├── destinations.json
├── manifest.json
└── offers/
    ├── 01/
    │   ├── 2026-01.json
    │   └── ...
    ├── 02/
    └── 15/
```

`offers/{여행일수}/{출발월}.json` 형식입니다. 예를 들어 6일 여행의 2026년 1월 출발 후보는 다음 URL에서 읽습니다.

```text
/data/offers/06/2026-01.json
```

## 왕복 후보 형식

```json
{
  "destinationId": "fukuoka",
  "departureDate": "2026-01-15",
  "returnDate": "2026-01-20",
  "lcc": {
    "airlineId": "jeju-air",
    "airlineName": "제주항공",
    "outboundPrice": 80000,
    "returnPrice": 80000,
    "roundTripPrice": 160000,
    "usualPrice": 230000,
    "discountPercent": 30.4
  },
  "fsc": {
    "airlineId": "asiana",
    "airlineName": "아시아나항공",
    "outboundPrice": 130000,
    "returnPrice": 130000,
    "roundTripPrice": 260000,
    "usualPrice": 350000,
    "discountPercent": 25.7
  }
}
```

해당 목적지에 LCC 또는 FSC 노선이 없으면 값은 `null`입니다.

## 대시보드 사용 방식

1. 선택한 여행일수 폴더에서 선택 기간에 해당하는 월 JSON만 가져옵니다.
2. `departureDate`와 `returnDate`가 사용자의 여행 가능 기간 안에 있는 후보만 남깁니다.
3. 항공사 유형 필터에 따라 `lcc`, `fsc` 또는 둘 다 사용합니다.
4. `discountPercent`와 `roundTripPrice`를 기준으로 목적지별 후보를 정렬합니다.
5. 목적지 중복과 가까운 출발일을 제거한 뒤 Top 5를 표시합니다.

가격은 실제 조회값이 아닌 시뮬레이션 데이터이며 세금과 유류할증료가 포함된 최종 왕복가를 가정합니다.
