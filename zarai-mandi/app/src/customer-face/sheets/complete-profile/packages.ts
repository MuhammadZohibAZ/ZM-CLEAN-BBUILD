// Season package prices and icons used by the Complete Profile flow.

import { SEASON_PACKAGES } from "../../../data/seasonProductData";
import { ICON_PATHS, PRODUCTS_PATH } from "../../shared/data/icons";

export function getSeasonPackageBasePrice(pkgOrProd: string): number {
  const k = (pkgOrProd || "").toLowerCase().trim();
  const pkg = SEASON_PACKAGES.find(
    (p) =>
      p.id === k ||
      p.name.toLowerCase() === k ||
      p.name.toLowerCase().includes(k) ||
      k.includes(p.name.toLowerCase()),
  );
  if (pkg) return pkg.pricePerMonth;
  return 600;
}

export function getSeasonPackageIconSrc(
  pkgOrProd: string,
  _fallbackVertical?: string,
): string {
  const k = (pkgOrProd || "").toLowerCase().trim();
  const pkg = SEASON_PACKAGES.find(
    (p) =>
      p.id === k ||
      p.name.toLowerCase() === k ||
      p.name.toLowerCase().includes(k) ||
      k.includes(p.name.toLowerCase()),
  );
  if (pkg) return pkg.icon;
  return ICON_PATHS.wheat || `${PRODUCTS_PATH}/wheat200.png`;
}
