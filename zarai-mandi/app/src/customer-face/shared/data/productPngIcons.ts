// Product PNG icons, used by the Home "Products" circles, the All Products
// sheet and the Complete Profile products list.
//
// Every product's icon is src/icons/<product name, lower case>.png, e.g.
// "src/icons/mango.png", "src/icons/kidney beans.png", "src/icons/urea.png".
// Adding a file with that name is all it takes: it is picked up at build time.
// A product without one keeps its usual icon from getproductIconSrc.

const FILES = import.meta.glob("../../../icons/*.png", { eager: true, import: "default" }) as Record<string, string>;

/** Icon files by name ("mango"), without folder or extension. */
const BY_FILE_NAME = new Map(
  Object.entries(FILES).map(([path, url]) => [path.split("/").pop()!.replace(/\.png$/i, "").toLowerCase(), url]),
);

/** Products whose icon file has another name. */
const FILE_FOR_PRODUCT: Record<string, string> = {
  "Indian Sherbet Berry": "falsa",
  "Dried Apricot": "dried apricot-photoroom",
  Coconut: "coconut-photoroom",
};

/** The icon file name a product's PNG should have (without ".png"). */
export function productIconFileName(name: string): string {
  return (FILE_FOR_PRODUCT[name] || name).toLowerCase();
}

/** The product's PNG icon, if it has one. */
export function getProductPngIcon(name: string): string | undefined {
  return BY_FILE_NAME.get(productIconFileName(name));
}
