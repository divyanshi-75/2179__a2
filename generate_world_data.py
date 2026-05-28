import csv
from collections import defaultdict

COUNTRY_ISO = {
    "Argentina": 32, "Austria": 40, "Belgium": 56, "Bolivia": 68,
    "Brazil": 76, "Bulgaria": 100, "Canada": 124, "Chile": 152,
    "Colombia": 170, "Costa Rica": 188, "Czech Republic": 203,
    "Denmark": 208, "Ecuador": 218, "Egypt": 818, "El Salvador": 222,
    "Estonia": 233, "Finland": 246, "France": 250, "Germany": 276,
    "Greece": 300, "Guatemala": 320, "Honduras": 340, "Hong Kong": 344,
    "Hungary": 348, "Iceland": 352, "India": 356, "Indonesia": 360,
    "Ireland": 372, "Israel": 376, "Italy": 380, "Japan": 392,
    "Latvia": 428, "Lithuania": 440, "Luxembourg": 442, "Malaysia": 458,
    "Mexico": 484, "Netherlands": 528, "New Zealand": 554, "Nicaragua": 558,
    "Norway": 578, "Panama": 591, "Paraguay": 600, "Peru": 604,
    "Philippines": 608, "Poland": 616, "Portugal": 620, "Romania": 642,
    "Singapore": 702, "Slovakia": 703, "South Africa": 710, "Spain": 724,
    "Sweden": 752, "Switzerland": 756, "Taiwan": 158, "Thailand": 764,
    "Turkey": 792, "United Arab Emirates": 784, "United Kingdom": 826,
    "United States": 840, "Uruguay": 858, "Vietnam": 704,
    "Dominican Republic": 214, "Saudi Arabia": 682, "South Korea": 410,
    "Russia": 643, "Ukraine": 804, "Morocco": 504
}

country_streams = defaultdict(float)
country_artists = defaultdict(set)

with open('data/aussie_artists_aggregated_fixed.csv', newline='', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        if row['is_home'] == 'global' and row['region'] not in ('Global', 'Australia'):
            streams = float(row['total_streams'] or 0)
            country_streams[row['region']] += streams
            country_artists[row['region']].add(row['artist'])

missing = [c for c in country_streams if c not in COUNTRY_ISO]
if missing:
    print("No ISO code for:", missing)

with open('data/aussie_world_streams.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=['iso_num', 'country', 'total_streams_M', 'artists_count'])
    w.writeheader()
    for country in sorted(country_streams):
        if country in COUNTRY_ISO:
            w.writerow({
                'iso_num': COUNTRY_ISO[country],
                'country': country,
                'total_streams_M': round(country_streams[country] / 1_000_000, 2),
                'artists_count': len(country_artists[country])
            })

print(f"Wrote {len([c for c in country_streams if c in COUNTRY_ISO])} countries to data/aussie_world_streams.csv")
