/**
 * Kept out of components/merchant-search.tsx (a "use client" module):
 * MerchantCard and the merchant detail page are Server Components that
 * call categoryLabel() during render, and a function imported across
 * the client boundary can't be invoked on the server.
 */
const CATEGORY_LABELS: Record<string, string> = {
  salon: "Saloane",
  barbershop: "Frizerii",
  spa: "Spa",
  fitness: "Fitness",
  wellness: "Wellness",
  altele: "Altele",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}
