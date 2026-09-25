# Customer Face — file map

The customer app used to be one 30,000-line `CustomerFaceApp.tsx`. It is now split so
each screen lives in its own file, and people working on different screens don't edit
the same file.

`src/CustomerFaceApp.tsx` is now only the **app shell**: navigation stack, bottom-nav
handling, shared app state (profile, subscriptions, picks, location scope, mini-player)
and the `current.id → <Screen />` routing.

## Where things live

| Folder | What's in it |
| --- | --- |
| `screens/` | One file per screen: `HomeScreen`, `SearchScreen`, `ProductSelectScreen`, `ByProductSelectScreen`, `ByProductCombinedScreen`, `RatesResultScreen`, `ProductRatesScreen`, `MandiListScreen`, `MandiDetailScreen`, `ZaraiReelsScreen`, `LiveMarketScreen`, `BillingScreen`, `RepDashboardScreen`, `VoiceScreen` |
| `sheets/` | Bottom sheets & modals: `CompleteProfileModal`, `FeedModal`, `MultiLocSheet`, `LocationScopeSheet`, `LocationSheet`, `MandiPickerSheet`, `PriceTypeSheet`, `HistoricalRequestSheet`, `DatePickerSheet`, `DeepViewLocationSheet` |
| `navigation/` | `BottomNav`, `VoiceQueryOverlay`, `VoiceOrientationOverlay` |
| `components/` | Small UI pieces used by more than one screen (`ProductIcon`, `RateCard`, `ScrollRow`, `CircleTile`, `ZMMessage`, `ByProductNationalCard`, `FloatingMiniPlayer`, SVG icons, …) |
| `shared/types.ts` | Shared types: `Screen` (the route list), `RateItem`, `LocationScope`, `FeedMsg`, `RichRow`, `AppProps`, `ProfileSetupData`, … |
| `shared/i18n/` | `LangProvider` + `useLang()`, `translations.ts` (`TRANS`), `urduDictionary.ts` (`AUTO_URDU_DICT`) |
| `shared/data/` | Static data & lookup helpers: `catalog` (verticals/products), `mandis` (locations & rows), `icons`, `rates`, `byproductStats`, `billing`, `reels` |
| `shared/voice.ts` | `speakText` / `stopSpeaking` text-to-speech |
| `shared/theme.ts` | Global theme CSS injected by `LangProvider` |

Helpers used by only one screen live **inside that screen's file** (for example,
`ProductRatesScreen.tsx` holds `fmt`, `CompRow` and `ProvincePatternSvg`). Anything used
by two or more files lives in `components/` or `shared/`.

## Working together without conflicts

- **Screen work stays in the screen file.** If you're on `HomeScreen`, you should rarely
  need to touch anything outside `screens/HomeScreen.tsx`.
- **Shared files are shared.** `shared/`, `components/` and `CustomerFaceApp.tsx` are
  used by several screens. Keep edits there small, and tell the others when you change
  one. Changing a shared component's props or a shared type affects every screen that
  uses it.
- **Adding a new screen:** create `screens/MyScreen.tsx`, add its route to the `Screen`
  union in `shared/types.ts`, and add one `{current.id === "my-screen" && <MyScreen … />}`
  line in `CustomerFaceApp.tsx`.
- **Adding translations:** add keys to `shared/i18n/translations.ts` or
  `shared/i18n/urduDictionary.ts`. Two people adding different lines here merge cleanly.
  Only edits to the same line conflict.
- Before pushing, run `npx tsc --noEmit` in `zarai-mandi/app`. It catches a missing
  import or a prop mismatch between files immediately.
