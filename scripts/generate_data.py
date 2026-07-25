"""Generate static 2026 flight-deal JSON for the SkyFinder v2 dashboard.

The generator preserves the 25 destinations, 10 airlines, and route map from
the original project. It creates daily synthetic fares, precomputes round-trip
offers for trips lasting 1-15 days, and writes month-sized JSON files that a
Vercel-hosted frontend can fetch directly.

Run:
    python scripts/generate_data.py

Output:
    public/data/airlines.json
    public/data/destinations.json
    public/data/manifest.json
    public/data/offers/{tripDays}/{departureMonth}.json
"""

from __future__ import annotations

import calendar
import hashlib
import json
import random
import statistics
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path


YEAR = 2026
MAX_TRIP_DAYS = 15
GENERATOR_VERSION = 1
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "public" / "data"


DESTINATIONS = {
    "tokyo-narita": {"name": "도쿄(나리타)", "airportCode": "NRT", "basePrice": 170_000, "lccFloor": 230_000, "fscFloor": 330_000},
    "tokyo-haneda": {"name": "도쿄(하네다)", "airportCode": "HND", "basePrice": 260_000, "lccFloor": 270_000, "fscFloor": 390_000},
    "osaka-kansai": {"name": "오사카(간사이)", "airportCode": "KIX", "basePrice": 130_000, "lccFloor": 180_000, "fscFloor": 280_000},
    "fukuoka": {"name": "후쿠오카", "airportCode": "FUK", "basePrice": 120_000, "lccFloor": 160_000, "fscFloor": 260_000},
    "sapporo": {"name": "삿포로", "airportCode": "CTS", "basePrice": 220_000, "lccFloor": 320_000, "fscFloor": 450_000},
    "nagoya": {"name": "나고야", "airportCode": "NGO", "basePrice": 165_000, "lccFloor": 220_000, "fscFloor": 320_000},
    "okinawa": {"name": "오키나와", "airportCode": "OKA", "basePrice": 155_000, "lccFloor": 280_000, "fscFloor": 400_000},
    "kagoshima": {"name": "가고시마", "airportCode": "KOJ", "basePrice": 190_000, "lccFloor": 230_000, "fscFloor": 340_000},
    "niigata": {"name": "니가타", "airportCode": "KIJ", "basePrice": 210_000, "lccFloor": 270_000, "fscFloor": 390_000},
    "aomori": {"name": "아오모리", "airportCode": "AOJ", "basePrice": 210_000, "lccFloor": 300_000, "fscFloor": 430_000},
    "sendai": {"name": "센다이", "airportCode": "SDJ", "basePrice": 200_000, "lccFloor": 240_000, "fscFloor": 360_000},
    "miyazaki": {"name": "미야자키", "airportCode": "KMI", "basePrice": 200_000, "lccFloor": 240_000, "fscFloor": 350_000},
    "komatsu": {"name": "고마쓰", "airportCode": "KMQ", "basePrice": 200_000, "lccFloor": 240_000, "fscFloor": 350_000},
    "okayama": {"name": "오카야마", "airportCode": "OKJ", "basePrice": 190_000, "lccFloor": 230_000, "fscFloor": 340_000},
    "kumamoto": {"name": "구마모토", "airportCode": "KMJ", "basePrice": 185_000, "lccFloor": 220_000, "fscFloor": 340_000},
    "matsuyama": {"name": "마쓰야마", "airportCode": "MYJ", "basePrice": 115_000, "lccFloor": 190_000, "fscFloor": 300_000},
    "shizuoka": {"name": "시즈오카", "airportCode": "FSZ", "basePrice": 160_000, "lccFloor": 210_000, "fscFloor": 320_000},
    "hiroshima": {"name": "히로시마", "airportCode": "HIJ", "basePrice": 125_000, "lccFloor": 200_000, "fscFloor": 300_000},
    "oita": {"name": "오이타", "airportCode": "OIT", "basePrice": 115_000, "lccFloor": 190_000, "fscFloor": 300_000},
    "hakodate": {"name": "하코다테", "airportCode": "HKD", "basePrice": 180_000, "lccFloor": 310_000, "fscFloor": 440_000},
    "kobe": {"name": "고베", "airportCode": "UKB", "basePrice": 150_000, "lccFloor": 190_000, "fscFloor": 290_000},
    "kitakyushu": {"name": "기타큐슈", "airportCode": "KKJ", "basePrice": 120_000, "lccFloor": 170_000, "fscFloor": 270_000},
    "takamatsu": {"name": "다카마쓰", "airportCode": "TAK", "basePrice": 115_000, "lccFloor": 180_000, "fscFloor": 280_000},
    "saga": {"name": "사가", "airportCode": "HSG", "basePrice": 110_000, "lccFloor": 170_000, "fscFloor": 270_000},
    "yonago": {"name": "요나고", "airportCode": "YGJ", "basePrice": 110_000, "lccFloor": 180_000, "fscFloor": 280_000},
}


