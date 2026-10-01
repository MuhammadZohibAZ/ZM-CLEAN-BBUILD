import { useEffect, useState } from "react";
import {
  fetchByProducts,
  fetchVerticalCardStats,
  type ByProductCatalogRow,
  type CardStats,
} from "../../../lib/api";
import type { LocationScope } from "../types";

export interface UseDivisionCardDataResult {
  catalogByDivision: Record<string, ByProductCatalogRow[]>;
  cardStatsByDivision: Record<string, CardStats[]>;
  loading: boolean;
  error: boolean;
}

/**
 * Fetches by-product catalog rows and card stats from the market API
 * for each requested division, filtered by date and location scope.
 */
export function useDivisionCardData(
  divisions: string[],
  date?: string,
  scope?: LocationScope,
): UseDivisionCardDataResult {
  const [catalogByDivision, setCatalogByDivision] = useState<Record<string, ByProductCatalogRow[]>>({});
  const [cardStatsByDivision, setCardStatsByDivision] = useState<Record<string, CardStats[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const divisionKey = divisions.filter(Boolean).sort().join(",");
  const scopeKind = scope?.kind;
  const scopeLabel = scope?.label;

  useEffect(() => {
    let cancelled = false;
    const activeDivisions = divisions.filter(Boolean);

    if (activeDivisions.length === 0) {
      setCatalogByDivision({});
      setCardStatsByDivision({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    (async () => {
      try {
        const catMap: Record<string, ByProductCatalogRow[]> = {};
        const statsMap: Record<string, CardStats[]> = {};

        await Promise.all(
          activeDivisions.map(async (div) => {
            const [catalog, stats] = await Promise.all([
              fetchByProducts(div).catch(() => [] as ByProductCatalogRow[]),
              fetchVerticalCardStats(div, {
                date,
                locationKind: scopeKind,
                locationLabel: scopeLabel,
              }).catch(() => [] as CardStats[]),
            ]);
            catMap[div] = catalog;
            statsMap[div] = stats;
          }),
        );

        if (!cancelled) {
          setCatalogByDivision(catMap);
          setCardStatsByDivision(statsMap);
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [divisionKey, date, scopeKind, scopeLabel]);

  return {
    catalogByDivision,
    cardStatsByDivision,
    loading,
    error,
  };
}
