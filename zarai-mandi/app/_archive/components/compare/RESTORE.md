# Compare (archived for V1)

The Compare tab is not in V1. Its screen is here unchanged (`CompareScreen.tsx`, `ZaraiMandiCompare.tsx`, `compare.css`, `report-pdf.ts`), with the location sheet only it used (`_archive/customer-face/sheets/MultiLocSheet.tsx`).

Still in `src/` (unused, left so restoring is a move back): `fetchCompareCatalog` / `fetchCompareRecords` and their types in `src/lib/api.ts`, the `nav.compare` text in `customer-face/shared/i18n/translations.ts`. The API endpoints (`api/src/compare.js`) are unchanged.

## To restore

1. `git mv _archive/components/compare src/components/compare` and `git mv _archive/customer-face/sheets/MultiLocSheet.tsx src/customer-face/sheets/MultiLocSheet.tsx`.
2. Put back the code below (removed from the app when archiving).

### src/customer-face/navigation/BottomNav.tsx — nav item (put back before the "news" item)

```tsx
      {
        id: "compare",
        label: t("nav.compare"),
        brandColor: "#0B5E4A",
        icon: (isActive) => (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="3"
              y="3"
              width="7"
              height="18"
              rx="2"
              stroke={isActive ? "#ffffff" : "#183B34"}
              strokeWidth="2"
            />
            <rect
              x="14"
              y="3"
              width="7"
              height="18"
              rx="2"
              fill={isActive ? "#ffffff" : "#183B34"}
            />
            <path
              d="M6 8h1M6 13h1"
              stroke={isActive ? "#0B5E4A" : "#ffffff"}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
```

### src/CustomerFaceApp.tsx — lazy import (with the other imports)

```tsx
const CompareScreen = lazy(() => import("./components/compare/CompareScreen"));
```

### src/CustomerFaceApp.tsx — import

```tsx
import { MultiLocSheet } from "./customer-face/sheets/MultiLocSheet";
```

### src/CustomerFaceApp.tsx — import

```tsx
import { getproductIconSrc } from "./customer-face/shared/data/icons";
```

### src/CustomerFaceApp.tsx — screen (put back before the "news" screen)

```tsx
        {current.id === "compare" && (
          <Suspense fallback={<div className="flex-1" style={{ background: "#F1F7F4" }} />}>
            <CompareScreen
              productIcon={(division) => getproductIconSrc(division)}
              // Free trial: every product can be compared; afterwards only paid ones.
              ownedProducts={profileCompleted ? userSubscribedList : undefined}
              renderLocationPicker={(picker) => (
                <MultiLocSheet
                  multiProvince
                  selected={picker.selected}
                  dataMandiNames={picker.dataNames}
                  onApply={picker.onApply}
                  onClose={picker.onClose}
                />
              )}
            />
          </Suspense>
        )}
```

### src/CustomerFaceApp.tsx — tab switch (restore this line)

```tsx
      if (tab === "home" || tab === "compare" || tab === "news") {
```

### src/CustomerFaceApp.tsx — spoken tab name

```tsx
      else if (tab === "compare") speech = lang === "ur" ? "موازنہ" : "Compare";
```

### src/CustomerFaceApp.tsx — active tab (restore this line)

```tsx
    (["compare", "news"] as NavTab[]).includes(activeNav) &&
```

### src/customer-face/shared/types.ts — Screen union

```tsx
  | { id: "compare" }
```

### src/customer-face/shared/types.ts — NavTab (restore this line)

```tsx
export type NavTab = "home" | "compare" | "news" | "voice";
```