AIRLINES = {
    "korean-air": {"name": "대한항공", "type": "FSC", "country": "KR", "priceMultiplier": 1.02},
    "asiana": {"name": "아시아나항공", "type": "FSC", "country": "KR", "priceMultiplier": 0.99},
    "jeju-air": {"name": "제주항공", "type": "LCC", "country": "KR", "priceMultiplier": 1.00},
    "jin-air": {"name": "진에어", "type": "LCC", "country": "KR", "priceMultiplier": 1.03},
    "tway": {"name": "티웨이항공", "type": "LCC", "country": "KR", "priceMultiplier": 0.98},
    "air-busan": {"name": "에어부산", "type": "LCC", "country": "KR", "priceMultiplier": 1.01},
    "air-seoul": {"name": "에어서울", "type": "LCC", "country": "KR", "priceMultiplier": 0.97},
    "jal": {"name": "JAL", "type": "FSC", "country": "JP", "priceMultiplier": 1.08},
    "ana": {"name": "ANA", "type": "FSC", "country": "JP", "priceMultiplier": 1.06},
    "peach": {"name": "피치항공", "type": "LCC", "country": "JP", "priceMultiplier": 1.05},
}


ROUTES = {
    "korean-air": ["tokyo-narita", "osaka-kansai", "fukuoka", "sapporo", "nagoya", "okinawa", "kagoshima", "niigata", "aomori", "komatsu", "okayama"],
    "asiana": ["tokyo-narita", "osaka-kansai", "fukuoka", "sapporo", "nagoya", "okinawa", "sendai", "miyazaki", "kumamoto"],
    "jeju-air": ["tokyo-narita", "osaka-kansai", "fukuoka", "sapporo", "nagoya", "okinawa", "matsuyama", "shizuoka", "hiroshima", "oita", "hakodate", "kobe"],
    "jin-air": ["tokyo-narita", "osaka-kansai", "fukuoka", "sapporo", "nagoya", "okinawa", "kitakyushu", "takamatsu"],
    "tway": ["tokyo-narita", "osaka-kansai", "fukuoka", "sapporo", "nagoya", "okinawa", "kumamoto", "saga", "oita"],
    "air-busan": ["tokyo-narita", "osaka-kansai", "fukuoka", "sapporo"],
    "air-seoul": ["tokyo-narita", "osaka-kansai", "fukuoka", "takamatsu", "yonago"],
    "jal": ["tokyo-narita"],
    "ana": ["tokyo-narita"],
    "peach": ["tokyo-narita", "tokyo-haneda", "osaka-kansai", "okinawa"],
}


GLOBAL_MONTH_MULTIPLIER = {
    1: 1.08,
    2: 1.02,
    3: 1.10,
    4: 1.15,
    5: 1.08,
    6: 0.90,
    7: 1.18,
    8: 1.34,
    9: 0.92,
    10: 1.04,
    11: 1.08,
    12: 1.18,
}


