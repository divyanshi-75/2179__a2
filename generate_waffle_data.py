import csv, json
from collections import defaultdict

TOP_6 = ["The Kid LAROI", "5 Seconds of Summer", "Sia", "Vance Joy", "Troye Sivan", "Kylie Minogue"]
YEARS = ["2017", "2018", "2019", "2020", "2021"]

streams = defaultdict(lambda: defaultdict(float))
with open("data/aussie_artists_aggregated_fixed.csv", newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        if row["is_home"] == "global" and row["artist"] in TOP_6:
            yr = str(int(float(row["year"])))
            streams[row["artist"]][yr] += float(row["total_streams"] or 0)

def waffle_cells(totals, year_label):
    """Largest-remainder proportional allocation of 100 cells."""
    artists = {a: v for a, v in totals.items() if v > 0}
    if not artists:
        return []
    total = sum(artists.values())
    exact = {a: s / total * 100 for a, s in artists.items()}
    floors = {a: int(p) for a, p in exact.items()}
    remainders = sorted(exact.items(), key=lambda x: -(x[1] - int(x[1])))
    spare = 100 - sum(floors.values())
    for i in range(spare):
        floors[remainders[i][0]] += 1

    cells = []
    for artist in TOP_6:
        count = floors.get(artist, 0)
        pct = round(exact.get(artist, 0), 1)
        for _ in range(count):
            idx = len(cells)
            cells.append({
                "year":    year_label,
                "cell":    idx,
                "x":       idx % 10,
                "y":       idx // 10,
                "artist":  artist,
                "pct":     pct
            })
    return cells

rows = []
for yr in YEARS:
    yr_totals = {a: streams[a][yr] for a in TOP_6}
    rows.extend(waffle_cells(yr_totals, yr))

all_totals = {a: sum(streams[a][yr] for yr in YEARS) for a in TOP_6}
rows.extend(waffle_cells(all_totals, "ALL"))

with open("data/chart2_waffle_data.json", "w", encoding="utf-8") as f:
    json.dump(rows, f, separators=(",", ":"))

print(f"Generated {len(rows)} rows")
for label in YEARS + ["ALL"]:
    n = sum(1 for r in rows if r["year"] == label)
    print(f"  {label}: {n} cells")
