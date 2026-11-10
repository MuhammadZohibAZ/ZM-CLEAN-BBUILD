// Product PNG icons (src/icons/<name>.png), used by the Home "Products" circles,
// the All Products sheet and the Complete Profile products list. Products without one here keep their
// usual icon from getproductIconSrc.

import apple from "../../../icons/apple.png";
import apricot from "../../../icons/apricot.png";
import asafoetida from "../../../icons/asafoetida.png";
import banana from "../../../icons/banana.png";
import basilSeed from "../../../icons/basil seed.png";
import bitterGourd from "../../../icons/bitter gourd.png";
import blackSeed from "../../../icons/black seed.png";
import cherry from "../../../icons/cherry.png";
import chiaSeed from "../../../icons/chia seed.png";
import chilli from "../../../icons/chilli.png";
import citrus from "../../../icons/citrus.png";
import dryLemon from "../../../icons/dry lemon.png";
import falsa from "../../../icons/falsa.png";
import ghee from "../../../icons/ghee.png";
import grapes from "../../../icons/grapes.png";
import guar from "../../../icons/guar.png";
import lemon from "../../../icons/lemon.png";
import mango from "../../../icons/mango.png";
import melon from "../../../icons/melon.png";
import papaya from "../../../icons/papaya.png";
import peach from "../../../icons/peach.png";
import plum from "../../../icons/plum.png";
import pomegranate from "../../../icons/pomegranate.png";
import psyllium from "../../../icons/psyllium.png";
import saffron from "../../../icons/saffron.png";
import saladLeaf from "../../../icons/salad leaf.png";
import salep from "../../../icons/salep.png";
import sweetPotato from "../../../icons/sweet potato.png";

/** Keyed by catalog product name (PRODUCT_DIVISIONS). */
const PRODUCT_PNG_ICONS: Record<string, string> = {
  Apple: apple,
  Apricot: apricot,
  Asafoetida: asafoetida,
  Banana: banana,
  "Basil Seed": basilSeed,
  "Bitter Gourd": bitterGourd,
  "Black Seed": blackSeed,
  Cherry: cherry,
  "Chia Seed": chiaSeed,
  Chilli: chilli,
  Citrus: citrus,
  "Dry Lemon": dryLemon,
  Falsa: falsa,
  Ghee: ghee,
  Grapes: grapes,
  Guar: guar,
  Lemon: lemon,
  Mango: mango,
  Melon: melon,
  Papaya: papaya,
  Peach: peach,
  Plum: plum,
  Pomegranate: pomegranate,
  Psyllium: psyllium,
  Saffron: saffron,
  "Salad Leaf": saladLeaf,
  Salep: salep,
  "Sweet Potato": sweetPotato,
};

/** The product's PNG icon, if it has one. */
export function getProductPngIcon(name: string): string | undefined {
  return PRODUCT_PNG_ICONS[name];
}
