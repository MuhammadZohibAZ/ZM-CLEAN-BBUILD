# Map geography

Data behind the MapLibre mandi map (`src/components/MandiMapGL.tsx`).

| File | What | Source |
| --- | --- | --- |
| `pakistanProvinces.json` | Pakistan's 7 first-level units (Punjab, Sindh, KPK, Balochistan, Gilgit-Baltistan, Azad Kashmir, Islamabad), simplified, coordinates rounded to 4 decimals. `dbName` is the spelling the market database uses (`KPK`). | [geoBoundaries](https://www.geoboundaries.org) gbOpen PAK ADM1 — public domain |
| `pakistanOutline.json` | Pakistan's national outline (mainland incl. Gilgit-Baltistan and Azad Kashmir), Douglas–Peucker simplified to ~500 m — the hole in the map's outside-Pakistan mask and the national border line. | geoBoundaries gbOpen PAK ADM0 — public domain |
| `stationCoords.json` | Coordinates for every station in the market database (176), keyed by the normalised station name (lower-case, letters/digits only, without "mandi"). | [GeoNames](https://www.geonames.org) `PK.txt` — CC BY 4.0 (attribution shown on the map) |

## Regenerating `stationCoords.json`

When the database gains new stations:

1. Export stations: `select province, district, station, count(*) from price_records group by 1,2,3` → `stations.json` (array of rows).
2. Download `https://download.geonames.org/export/dump/PK.zip` (unzip `PK.txt`) and the geoBoundaries ADM1 file (`adm1.geojson`).
3. `python3 build_station_coords.py` — matches each station inside its own province by exact name, then the `ALIASES` table (official GeoNames spellings, district headquarters for district-named stations), then close spelling; every match is checked against its province boundary. It prints anything it could not place.
4. Reduce the output to `{lat, lon, station, district, province}` per key (see this folder's existing file).

A station with no entry gets no pin; the map lists it as "location unknown".