REGIONAL_MONTH_ADJUSTMENT = {
    "sapporo": {1: 1.28, 2: 1.35, 3: 1.08, 6: 0.92, 7: 0.96, 8: 0.94},
    "hakodate": {1: 1.22, 2: 1.28, 6: 0.93, 7: 0.97, 8: 0.95},
    "aomori": {1: 1.10, 2: 1.12, 4: 1.20, 6: 0.94},
    "sendai": {1: 0.94, 2: 0.90, 4: 1.14, 6: 0.95},
    "niigata": {1: 1.08, 2: 1.10, 6: 0.94},
    "okinawa": {1: 0.82, 2: 0.86, 6: 0.92, 7: 1.12, 8: 1.18, 9: 0.88},
    "kagoshima": {1: 0.93, 2: 0.92, 6: 0.95, 9: 0.93},
    "miyazaki": {1: 0.92, 2: 0.91, 6: 0.95, 9: 0.94},
    "kumamoto": {1: 0.93, 2: 0.90, 6: 0.95, 9: 0.94},
    "fukuoka": {1: 0.96, 2: 0.92, 6: 0.96},
    "kitakyushu": {1: 0.95, 2: 0.91, 6: 0.96},
    "saga": {1: 0.94, 2: 0.90, 6: 0.96},
}


AIRLINE_TYPE_MULTIPLIER = {"LCC": 1.00, "FSC": 1.34}
WEEKDAY_PATTERN = (0.92, 0.95, 0.99, 1.03, 1.10, 1.07, 0.96)


def stable_seed(*parts: object) -> int:
    raw = "|".join(map(str, parts)).encode("utf-8")
    return int.from_bytes(hashlib.sha256(raw).digest()[:8], "big")


def iter_dates(start: date, end: date):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


def holiday_multiplier(day: date) -> float:
    if day.month == 1 and day.day <= 5:
        return 1.32
    if (day.month == 4 and day.day >= 29) or (day.month == 5 and day.day <= 6):
        return 1.24
    if (day.month == 7 and day.day >= 20) or (day.month == 8 and day.day <= 15):
        return 1.20
    if day.month == 12 and day.day >= 24:
        return 1.28
    return 1.0


def carriers_by_destination() -> dict[str, list[str]]:
    result = {destination_id: [] for destination_id in DESTINATIONS}
    for airline_id, destinations in ROUTES.items():
        for destination_id in destinations:
            result[destination_id].append(airline_id)
    return result


def generate_promotions(destination_carriers: dict[str, list[str]]) -> list[dict]:
    promotions = []
    for destination_id, airline_ids in destination_carriers.items():
        for month in range(1, 13):
            rng = random.Random(stable_seed("promotion", destination_id, YEAR, month))
            last_day = calendar.monthrange(YEAR, month)[1]
            duration = rng.randint(9, 13)
            start_day = rng.randint(4, last_day - duration)
            airline_id = rng.choice(airline_ids)
            airline_type = AIRLINES[airline_id]["type"]
            multiplier = rng.uniform(0.72, 0.87) if airline_type == "FSC" else rng.uniform(0.76, 0.90)
            start = date(YEAR, month, start_day)
            promotions.append(
                {
                    "destinationId": destination_id,
                    "airlineId": airline_id,
                    "start": start,
                    "end": start + timedelta(days=duration - 1),
                    "multiplier": round(multiplier, 3),
                }
            )
    return promotions


