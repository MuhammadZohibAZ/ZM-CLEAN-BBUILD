// Product prices and icons used by the Complete Profile flow.

import { findProduct, getVerticalForProduct, PRODUCT_PRICE_PER_MONTH } from "../../shared/data/catalog";
import { getproductIconSrc } from "../../shared/data/icons";

/** Every product costs the same per month. */
export function getSeasonPackageBasePrice(_product: string): number {
  return PRODUCT_PRICE_PER_MONTH;
}

export function getSeasonPackageIconSrc(product: string): string {
  const name = findProduct(product)?.name || product;
  return getproductIconSrc(name, getVerticalForProduct(name));
}
