import json, re, difflib, csv, sys
csv.field_size_limit(10**9)
PROV = {"Punjab": "04", "Sindh": "05", "KPK": "03", "Balochistan": "02"}
GB_NAME = {"Punjab": "Punjab", "Sindh": "Sindh", "KPK": "Khyber Pakhtunkhwa", "Balochistan": "Balochistan"}
def norm(s):
    s = (s or "").lower()
    s = re.sub(r"\b(city|mandi|cantt|cantonment|tehsil|district)\b", " ", s)
    return re.sub(r"[^a-z0-9]", "", s)
places = []
with open("PK.txt", encoding="utf-8") as f:
    for row in csv.reader(f, delimiter="\t", quoting=csv.QUOTE_NONE):
        if row[6] not in ("P", "A"): continue
        names = {norm(row[1]), norm(row[2])} | {norm(a) for a in row[3].split(",") if a and re.match(r"^[\x00-\x7f]+$", a)}
        names.discard("")
        places.append(dict(name=row[1], lat=float(row[4]), lon=float(row[5]), cls=row[6], code=row[7], a1=row[10], pop=int(row[14] or 0), names=names))
gb = json.load(open("adm1.geojson"))
polys = {f["properties"]["shapeName"]: f["geometry"] for f in gb["features"]}
def inside(lon, lat, geom):
    rings = geom["coordinates"] if geom["type"] == "Polygon" else [r for p in geom["coordinates"] for r in p[:1]]
    def pip(ring):
        c = False; j = len(ring) - 1
        for i in range(len(ring)):
            xi, yi = ring[i][:2]; xj, yj = ring[j][:2]
            if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / (yj - yi + 1e-12) + xi: c = not c
            j = i
        return c
    return any(pip(r) for r in (rings[:1] if geom["type"] == "Polygon" else rings))
def rank(p):
    return (p["code"].startswith("PPLA") or p["code"] == "PPLC", p["cls"] == "P", p["pop"])
# Official GeoNames spellings for stations whose export name differs, and
# district headquarters for stations named after a whole district.
ALIASES = {
    "Haroonabad": ["Harunabad", "Haroonabad"],
    "Chowk Azam": ["Chauk Azam", "Chowk Azam"],
    "Golarchi Taluka": ["Golarchi", "Shaheed Fazil Rahu"],
    "Tando Adam Khan": ["Tando Adam"],
    "Chowk Munda": ["Chowk Munda", "Chauk Munda"],
    "Taunsa sharif": ["Taunsa", "Taunsa Sharif"],
    "Kahror Pacca": ["Kahror Pakka", "Karor Pacca", "Kahror Pacca"],
    "Qaboola": ["Qabula", "Qaboola"],
    "Salehput": ["Salehpat", "Saleh Pat"],
    "Shahdra - Lahore": ["Shahdara", "Shahdra"],
    "Kamoki (Wahndo)": ["Kamoke", "Kamoki"],
    "Kohistan": ["Dasu"],
    "Shaheed Benazirabad (Nawabshah)": ["Nawabshah", "Shaheed Benazirabad"],
    "Bunner": ["Daggar"],
    "Tharparkar": ["Mithi"],
    "Jaffarabad": ["Dera Allah Yar", "Jafarabad"],
}
stations = json.load(open("stations.json"))
out, report = {}, {"exact": 0, "fuzzy": 0, "district": 0, "none": []}
for prov, district, station, n in stations:
    a1 = PROV[prov]; key = norm(station)
    pool = [p for p in places if p["a1"] == a1]
    how = "exact"
    cands = [p for p in pool if key in p["names"] and p["cls"] == "P"]
    if station in ALIASES:
        how = "alias"
        cands = []
        for alt in ALIASES[station]:
            cands = [p for p in pool if norm(alt) in p["names"] and p["cls"] == "P"]
            if cands: break
    if not cands:
        allnames = {}
        for p in pool:
            if p["cls"] != "P": continue
            for nm in p["names"]: allnames.setdefault(nm, []).append(p)
        close = difflib.get_close_matches(key, list(allnames), n=3, cutoff=0.86)
        if close: cands = allnames[close[0]]; how = "fuzzy"
    if not cands:
        dk = norm(district)
        cands = [p for p in pool if dk in p["names"] and p["cls"] == "P"]; how = "district"
    if not cands:
        report["none"].append((prov, district, station, n)); continue
    best = max(cands, key=rank)
    ok = inside(best["lon"], best["lat"], polys[GB_NAME[prov]])
    if not ok:
        inprov = [p for p in cands if inside(p["lon"], p["lat"], polys[GB_NAME[prov]])]
        if inprov: best, ok = max(inprov, key=rank), True
    report[how] = report.get(how, 0) + 1
    if not ok: report.setdefault("outside", []).append((prov, district, station, best["name"]))
    out[key] = {"station": station, "district": district, "province": prov, "lat": round(best["lat"], 4), "lon": round(best["lon"], 4), "match": how, "geoname": best["name"]}
json.dump(out, open("stationCoords.json", "w"), indent=0, ensure_ascii=False)
print({k: (v if isinstance(v, int) else len(v)) for k, v in report.items()})
for k in ("none", "outside"):
    for r in report.get(k, []): print(k.upper(), r)
print("FUZZY/DISTRICT:")
for v in out.values():
    if v["match"] != "exact": print(" ", v["match"], v["province"], v["district"], "|", v["station"], "->", v["geoname"])
