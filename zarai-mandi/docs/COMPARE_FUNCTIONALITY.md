# Compare functionality and decisions

## Purpose

“Compare the same byproduct across locations, or compare products in the same locations, using averages from the reports received.”

The five-screen visual language is retained. Selection and refinement lead into one continuous report: overview, byproduct aggregates, summary. No charts are added. Selection remains fast with Compare now and saved comparisons; custom geographic selections take more taps.

## Comparison orientation

| Request | What appears together |
| --- | --- |
| One product, two or more explicitly selected areas | Locations in adjacent columns; a section per byproduct/channel/grade/specification/unit |
| One product, All Pakistan | Provinces in adjacent columns |
| One product, one province or district | Its mandis in adjacent columns |
| One product, one mandi | One location column |
| Multiple products | Products side by side in the overview; location columns within each detailed aggregate section |
| Three or more locations/products | Horizontal scrolling inside the table; metric/location label remains fixed |

Two location columns fit a small phone. Many columns cannot all remain readable at once on a mobile display; horizontal scrolling is deliberate. Vertical scrolling moves between comparable specifications rather than hiding Sindh under Punjab in the single-product case.

## Exact arithmetic and population

For each displayed metric:

**Mean = sum of valid values from distinct compatible observations / count of those valid values.**

Every source observation has equal weight. We never average already-rounded mandi averages. Example: one mandi reports 0 and 0; another reports 90. The province mean is 30, not 45. This implements a mean across all received records, not equal weighting of mandis or weighting by traded volume.

- Group separately by product, byproduct, price channel, grade, unit and categorical quality specifications. No automatic unit conversion.
- Select a single calendar day in Pakistan time. The latest available matching day is the default; changing the date updates every aggregate.
- Average minimum and average maximum prices separately. These are not the absolute lowest/highest reported values, a midpoint, or an executable market quote.
- Calculate using integer decimal arithmetic. Round once to two decimals, half away from zero. Supply prices as decimal strings to preserve precision from the source; a JavaScript number may already have lost precision before it reaches the module.
- Missing, invalid and negative price/arrival fields are excluded from that metric's denominator. A true zero remains valid. Inverted individual price ranges exclude both price endpoints.
- Each mean shows its denominator; coverage shows reporting versus selected mandis, and timestamps show the observation interval.
- Deduplicate identical rows with the same stable ID. Conflicting versions under one ID are excluded and disclosed. The adapter must choose authoritative revisions before handing data to the component.
- Shared arrival observations can be identified by `arrivalObservationId`. Identical repetitions are counted once within an aggregate; conflicting values under that ID are excluded. Without that ID, each row is assumed to be an independent arrival observation.
- Arrivals are labelled **mean MT per report**, never total daily arrivals. No arrivals are summed across channels.
- Mean change is the average of supplied percentage changes with the same period and basis. It is not the percentage change of the aggregate price.
- Export CSV contains aggregate values and their denominators, plus exact numerator/denominator for price means. It does not dump every source record on the summary.

## Heading navigator

The persistent handle reads **1 / N headings** and **Hold & slide to jump**. The report explains the gesture once at its top.

Hold for 350 ms to reveal the heading list, slide to highlight, release to jump. Release outside the panel to cancel. Moving near the list edges scrolls long lists. The list names product, byproduct, channel, grade, unit and specification, so similarly named sections remain distinguishable. N counts rendered sections, including overview and summary, not raw rows.

A tap opens the same list for ordinary selection. Keyboard buttons and Escape work; reduced-motion preferences are respected. These alternatives are essential because a hold-only control is difficult to discover and unsuitable for some assistive technologies.

## Ambiguities and remaining decisions

| Potential pitfall | Current handling and decision still needed |
| --- | --- |
| Busy reporters dominate a provincial mean | Equal observation weight matches “all records.” Confirm whether the business instead wants equal mandi weight, one latest report per reporter, or trade-volume weighting. These answer different questions. |
| A selected province is automatically expanded | One province compares its mandis. If users need an explicit province-level single-column result, add a clear “Compare provinces / mandis” control rather than silently mixing meanings. |
| Same price is reported by several sources | Identical IDs deduplicate; different IDs cannot be inferred to be the same observation. The backend needs stable report identity, reporter identity and revision policy. |
| Shared arrivals repeated for channels/grades | Supply a source arrival identity and define whether it represents a lot, mandi-day, reporter snapshot or transaction. The current mean is not a market total. |
| Different units, specifications or grades | Keep separate. The master catalogue should declare which attributes are categorical versus continuous; the current numeric-quality detection is a demo heuristic and numeric variety codes must be normalised as categorical values upstream. |
| Missing price endpoints | Min and max can have different denominators. As a result their separate means are not necessarily a valid interval; decide whether production price comparisons should require complete min/max pairs. The detailed table always labels them separately. |
| Coverage and freshness differ | One PKT date avoids mixing days, but intraday timestamps still vary. Define market cutoff, freshness threshold and minimum reporting coverage. No low-coverage “winner” should be implied. |
| Province and one of its mandis selected together | Each column is correct independently; a visible overlap notice warns they are not independent populations. Summary counts unique source rows, not column totals. |
| “Which is better?” depends on the user | Lower price can benefit a buyer and disadvantage a seller. Transport, quality and availability also matter. No automatic best/worst recommendation is made. |
| Very large reports | Navigation jumps to aggregate headings, not records. Client-side computation is suitable for this demo; production-scale feeds need indexed/server aggregation returning exact sums and counts plus a consistent snapshot, and measured rendering performance. |
| Saved reports versus saved filters | Save retains filters on the device and reopens the latest available matching day. It does not freeze historical data or save a shareable report snapshot. Make this distinction explicit if historical reports are required. |
| Mobile gesture behaviour | Chromium mouse and touch-emulation tests cover hold/slide/release and cancellation. Physical iOS/Android devices, screen readers, safe areas and one-handed reach still need device acceptance testing. |

## Data source (live)

`app/src/components/compare/CompareScreen.tsx` feeds the module from the market API (`api/src/compare.js`):

- `GET /api/compare/catalog` — divisions (products) with their by-products that have data this period, each by-product's observed attributes, all mandis (province / district / station) and the data date range.
- `GET /api/compare/records?ids=…` — every valid price observation for the given by-product IDs (max 80), column-oriented. Loaded per selected product and cached for the session.

Mapping: division → product; by-product → byproduct; station → mandi; `"Mandi Rate"` → price type `Mandi` (rows without a price type are skipped); origin / variety / color / new-old / specification / quality / moisture → quality attributes (so different varieties stay in separate columns); arrivals kg → MT. Prices are shown per 40 kg, matching the rest of the app. **Change** is each report's max price against the same series' (by-product, mandi, channel, quality) mean max on its previous report day.

## Report layout (mobile)

The report is a comparison matrix (`app/src/components/ui/compare-matrix.tsx`): columns are byproduct variants coloured by product, sections are price types, rows are avg min, avg max, arrivals, mandis reporting and change. On a phone two columns are shown side by side, chosen as A and B; wider containers show every column. One location is shown at a time (tabs), opening on the location with the most reports. Rows and price types with no reports for the visible columns are hidden. "vs A" is a plain percentage difference, never a recommendation.
