// HomeScreen unmounts whenever another screen is pushed (e.g. a card opens its
// rates screen), so the carousel's position lives here for the app session:
// coming back lands on the same product, card and date.

export type HomeSelection = { kind: "favorites" } | { kind: "product"; name: string };

export const selectionKey = (s: HomeSelection) => (s.kind === "favorites" ? "__favorites" : s.name);

export const homeMemory: {
  selection: HomeSelection | null;
  /** Key of the card last in front, per selection key. */
  activeCardByKey: Record<string, string>;
  date: Date | null;
} = {
  selection: null,
  activeCardByKey: {},
  date: null,
};
