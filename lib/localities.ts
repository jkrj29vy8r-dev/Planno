import rawLocalities from "@/lib/data/ro-localities.json";

export interface RoLocality {
  name: string;
  county: string;
}

/** [name, county] tuples, pre-sorted by population descending so that,
 *  for equally-ranked substring matches, the more likely city (e.g.
 *  "Cluj-Napoca" over some minor commune) surfaces first. Kept as a
 *  tuple array on disk (not {name, county} objects) since the key
 *  names would otherwise repeat across all ~4,500 entries. */
const LOCALITIES: RoLocality[] = (rawLocalities as [string, string][]).map(([name, county]) => ({
  name,
  county,
}));

/** Same diacritic-folding approach as slugify() in lib/actions/merchant.ts:
 *  NFD decomposition splits ă/â/î/ș/ț (and legacy ş/ţ cedilla forms) into a
 *  base letter plus a combining mark, so stripping \p{Mn} leaves plain
 *  ASCII -- lets "Targu Mures" match "Târgu Mureș" without a hand-written
 *  replacement map. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .toLowerCase();
}

const NORMALIZED_NAMES: string[] = LOCALITIES.map((l) => normalize(l.name));

/** Alphabetical (Romanian collation), not population -- browsing by
 *  județ is a lookup, not a relevance-ranked search, so it needs the
 *  A-Z order any printed county list would use, not "biggest first". */
const COUNTIES: string[] = Array.from(new Set(LOCALITIES.map((l) => l.county))).sort((a, b) =>
  a.localeCompare(b, "ro"),
);

export function getCounties(): string[] {
  return COUNTIES;
}

/** Still population-sorted (inherited from LOCALITIES' own order), so
 *  within a county the reședință/bigger towns lead too. */
export function getLocalitiesInCounty(county: string): RoLocality[] {
  return LOCALITIES.filter((l) => l.county === county);
}

/** Ranks a name that starts with the query above one that merely
 *  contains it, so typing "cluj" leads with "Cluj-Napoca" rather than
 *  some unrelated locality with "cluj" in the middle of its name. */
export function searchLocalities(query: string, limit = 8): RoLocality[] {
  const term = normalize(query.trim());
  if (!term) return [];

  const startsWith: RoLocality[] = [];
  const contains: RoLocality[] = [];

  for (let i = 0; i < LOCALITIES.length; i += 1) {
    const name = NORMALIZED_NAMES[i];
    if (name.startsWith(term)) {
      startsWith.push(LOCALITIES[i]);
    } else if (name.includes(term)) {
      contains.push(LOCALITIES[i]);
    }
    if (startsWith.length >= limit) break;
  }

  return startsWith.concat(contains).slice(0, limit);
}