def generate_daily_prices(
    destination_carriers: dict[str, list[str]],
    promotions: list[dict],
) -> dict[tuple[str, str, date], int]:
    promotion_index = defaultdict(list)
    for promotion in promotions:
        key = (promotion["destinationId"], promotion["airlineId"])
        promotion_index[key].append(promotion)

    first_day = date(YEAR, 1, 1)
    # Extra days are needed to price a Dec 31 departure for a 15-day trip.
    last_price_day = date(YEAR + 1, 1, MAX_TRIP_DAYS - 1)
    prices = {}

    for destination_id, airline_ids in destination_carriers.items():
        destination = DESTINATIONS[destination_id]
        weekday_offset = stable_seed("weekday", destination_id) % 7

        for airline_id in airline_ids:
            airline = AIRLINES[airline_id]
            rng = random.Random(stable_seed("daily-prices", destination_id, airline_id))
            smooth_noise = 1.0

            for departure_date in iter_dates(first_day, last_price_day):
                shock = rng.normalvariate(1.0, 0.045)
                smooth_noise = min(1.08, max(0.92, 0.78 * smooth_noise + 0.22 * shock))
                weekday_slot = (departure_date.weekday() - weekday_offset) % 7
                month_multiplier = GLOBAL_MONTH_MULTIPLIER[departure_date.month]
                regional_multiplier = REGIONAL_MONTH_ADJUSTMENT.get(destination_id, {}).get(
                    departure_date.month, 1.0
                )
                promotion_multiplier = 1.0

                if departure_date.year == YEAR:
                    for promotion in promotion_index[(destination_id, airline_id)]:
                        if promotion["start"] <= departure_date <= promotion["end"]:
                            promotion_multiplier = promotion["multiplier"]
                            break

                calculated_price = (
                    destination["basePrice"]
                    * AIRLINE_TYPE_MULTIPLIER[airline["type"]]
                    * airline["priceMultiplier"]
                    * month_multiplier
                    * regional_multiplier
                    * WEEKDAY_PATTERN[weekday_slot]
                    * holiday_multiplier(departure_date)
                    * promotion_multiplier
                    * smooth_noise
                )
                round_trip_floor = destination[
                    "lccFloor" if airline["type"] == "LCC" else "fscFloor"
                ]
                one_way_price = max(calculated_price, round_trip_floor / 2)
                prices[(destination_id, airline_id, departure_date)] = int(
                    round(one_way_price / 1000) * 1000
                )
    return prices


def cheapest_offer(
    destination_id: str,
    airline_ids: list[str],
    airline_type: str,
    departure_date: date,
    return_date: date,
    daily_prices: dict[tuple[str, str, date], int],
) -> dict | None:
    choices = []
    for airline_id in airline_ids:
        airline = AIRLINES[airline_id]
        if airline["type"] != airline_type:
            continue
        outbound_price = daily_prices[(destination_id, airline_id, departure_date)]
        return_price = daily_prices[(destination_id, airline_id, return_date)]
        choices.append(
            {
                "airlineId": airline_id,
                "airlineName": airline["name"],
                "outboundPrice": outbound_price,
                "returnPrice": return_price,
                "roundTripPrice": outbound_price + return_price,
            }
        )
    return min(choices, key=lambda item: item["roundTripPrice"]) if choices else None


def add_deal_metrics(records: list[dict]) -> None:
    prices_by_destination_and_type = defaultdict(list)
    for record in records:
        for offer_key in ("lcc", "fsc"):
            offer = record[offer_key]
            if offer:
                prices_by_destination_and_type[(record["destinationId"], offer_key)].append(
                    offer["roundTripPrice"]
                )

    medians = {
        key: int(statistics.median(prices))
        for key, prices in prices_by_destination_and_type.items()
    }
    for record in records:
        for offer_key in ("lcc", "fsc"):
            offer = record[offer_key]
            if not offer:
                continue
            usual_price = medians[(record["destinationId"], offer_key)]
            offer["usualPrice"] = usual_price
            offer["discountPercent"] = round(
                (1 - offer["roundTripPrice"] / usual_price) * 100,
                1,
            )


