// Monthly price per product for the Billing screen: one price for every product.

import { PRODUCT_PRICE_PER_MONTH } from "../../shared/data/catalog";

export function getproductBasePrice(_product: string): number {
  return PRODUCT_PRICE_PER_MONTH;
}
