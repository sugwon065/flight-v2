# 지역·요일별 항공권 가격 조사와 데이터 반영

조사일: 2026-10-07. 출발지는 인천(ICN), 통화는 KRW입니다.

공개 가격을 기준으로 시뮬레이션의 도시별 가격 수준을 보정했습니다. 아래 가격은 여러 날짜·항공사·여행 길이에 걸친 공개 최저가이며 평균 운임이나 실시간 예약 확정 가격이 아닙니다. 2026년 10월 이후의 조회값을 2026.10.01 ~ 2027.07.31의 모의 데이터에 적용했습니다. 날짜별 실제 운임을 복원하거나 확정 예약가를 제공하는 데이터는 아닙니다.

## 도시별 공개 왕복 최저가

스카이스캐너 노선 페이지의 왕복 FAQ 가격을 사용했습니다. 페이지는 최근 며칠간 수집한 예상 가격이라고 설명합니다. 직항/경유, 동일 항공사 왕복, 수하물 조건이 모두 통제된 비교는 아닙니다. 노선 페이지의 대표 편도 가격을 두 배로 계산하지 않았습니다.

| 도시 | 공항 | 공개 왕복 최저가 | 출처 |
| --- | --- | ---: | --- |
| 도쿄(나리타) | NRT | 201,506원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/nrt/incheon-international-to-tokyo-narita.html) |
| 도쿄(하네다) | HND | 312,595원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/hnd/incheon-international-to-tokyo-haneda.html) |
| 오사카(간사이) | KIX | 157,902원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/kix/incheon-international-to-kansai-international-osaka.html) |
| 후쿠오카 | FUK | 180,201원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/fuk/incheon-international-to-fukuoka.html) |
| 삿포로 | CTS | 232,921원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/cts/incheon-international-to-sapporo-chitose.html) |
| 나고야 | NGO | 221,605원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/ngo/incheon-international-to-nagoya-chubu-centrair.html) |
| 오키나와 | OKA | 226,005원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/oka/incheon-international-to-okinawa-naha.html) |
| 가고시마 | KOJ | 194,605원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/koj/incheon-international-to-kagoshima.html) |
| 니가타 | KIJ | 268,494원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/kij/incheon-international-to-niigata.html) |
| 아오모리 | AOJ | 299,939원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/aoj/incheon-international-to-aomori.html) |
| 센다이 | SDJ | 336,913원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/sdj/incheon-international-to-sendai.html) |
| 미야자키 | KMI | 246,029원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/kmi/incheon-international-to-miyazaki.html) |
| 고마쓰 | KMQ | 273,376원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/kmq/incheon-international-to-komatsu.html) |
| 오카야마 | OKJ | 236,507원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/okj/incheon-international-to-okayama.html) |
| 구마모토 | KMJ | 233,900원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/kmj/incheon-international-to-kumamoto.html) |
| 마쓰야마 | MYJ | 223,187원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/myj/incheon-international-to-matsuyama.html) |
| 시즈오카 | FSZ | 262,753원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/fsz/incheon-international-to-shizuoka.html) |
| 히로시마 | HIJ | 200,060원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/hij/incheon-international-to-hiroshima-international.html) |
| 오이타 | OIT | 211,616원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/oit/incheon-international-to-oita.html) |
| 하코다테 | HKD | 327,632원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/hkd/incheon-international-to-hakodate.html) |
| 고베 | UKB | 217,899원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/ukb/incheon-international-to-kobe.html) |
| 기타큐슈 | KKJ | 198,267원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/kkj/incheon-international-to-kita-kyushu.html) |
| 다카마쓰 | TAK | 206,493원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/tak/incheon-international-to-takamatsu.html) |
| 사가 | HSG | 182,989원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/hsg/incheon-international-to-saga.html) |
| 요나고 | YGJ | 183,094원 | [노선 페이지](https://www.skyscanner.co.kr/routes/icn/ygj/incheon-international-to-yonago.html) |

이번 조회에서는 오사카가 사가·요나고보다 낮습니다. 소도시를 무조건 TOP 5로 만드는 순위 규칙은 적용하지 않고, 보정한 가격을 기존 알고리즘으로 정렬합니다.

## FSC 가격 기준

대한항공 공식 페이지의 인천 출발 왕복 일반석 월별 공개 최저가를 별도로 수집했습니다. 조회 페이지의 2026년 10월~2027년 3월 중 가장 낮은 공개값입니다. 스카이스캐너 값과 조회 범위·여정이 동일하지 않으므로 두 표의 비율을 실측 LCC/FSC 가격 차이로 해석하지 않습니다.

| 도시 | 대한항공 공개 왕복 기준 | 출처 |
| --- | ---: | --- |
| 후쿠오카 | 289,200원 | [대한항공](https://www.koreanair.com/flights/ko-kr/flights-from-seoul-to-fukuoka) |
| 도쿄(나리타) | 338,200원 | [대한항공](https://www.koreanair.com/flights/ko-kr/flights-from-seoul-to-tokyo) |
| 삿포로 | 372,400원 | [대한항공](https://www.koreanair.com/flights/ko-kr/flights-from-seoul-to-sapporo) |
| 나고야 | 342,400원 | [대한항공](https://www.koreanair.com/flights/ko-kr/flights-from-seoul-to-nagoya) |
| 오키나와 | 471,800원 | [대한항공](https://www.koreanair.com/flights/ko-kr/flights-from-seoul-to-okinawa) |
| 가고시마 | 219,600원 | [대한항공](https://www.koreanair.com/flights/ko-kr/flights-from-seoul-to-kagoshima) |
| 니가타 | 293,500원 | [대한항공](https://www.koreanair.com/flights/ko-kr/flights-from-seoul-to-niigata) |
| 아오모리 | 321,500원 | [대한항공](https://www.koreanair.com/flights/ko-kr/flights-from-seoul-to-aomori) |
| 고마쓰 | 293,200원 | [대한항공](https://www.koreanair.com/flights/ko-kr/flights-from-seoul-to-komatsu) |
| 오카야마 | 257,600원 | [대한항공](https://www.koreanair.com/flights/ko-kr/flights-from-seoul-to-okayama) |

현재 노선 목록에 LCC가 있으면 스카이스캐너 값을 LCC의 가격 규모를 잡는 근사 기준으로 사용합니다. FSC는 공식 월별 가격이 있으면 그 값을 쓰며, 없으면 현재 노선 목록의 유형에 따라 공개 노선 최저가 또는 LCC 기준의 1.34배를 사용합니다. **이 유형 배정과 1.34배는 모델 가정이며, 수집한 최저가의 실제 항공사 유형을 확인한 결과가 아닙니다.** 항공사 취항 목록과 실제 운항 요일은 이번 작업에서 갱신하지 않았습니다.

## 공개 일별 가격과 요일

대한항공의 인천 출발 일자별 왕복 일반석 공개 운임 284개를 저장했습니다. 출발일은 2026년 10월 6일~11월 6일 범위이며, 도시마다 일부 날짜가 없습니다. 오사카 페이지의 김포(GMP) 출발 자료는 제외했습니다. 원자료에는 출발일·귀국일·왕복가·조회일·출처 URL이 있습니다.

다음 표는 출발 요일별 공개 왕복가 중앙값입니다. **귀국일, 여행 길이, 예약까지 남은 기간, 공휴일이 서로 다르므로 정확한 요일 할증률을 나타내지 않습니다. 이 표의 값을 생성기 요일 계수로 직접 학습하지 않았습니다.** 표본이 없는 요일은 —로 표시합니다.

| 도시 | 표본 수 | 월 | 화 | 수 | 목 | 금 | 토 | 일 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 후쿠오카 | 31 | 356,700원 | 349,200원 | 364,200원 | 369,200원 | 402,000원 | 394,500원 | 414,500원 |
| 도쿄(나리타) | 31 | 490,700원 | 498,800원 | 463,200원 | 483,200원 | 503,500원 | 500,700원 | 516,000원 |
| 삿포로 | 31 | 489,900원 | 422,400원 | 477,400원 | 513,100원 | 477,400원 | 512,400원 | 509,900원 |
| 나고야 | 31 | 443,600원 | 428,600원 | 443,600원 | 459,100원 | 452,700원 | 465,500원 | 483,000원 |
| 오키나와 | 31 | 509,300원 | 482,200원 | 506,800원 | 551,800원 | 574,500원 | 574,300원 | 501,800원 |
| 가고시마 | 31 | 314,600원 | 394,600원 | 259,600원 | 471,700원 | 471,850원 | 410,650원 | 377,400원 |
| 니가타 | 31 | 418,350원 | 548,500원 | 343,200원 | 363,500원 | 393,350원 | 455,850원 | 343,500원 |
| 아오모리 | 20 | 765,600원 | 327,850원 | 361,200원 | 361,200원 | 461,200원 | 334,500원 | 502,100원 |
| 고마쓰 | 31 | 445,700원 | 513,500원 | 363,200원 | 564,900원 | 525,700원 | 425,700원 | 439,350원 |
| 오카야마 | 16 | 447,600원 | 262,600원 | 372,900원 | 262,600원 | 542,200원 | 372,600원 | 422,750원 |

[Google의 2026년 분석](https://blog.google/products-and-platforms/products/search/holiday-travel-trends-2026/)은 미국 출발 기준으로 평일 출국·귀국의 이점을 설명합니다. 반면 [Expedia의 2026년 보고서](https://www.expedia.com/newsroom/expedia-2026-air-hacks/)는 미국 예약 자료에서 금요일 출발이 더 저렴한 결과를 제시합니다. 모집단과 조건에 따라 결과가 달라지므로 특정 요일을 모든 노선의 고정 최저가로 설정하지 않습니다. [스카이스캐너 한국 안내](https://www.skyscanner.co.kr/flights/advice/how-to-find-great-deals)도 출발일과 귀국일을 각각 조정해 비교할 것을 권합니다.

## 생성기에 적용한 규칙

1. 공개 최저가 × 1.25를 성수기·특가·요일 조정 전의 중립 왕복 기준으로 잡습니다. **25%는 평균 운임을 추정하기 위한 모델 설정값이지 조사로 얻은 평균 할증률이 아닙니다.**
2. 중립 왕복 기준을 두 편의 기본 운임으로 나눕니다. 기존 모의 고정비를 더하고 변동 운임에 계절·요일·특가·작은 잡음을 적용합니다.
3. 월~일 순서의 실제 요일을 그대로 적용합니다. 이전의 도시별 임의 요일 회전은 제거합니다.
4. 출국과 귀국을 각각 계산합니다. 예를 들어 금요일 출국·월요일 귀국과 화요일 출국·일요일 귀국은 여행일수와 각 방향의 운임을 함께 비교합니다.
5. 요일 계수는 아래의 **추정 패턴**을 평균 1로 정규화해서 사용합니다. LCC는 전체 강도, FSC는 편차의 75%를 적용하며, 이 유형별 강도도 모델 설정입니다. 고정비에는 요일 할증을 적용하지 않습니다.
6. 하루짜리 특가일을 7~10일 간격으로 흩어 배치하는 기존 생성 방식을 유지합니다. 특가가 요일 효과보다 클 수 있어 주말도 최저가가 될 수 있습니다.
7. 기존 TOP 5 검색 알고리즘과 화면 색상은 그대로 가격 데이터를 사용합니다.

| 요일 | 출국 패턴 (정규화 전) | 귀국 패턴 (정규화 전) |
| --- | ---: | ---: |
| 월 | 0.96 | 1.00 |
| 화 | 0.94 | 0.95 |
| 수 | 0.95 | 0.95 |
| 목 | 1.00 | 0.99 |
| 금 | 1.08 | 1.02 |
| 토 | 1.06 | 1.04 |
| 일 | 1.01 | 1.09 |

지역별 월 보정, 성수기 날짜, 고정비, 특가 간격·할인 깊이는 기존 시뮬레이션 설정입니다. 이번 조사로 실측한 값이 아닙니다.

## 파일과 재생성

- 조사 원자료와 모델 설정: `scripts/pricing_research.json`
- 생성기: `scripts/generate_data.py`
- 생성된 가격 모델·출처: `public/data/pricing-model.json`
- 화면이 읽는 가격: `public/data/offers/{여행일수}/{출발월}.json`
- 데이터 출처·종류: `public/data/manifest.json`의 `pricingModel`

`python scripts/generate_data.py`로 가격을 다시 생성합니다. 초기 검색과 도시 찾기 재검색에서 월별 JSON을 다시 가져옵니다. 데이터 변경 후 도시 찾기를 다시 누르거나 페이지를 새로고침하면 최신 가격을 가져옵니다. 도시 선택과 달력 조회는 현재 검색의 후보를 재사용합니다.

실제 요일별 통계를 만들려면 동일 출발지·목적지·항공사 유형·직항 여부·수하물·여행일수·예약 선행 기간의 견적을 반복 수집하고, 공휴일을 제외하거나 보정한 뒤 비교해야 합니다. 이번 자료는 그 수집 구조에 맞춰 출처와 날짜를 남기는 첫 조사본입니다.
