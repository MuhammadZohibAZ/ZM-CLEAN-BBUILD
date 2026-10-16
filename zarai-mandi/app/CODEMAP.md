# Zarai Mandi app — code map

Where each part of the app lives. Paths are under `app/src/`.
`customer-face/` is the customer app; the API is in `zarai-mandi/api/`.

## App shell

| Part | File |
|---|---|
| Startup (loads the dataset's date range, then renders) | `main.tsx` |
| Customer / rep switch, testing pill, onboarding entry | `App.tsx` |
| Desktop phone mockup + variant panel | `DevicePreview.tsx`, `lib/device-bridge.ts` |
| Screen stack, navigation, favourites (`togglePickBP`), location scope | `CustomerFaceApp.tsx` |
| Bottom nav (Home · Compare · Reels) | `customer-face/navigation/BottomNav.tsx` |
| Voice overlay | `customer-face/navigation/VoiceQueryOverlay.tsx` |
| API client (all `fetch…` calls) | `lib/api.ts` |
| Language, Urdu text, name/number translation (`t`, `tc`, `tm`, `tr`, `tn`) | `customer-face/shared/i18n/` |

## Onboarding (`onboarding/`)

`OnboardingFlow.tsx` runs the steps: Language → Role → Account, then customers go straight into the app and representatives see "Rep pending".

| Part on screen | File · component |
|---|---|
| 1 · Choose English / Urdu (sets the app language) | `steps/LangScreen.tsx` · `LangScreen` |
| 2 · Customer or representative | `steps/RoleScreen.tsx` · `RoleScreen` |
| 3 · Sign up / sign in (phone, email, Google), OTP, profile | `steps/AccountScreen.tsx` · `AccountScreen` |
| Rep account pending approval | `steps/RepPendingScreen.tsx` · `RepPendingScreen` |
| Shared pieces: progress bar, divider, terms toggle, social icons, phone/email field, OTP boxes, profile fields | `parts.tsx` |
| Screens, cities, languages, professions (+ Urdu names), country codes, phone/email validation | `data.ts` |
| English / Urdu text (`L(en, ur)`), right-to-left + Urdu font | `i18n.ts` · `useObLang`, `OB_URDU_CSS` |
| Onboarding styles | `theme.ts` |
| Livestock icon (also used by `data/seasonProductData.ts`) | `icons/` |

The language is app-wide: `LangProvider` sits in `App.tsx` above onboarding and the customer app, so the language picked on the first screen carries into the app.

## Screen 1 — Home (`customer-face/screens/home/`)

`HomeScreenSwitch.tsx` picks the version (Test button → "Original" / "Alternative").

| Part on screen | File · component |
|---|---|
| Photo header: language, voice, bell, avatar, name + edit, number | `shared/HomeHero.tsx` · `HomeHero` (both Homes) |
| Search bar + "Complete profile" chip | `shared/SearchProfilePanel.tsx` · `SearchProfilePanel` (both Homes) |
| Search modes: `"list"` (Original — suggestions drop down under the bar; a product scrolls the Products row to it, a by-product opens screen 3) · `"inline"` (Alternative — best match shown inside the bar) | `mode` prop of `SearchProfilePanel`, set via `HomeHero`'s `searchMode`; Original's pick handling in `original/HomeScreen.tsx` (`showProduct`) |
| **Original:** screen layout and state | `original/HomeScreen.tsx` · `HomeScreen` |
| **Original:** Products row (active + locked circles, View All) | `original/HomeProductsSection.tsx` · `HomeProductsSection` |
| **Original:** Favourites heading + cards | `original/HomeFavoritesSection.tsx` · `HomeFavoritesSection` |
| **Original:** "All Products" grid (View All) | `original/ProductCategoriesSheet.tsx` · `ProductCategoriesSheet` |
| Favourite cards row (same cards as screen 2, with location tag) | `customer-face/components/FavoriteCardsRow.tsx` · `FavoriteCardsRow` |
| **Alternative:** screen layout, its own profile drawer | `alternative/AlternativeHomeScreen.tsx` |
| **Alternative:** product circles rail | `alternative/ProductRail.tsx` |
| **Alternative:** 3D by-product card carousel + jump dots | `alternative/HomeByproductCarousel.tsx`, `alternative/ByproductJumpIndicator.tsx` |
| Account menu, Edit profile (city + detect location), Contact us | `customer-face/account/AccountCenter.tsx` · `AccountCenter` |
| Complete-profile / subscribe flow | see **Complete Profile** below |

## Screen 2 — By-products (`customer-face/screens/byproducts/`)

| Part on screen | File · component |
|---|---|
| Screen (header, special-attribute chips, card grid) | `ByProductCombinedScreen.tsx` |
| **By-product card** (rates, arrival, attribute, locations, "updated") | `customer-face/components/ByProductNationalCard.tsx` · `ByProductNationalCard` |
| English + Islamic date pill (opens the shared calendar) | `customer-face/components/ByproductDatePill.tsx` |
| Special-attribute chip bar | `customer-face/components/FilterChipBar.tsx` |
| Card data, order (main by-products first), tap → screen 3 | `customer-face/shared/data/byproductCards.ts` |
| Card stats fetch (date, location, attribute filter, card rates) | `customer-face/shared/hooks/useDivisionCardData.ts` |
| **Tester versions** (Test button; delete `testers/` to remove) | `testers/` — `ByProductAttributeFilterScreen`, `ByProductRateTypeFilterScreen`, `ByProductFilterBarScreen` (filter bar), `ByProductSidebarFilterScreen` (filter sidebar, split screen), `ScreenVariantSwitch`, `splitCards` |
| Rate-type + attribute filtering shared by the filter bar and sidebar testers | `testers/rateAttributeCards.tsx` · `useRateAttributeCards` |

## Screen 3 — Rates (`customer-face/screens/product-rates/`)

| Part on screen | File · component |
|---|---|
| Screen (state, tabs, data wiring, empty-day message) | `ProductRatesScreen.tsx` |
| Header: name + by-product dropdown, heart, tabs | `AppBar.tsx` |
| Filter rail (Location · Day · Rate · Attribute) | `FilterRail.tsx` |
| Location picker (search, Province/District/Mandi) | `FilterLocationSheet.tsx` |
| **Calendar** (one month, ‹ ›, single day / date range) — used everywhere | `RangeSheet.tsx` |
| Rate list picker / attribute sheet base | `PickerSheet.tsx`, `ui.tsx` (`BottomSheet`, `Segmented`, `Chip`, `Icon`, …) |
| Price card + sparkline + "no reports" buttons | `PriceHero.tsx` (`PriceHero`, `EmptyActions`) |
| Best places + map card | `BestPlaces.tsx`, `components/ExpandableMandiMapCard.tsx`, `components/MandiMapGL.tsx` |
| Mandi table / cards, full-screen table + calendar button | `MandiSection.tsx` |
| Mandi detail sheet (trend ↔ history, 1D–1Y) | `MandiDetailSheet.tsx` |
| Trends tab (ranges, candles, rate types, movers) | `TrendsTab.tsx`, `TrendChart.tsx`, `CandleChart.tsx`, `IntradayChart.tsx` |
| Data loading / maths | `useMarketData.ts`, `selectors.ts`, `format.ts`, `types.ts`, `theme.ts` |
| Other filter layouts (not shown; `FILTER_UI` in the screen) | `FilterDock.tsx`, `FilterDrawer.tsx` |

## Complete Profile (`customer-face/sheets/complete-profile/`)

Opened from Home's "Complete profile" chip, locked products and the account menu.
`CompleteProfileModal.tsx` is the sheet's layout; every part reads the shared state from `useCompleteProfile`.

| Part on screen | File · component |
|---|---|
| State: step, picked products, plan, payment fields, MPIN, handlers | `useCompleteProfile.tsx` · `useCompleteProfile` |
| Header: back / close, title, 3-step progress | `CompleteProfileHeader.tsx` |
| Step 1 · Interested products / season packages (month switcher) | `ProductsStep.tsx` |
| Step 2 · Plan duration, custom months, price breakdown | `PlanStep.tsx` |
| Step 3 · Mobile wallet / card / direct transfer | `PaymentStep.tsx` |
| Footer: selected count, Back / Next / Confirm payment | `CompleteProfileFooter.tsx` |
| "View all" varieties of a package | `AllVarietiesSheet.tsx` |
| Mobile-wallet MPIN dialog | `MpinDialog.tsx` |
| Season package prices and icons | `packages.ts` |

## Billing (`customer-face/screens/billing/`)

Opened by "Unlock" in My Subscriptions and "Subscribe" on locked data.
`BillingScreen.tsx` is the layout; every part reads the shared state from `useBilling`.

| Part on screen | File · component |
|---|---|
| State: step (plan / pay), duration, payment fields, MPIN, success, handlers | `useBilling.tsx` · `useBilling` |
| Header: back, product, step title, stepper dots | `BillingHeader.tsx` |
| Plan step: duration, custom months, price breakdown | `BillingPlanStep.tsx` |
| Payment step: mobile wallet / card / direct transfer | `BillingPaymentStep.tsx` |
| Footer: Back, Subscribe / Confirm payment | `BillingFooter.tsx` |
| Mobile-wallet MPIN dialog | `BillingMpinDialog.tsx` |
| "You're subscribed" dialog | `SubscribedDialog.tsx` |
| Monthly base price per product | `pricing.ts` |

## Other screens and sheets

| Part | File |
|---|---|
| Compare tab | `components/compare/` (`CompareScreen`, `ZaraiMandiCompare`, PDF in `report-pdf.ts`) |
| Reels tab + mini player | `customer-face/screens/ZaraiReelsScreen.tsx`, `customer-face/components/FloatingMiniPlayer.tsx` |
| Rep dashboard | `customer-face/screens/RepDashboardScreen.tsx` |
| Feed popup, app-wide location sheet | `customer-face/sheets/FeedModal.tsx`, `customer-face/sheets/LocationScopeSheet.tsx` |

## Shared data

`customer-face/shared/data/`: `catalog.ts` (products/verticals), `specialAttributes.json` + `byproductStats.ts` (special attribute per by-product), `datasetDates.ts` (the data's date range), `icons.ts`, `mandis.ts` / `mandiLocation.ts`, `rates.ts`.

## Archived (not built)

`app/_archive/` holds files no longer reachable from the app (old rates screen, old sheets, Search / Mandi list / Live market / Rates result screens, onboarding steps the flow never reached — Dashboard, Interests, Location, Subscription, Payment, Loading — with their data in `_archive/onboarding/unused-data.ts`, …), same folder layout as `src/`. Move a file back into `src/` to use it again.

## Images

Product and by-product icons live in `src/icons/` and are referenced by path (`/src/icons/...`) from `customer-face/shared/data/icons.ts`; Compare loads the same folder with `import.meta.glob`. Onboarding and `data/seasonProductData.ts` import the product icons from `src/icons/products/` too. Before deleting an icon, search the code for its file name.
