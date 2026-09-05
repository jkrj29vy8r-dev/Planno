/**
 * Kept out of components/merchant-search.tsx (a "use client" module):
 * MerchantCard and the merchant detail page are Server Components that
 * call categoryLabel() during render, and a function imported across
 * the client boundary can't be invoked on the server.
 */
const CATEGORY_LABELS: Record<string, string> = {
  salon: "Saloane",
  beauty: "Make-up, manichiură & micropigmentare",
  barbershop: "Frizerii",
  spa: "Spa",
  fitness: "Fitness",
  wellness: "Wellness",
  padel: "Padel",
  auto: "Auto",
  transport: "Transport",
  altele: "Altele",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

/** Every category with a real label -- the source for the business
 *  category picker, so a new listing can never end up in a category
 *  that then displays as a raw, unlabeled key everywhere else. */
export function categoryOptions(): { value: string; label: string }[] {
  return Object.entries(CATEGORY_LABELS)
    .filter(([value]) => value !== "altele")
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "ro"))
    .concat({ value: "altele", label: CATEGORY_LABELS.altele });
}
