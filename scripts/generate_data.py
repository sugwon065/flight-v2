"""Generate static date-range flight-deal JSON for the SkyFinder v2 dashboard.

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
    public/data/pricing-model.json
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


TRAVEL_DATE_RANGE = json.loads(
    (Path(__file__).resolve().parents[1] / "src" / "services" / "travelDateRange.json").read_text(encoding="utf-8")
)
DATA_START = date.fromisoformat(TRAVEL_DATE_RANGE["startDate"])
DATA_END = date.fromisoformat(TRAVEL_DATE_RANGE["endDate"])
MAX_TRIP_DAYS = 15
GENERATOR_VERSION = 4
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "public" / "data"
PRICING_RESEARCH = json.loads(
    Path(__file__).with_name("pricing_research.json").read_text(encoding="utf-8")
)
PRICING_ASSUMPTIONS = PRICING_RESEARCH["model"]


DESTINATIONS = {
    "tokyo-narita": {"name": "도쿄(나리타)", "airportCode": "NRT", "lccFixedCost": 57_500, "fscFixedCost": 82_500},
    "tokyo-haneda": {"name": "도쿄(하네다)", "airportCode": "HND", "lccFixedCost": 67_500, "fscFixedCost": 97_500},
    "osaka-kansai": {"name": "오사카(간사이)", "airportCode": "KIX", "lccFixedCost": 45_000, "fscFixedCost": 70_000},
    "fukuoka": {"name": "후쿠오카", "airportCode": "FUK", "lccFixedCost": 40_000, "fscFixedCost": 65_000},
    "sapporo": {"name": "삿포로", "airportCode": "CTS", "lccFixedCost": 80_000, "fscFixedCost": 112_500},
    "nagoya": {"name": "나고야", "airportCode": "NGO", "lccFixedCost": 55_000, "fscFixedCost": 80_000},
    "okinawa": {"name": "오키나와", "airportCode": "OKA", "lccFixedCost": 70_000, "fscFixedCost": 100_000},
    "kagoshima": {"name": "가고시마", "airportCode": "KOJ", "lccFixedCost": 57_500, "fscFixedCost": 85_000},
    "niigata": {"name": "니가타", "airportCode": "KIJ", "lccFixedCost": 67_500, "fscFixedCost": 97_500},
    "aomori": {"name": "아오모리", "airportCode": "AOJ", "lccFixedCost": 75_000, "fscFixedCost": 107_500},
    "sendai": {"name": "센다이", "airportCode": "SDJ", "lccFixedCost": 60_000, "fscFixedCost": 90_000},
    "miyazaki": {"name": "미야자키", "airportCode": "KMI", "lccFixedCost": 60_000, "fscFixedCost": 87_500},
    "komatsu": {"name": "고마쓰", "airportCode": "KMQ", "lccFixedCost": 60_000, "fscFixedCost": 87_500},
    "okayama": {"name": "오카야마", "airportCode": "OKJ", "lccFixedCost": 57_500, "fscFixedCost": 85_000},
    "kumamoto": {"name": "구마모토", "airportCode": "KMJ", "lccFixedCost": 55_000, "fscFixedCost": 85_000},
    "matsuyama": {"name": "마쓰야마", "airportCode": "MYJ", "lccFixedCost": 47_500, "fscFixedCost": 75_000},
    "shizuoka": {"name": "시즈오카", "airportCode": "FSZ", "lccFixedCost": 52_500, "fscFixedCost": 80_000},
    "hiroshima": {"name": "히로시마", "airportCode": "HIJ", "lccFixedCost": 50_000, "fscFixedCost": 75_000},
    "oita": {"name": "오이타", "airportCode": "OIT", "lccFixedCost": 47_500, "fscFixedCost": 75_000},
    "hakodate": {"name": "하코다테", "airportCode": "HKD", "lccFixedCost": 77_500, "fscFixedCost": 110_000},
    "kobe": {"name": "고베", "airportCode": "UKB", "lccFixedCost": 47_500, "fscFixedCost": 72_500},
    "kitakyushu": {"name": "기타큐슈", "airportCode": "KKJ", "lccFixedCost": 42_500, "fscFixedCost": 67_500},
    "takamatsu": {"name": "다카마쓰", "airportCode": "TAK", "lccFixedCost": 45_000, "fscFixedCost": 70_000},
    "saga": {"name": "사가", "airportCode": "HSG", "lccFixedCost": 42_500, "fscFixedCost": 67_500},
    "yonago": {"name": "요나고", "airportCode": "YGJ", "lccFixedCost": 45_000, "fscFixedCost": 70_000},
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


# These weekday coefficients are explicit model assumptions, not fitted
# Korean-Japan statistics. Mean normalization keeps route baselines neutral.
WEEKDAY_PATTERNS = {
    direction: tuple(value / statistics.mean(values) for value in values)
    for direction, values in PRICING_ASSUMPTIONS["weekdayPatterns"].items()
}
QUALITY_TRIP_DAYS = (3, 6, 10)
MAX_PROMOTION_ATTEMPTS = 12


def stable_seed(*parts: object) -> int:
    raw = "|".join(map(str, parts)).encode("utf-8")
    return int.from_bytes(hashlib.sha256(raw).digest()[:8], "big")


def iter_dates(start: date, end: date):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


def iter_month_starts(start: date, end: date):
    current = start.replace(day=1)
    while current <= end:
        yield current
        current += timedelta(days=calendar.monthrange(current.year, current.month)[1])


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


def build_pricing_profiles(destination_carriers: dict[str, list[str]]) -> dict:
    snapshots = {row["destinationId"]: row for row in PRICING_RESEARCH["routeSnapshots"]}
    fsc_snapshots = {row["destinationId"]: row for row in PRICING_RESEARCH["fscSnapshots"]}
    profiles = {}
    for destination_id, airline_ids in destination_carriers.items():
        snapshot = snapshots[destination_id]
        types = sorted({AIRLINES[airline_id]["type"] for airline_id in airline_ids})
        anchors = {}
        baselines = {}
        source_urls = {}
        anchor_methods = {}
        for airline_type in types:
            anchor = snapshot["publishedLowestRoundTrip"]
            source_urls[airline_type] = snapshot["sourceUrl"]
            anchor_methods[airline_type] = "route_minimum_proxy"
            if airline_type == "FSC" and destination_id in fsc_snapshots:
                fsc_snapshot = fsc_snapshots[destination_id]
                anchor = fsc_snapshot["publishedLowestRoundTrip"]
                source_urls[airline_type] = fsc_snapshot["sourceUrl"]
                anchor_methods[airline_type] = "korean_air_public_monthly_minimum"
            elif airline_type == "FSC" and "LCC" in types:
                anchor *= PRICING_ASSUMPTIONS["fscFallbackPremium"]
                anchor_methods[airline_type] = "route_minimum_with_estimated_fsc_premium"
            anchors[airline_type] = int(round(anchor / 100) * 100)
            baselines[airline_type] = int(round(
                anchor * PRICING_ASSUMPTIONS["neutralFareUplift"] / 100
            ) * 100)
        profiles[destination_id] = {
            "baselineRoundTrip": baselines,
            "referenceRoundTrip": anchors,
            "anchorMethod": anchor_methods,
            "sourceUrls": source_urls,
            "kind": "synthetic_calibrated",
        }
    return profiles


PRICING_PROFILES = build_pricing_profiles(carriers_by_destination())


def generate_promotions(
    destination_carriers: dict[str, list[str]], attempt: int = 0,
) -> list[dict]:
    """Short route-wide sale days, spaced across month boundaries as well."""
    promotions = []
    last_day = DATA_END
    for destination_id, airline_ids in destination_carriers.items():
        rng = random.Random(stable_seed("sale-days-v2", destination_id, DATA_START, DATA_END, attempt))
        center = DATA_START + timedelta(days=rng.randint(0, 5))
        while center <= last_day:
            # Carriers share the route's sale dates so many adjacent carrier
            # sales cannot turn back into one long low-price plateau.
            for airline_id in airline_ids:
                for direction in WEEKDAY_PATTERNS:
                    depth_rng = random.Random(stable_seed(
                        "sale-depth-v2", destination_id, airline_id, direction, center,
                    ))
                    promotions.append({
                        "destinationId": destination_id,
                        "airlineId": airline_id,
                        "direction": direction,
                        "date": center,
                        "multiplier": round(depth_rng.uniform(0.78, 0.82), 4),
                    })
            center += timedelta(days=rng.randint(7, 10))
    return promotions


def generate_daily_prices(
    destination_carriers: dict[str, list[str]], promotions: list[dict],
) -> dict[tuple[str, str, str, date], int]:
    promotion_index = {
        (p["destinationId"], p["airlineId"], p["direction"], p["date"]): p["multiplier"]
        for p in promotions
    }
    prices = {}
    first_day = DATA_START
    last_day = DATA_END
    for destination_id, airline_ids in destination_carriers.items():
        destination = DESTINATIONS[destination_id]
        for airline_id in airline_ids:
            airline = AIRLINES[airline_id]
            fixed_cost = destination[
                "lccFixedCost" if airline["type"] == "LCC" else "fscFixedCost"
            ]
            neutral_one_way = PRICING_PROFILES[destination_id]["baselineRoundTrip"][airline["type"]] / 2
            variable_base = neutral_one_way - fixed_cost
            weekday_strength = PRICING_ASSUMPTIONS["weekdayStrengthByType"][airline["type"]]
            for direction, weekday_pattern in WEEKDAY_PATTERNS.items():
                rng = random.Random(stable_seed("daily-prices-v2", destination_id, airline_id, direction))
                smooth_noise = 1.0
                for day in iter_dates(first_day, last_day):
                    smooth_noise = min(1.03, max(0.97,
                        0.65 * smooth_noise + 0.35 * rng.normalvariate(1.0, 0.025)))
                    variable_price = (
                        variable_base
                        * airline["priceMultiplier"]
                        * GLOBAL_MONTH_MULTIPLIER[day.month]
                        * REGIONAL_MONTH_ADJUSTMENT.get(destination_id, {}).get(day.month, 1.0)
                        * (1 + (weekday_pattern[day.weekday()] - 1) * weekday_strength)
                        * holiday_multiplier(day)
                        * promotion_index.get((destination_id, airline_id, direction, day), 1.0)
                        * smooth_noise
                    )
                    # Fixed costs are additive; no hard clipping of multiple
                    # fares to one floor. Fare precision is 100 KRW.
                    prices[(destination_id, airline_id, direction, day)] = int(
                        round((fixed_cost + variable_price) / 100) * 100
                    )
    return prices


def cheapest_offer(
    destination_id: str,
    airline_ids: list[str],
    airline_type: str,
    departure_date: date,
    return_date: date,
    daily_prices: dict[tuple[str, str, str, date], int],
) -> dict | None:
    choices = []
    for airline_id in airline_ids:
        airline = AIRLINES[airline_id]
        if airline["type"] != airline_type:
            continue
        outbound_price = daily_prices[(destination_id, airline_id, "outbound", departure_date)]
        return_price = daily_prices[(destination_id, airline_id, "return", return_date)]
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


def assess_distribution(destination_id: str, airline_ids: list[str], daily_prices: dict) -> dict:
    """Audit real price-sorted results, without adding a search spacing rule."""
    checked = 0
    crowded = 0
    first_day = DATA_START
    last_day = DATA_END
    for trip_days in QUALITY_TRIP_DAYS:
        by_type = {key: [] for key in ("ALL", "LCC", "FSC")}
        for departure in iter_dates(first_day, last_day):
            returning = departure + timedelta(days=trip_days - 1)
            if returning > last_day:
                continue
            offers = []
            for airline_type in ("LCC", "FSC"):
                offer = cheapest_offer(destination_id, airline_ids, airline_type, departure, returning, daily_prices)
                if offer:
                    price = offer["roundTripPrice"]
                    by_type[airline_type].append((price, departure, returning))
                    offers.append(price)
            if offers:
                by_type["ALL"].append((min(offers), departure, returning))
        for start in iter_month_starts(first_day, last_day):
            for window_days in (30, 60):
                end = min(start + timedelta(days=window_days - 1), last_day)
                for rows in by_type.values():
                    top = sorted(row for row in rows if start <= row[1] and row[2] <= end)[:5]
                    if len(top) < 5:
                        continue
                    checked += 1
                    dates = sorted(row[1] for row in top)
                    if any((dates[i + 2] - dates[i]).days <= 2 for i in range(3)):
                        crowded += 1
    return {"checkedWindows": checked, "crowdedWindows": crowded}


def generate_distributed_prices(destination_carriers: dict[str, list[str]]) -> tuple[dict, dict]:
    prices = {}
    region_audits = []
    for destination_id, airline_ids in destination_carriers.items():
        best = None
        best_prices = None
        best_attempt = 0
        for attempt in range(MAX_PROMOTION_ATTEMPTS):
            route = {destination_id: airline_ids}
            candidate_prices = generate_daily_prices(route, generate_promotions(route, attempt))
            audit = assess_distribution(destination_id, airline_ids, candidate_prices)
            if best is None or audit["crowdedWindows"] < best["crowdedWindows"]:
                best, best_prices, best_attempt = audit, candidate_prices, attempt
            if audit["crowdedWindows"] == 0:
                break
        prices.update(best_prices)
        region_audits.append({"destinationId": destination_id, "attempt": best_attempt + 1, **best})
    checked = sum(a["checkedWindows"] for a in region_audits)
    crowded = sum(a["crowdedWindows"] for a in region_audits)
    return prices, {
        "tripDays": list(QUALITY_TRIP_DAYS),
        "windowDays": [30, 60],
        "windowStart": "first day of each month",
        "airlineTypes": ["ALL", "LCC", "FSC"],
        "crowdingRule": "3 or more of top 5 departures within 3 calendar days",
        "checkedWindows": checked,
        "crowdedWindows": crowded,
        "crowdedPercent": round(100 * crowded / checked, 2) if checked else 0,
        "maxAttempts": MAX_PROMOTION_ATTEMPTS,
        "regions": region_audits,
    }


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
                "priceModel": PRICING_PROFILES[destination_id],
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
    daily_prices: dict[tuple[str, str, str, date], int],
) -> tuple[list[dict], dict]:
    manifest_files = []
    total_records = 0
    price_values = {"LCC": [], "FSC": []}

    for trip_days in range(1, MAX_TRIP_DAYS + 1):
        records_by_month = defaultdict(list)
        for departure_date in iter_dates(DATA_START, DATA_END):
            return_date = departure_date + timedelta(days=trip_days - 1)
            if return_date > DATA_END:
                continue
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
                    "year": int(month_key[:4]),
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


def remove_stale_offer_files(manifest_files: list[dict]) -> None:
    expected = {item["path"] for item in manifest_files}
    output_root = OUTPUT_DIR.resolve()
    pattern = "[0-9][0-9]/[0-9][0-9][0-9][0-9]-[0-9][0-9].json"
    for stale_file in (OUTPUT_DIR / "offers").glob(pattern):
        if stale_file.relative_to(OUTPUT_DIR).as_posix() in expected:
            continue
        if not 1 <= int(stale_file.parent.name) <= MAX_TRIP_DAYS:
            continue
        if not stale_file.resolve().is_relative_to(output_root):
            raise ValueError("Refusing to remove an offer file outside the data directory")
        stale_file.unlink()


def main() -> None:
    destination_carriers = carriers_by_destination()
    daily_prices, distribution = generate_distributed_prices(destination_carriers)

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

    write_json(
        OUTPUT_DIR / "pricing-model.json",
        {
            "version": GENERATOR_VERSION,
            "kind": "synthetic_calibrated",
            "researchedAt": PRICING_RESEARCH["researchedAt"],
            "origin": PRICING_RESEARCH["origin"],
            "currency": PRICING_RESEARCH["currency"],
            "profiles": PRICING_PROFILES,
            "research": PRICING_RESEARCH,
        },
    )

    manifest_files, summary = generate_offer_files(destination_carriers, daily_prices)
    write_json(
        OUTPUT_DIR / "manifest.json",
        {
            "version": GENERATOR_VERSION,
            "years": list(range(DATA_START.year, DATA_END.year + 1)),
            "dateRange": TRAVEL_DATE_RANGE,
            "maxTripDays": MAX_TRIP_DAYS,
            "destinationCount": len(DESTINATIONS),
            "airlineCount": len(AIRLINES),
            "fileCount": len(manifest_files),
            "pricingModel": {
                "kind": "synthetic_calibrated",
                "researchedAt": PRICING_RESEARCH["researchedAt"],
                "path": "pricing-model.json",
                "routeSnapshotCount": len(PRICING_RESEARCH["routeSnapshots"]),
                "dailyQuoteCount": len(PRICING_RESEARCH["dailyQuoteSnapshots"]),
                "weekdayFactors": "estimated_not_fitted",
            },
            "summary": summary,
            "distribution": distribution,
            "files": manifest_files,
        },
    )

    remove_stale_offer_files(manifest_files)
    print(f"Date range: {DATA_START} ~ {DATA_END}")
    print(f"Generated {len(manifest_files)} offer files in {OUTPUT_DIR}")
    print(f"Destinations: {len(DESTINATIONS)}, airlines: {len(AIRLINES)}")
    print(f"Offer records: {summary['recordCount']:,}")
    print(f"Crowded search windows: {distribution['crowdedWindows']}/{distribution['checkedWindows']} ({distribution['crowdedPercent']}%)")
    for airline_type, prices in summary["roundTripPrices"].items():
        print(
            f"{airline_type}: min {prices['minimum']:,}, "
            f"median {prices['median']:,}, max {prices['maximum']:,} KRW"
        )


if __name__ == "__main__":
    main()