def build_destination_metadata(destination_carriers: dict[str, list[str]]) -> list[dict]:
    metadata = []
    for destination_id, destination in DESTINATIONS.items():
        airline_ids = destination_carriers[destination_id]
        metadata.append(
            {
                "id": destination_id,
                "name": destination["name"],
                "airportCode": destination["airportCode"],
                "airlineIds": airline_ids,
                "availableTypes": sorted({AIRLINES[airline_id]["type"] for airline_id in airline_ids}),
            }
        )
    return metadata


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def generate_offer_files(
    destination_carriers: dict[str, list[str]],
    daily_prices: dict[tuple[str, str, date], int],
) -> tuple[list[dict], dict]:
    manifest_files = []
    total_records = 0
    price_values = {"LCC": [], "FSC": []}

    for trip_days in range(1, MAX_TRIP_DAYS + 1):
        records_by_month = defaultdict(list)
        for departure_date in iter_dates(date(YEAR, 1, 1), date(YEAR, 12, 31)):
            return_date = departure_date + timedelta(days=trip_days - 1)
            month_key = departure_date.strftime("%Y-%m")

            for destination_id, airline_ids in destination_carriers.items():
                lcc_offer = cheapest_offer(
                    destination_id,
                    airline_ids,
                    "LCC",
                    departure_date,
                    return_date,
                    daily_prices,
                )
                fsc_offer = cheapest_offer(
                    destination_id,
                    airline_ids,
                    "FSC",
                    departure_date,
                    return_date,
                    daily_prices,
                )
                record = {
                    "destinationId": destination_id,
                    "departureDate": departure_date.isoformat(),
                    "returnDate": return_date.isoformat(),
                    "lcc": lcc_offer,
                    "fsc": fsc_offer,
                }
                records_by_month[month_key].append(record)

        for month_key in sorted(records_by_month):
            records = records_by_month[month_key]
            add_deal_metrics(records)
            relative_path = f"offers/{trip_days:02d}/{month_key}.json"
            write_json(
                OUTPUT_DIR / relative_path,
                {
                    "version": GENERATOR_VERSION,
                    "year": YEAR,
                    "tripDays": trip_days,
                    "departureMonth": month_key,
                    "offers": records,
                },
            )
            for record in records:
                if record["lcc"]:
                    price_values["LCC"].append(record["lcc"]["roundTripPrice"])
                if record["fsc"]:
                    price_values["FSC"].append(record["fsc"]["roundTripPrice"])
            total_records += len(records)
            manifest_files.append(
                {
                    "tripDays": trip_days,
                    "month": month_key,
                    "path": relative_path,
                    "count": len(records),
                }
            )

    summary = {
        "recordCount": total_records,
        "roundTripPrices": {
            airline_type: {
                "minimum": min(values),
                "median": int(statistics.median(values)),
                "maximum": max(values),
            }
            for airline_type, values in price_values.items()
        },
    }
    return manifest_files, summary


def main() -> None:
    destination_carriers = carriers_by_destination()
    promotions = generate_promotions(destination_carriers)
    daily_prices = generate_daily_prices(destination_carriers, promotions)

    write_json(
        OUTPUT_DIR / "airlines.json",
        {
            "version": GENERATOR_VERSION,
            "airlines": [
                {"id": airline_id, **{key: value for key, value in airline.items() if key != "priceMultiplier"}}
                for airline_id, airline in AIRLINES.items()
            ],
        },
    )
    write_json(
        OUTPUT_DIR / "destinations.json",
        {
            "version": GENERATOR_VERSION,
            "destinations": build_destination_metadata(destination_carriers),
        },
    )

    manifest_files, summary = generate_offer_files(destination_carriers, daily_prices)
    write_json(
        OUTPUT_DIR / "manifest.json",
        {
            "version": GENERATOR_VERSION,
            "year": YEAR,
            "maxTripDays": MAX_TRIP_DAYS,
            "destinationCount": len(DESTINATIONS),
            "airlineCount": len(AIRLINES),
            "fileCount": len(manifest_files),
            "summary": summary,
            "files": manifest_files,
        },
    )

    print(f"Generated {len(manifest_files)} offer files in {OUTPUT_DIR}")
    print(f"Destinations: {len(DESTINATIONS)}, airlines: {len(AIRLINES)}")
    print(f"Offer records: {summary['recordCount']:,}")
    for airline_type, prices in summary["roundTripPrices"].items():
        print(
            f"{airline_type}: min {prices['minimum']:,}, "
            f"median {prices['median']:,}, max {prices['maximum']:,} KRW"
        )


if __name__ == "__main__":
    main()
