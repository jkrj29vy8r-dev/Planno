import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";

export type MerchantListItem = Tables<"merchants"> & {
  services: Pick<Tables<"services">, "id" | "name" | "price" | "currency" | "duration_minutes">[];
};

export type MerchantDetail = Tables<"merchants"> & {
  services: Tables<"services">[];
};

export interface MerchantSearchFilters {
  query?: string;
  category?: string;
  city?: string;
}

/** Strips characters that are significant in a PostgREST filter
 *  expression (`,` `(` `)`) and the ilike wildcard (`%`) so a search
 *  term can't break out of, or alter, the `.or()` filter it's
 *  interpolated into below. */
function sanitizeSearchTerm(term: string): string {
  return term.replace(/[%,()]/g, "").trim();
}

export async function searchMerchants(filters: MerchantSearchFilters = {}): Promise<MerchantListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("merchants")
    .select("*, services(id, name, price, currency, duration_minutes)")
    .eq("is_active", true)
    .order("business_name");

  const term = filters.query ? sanitizeSearchTerm(filters.query) : "";
  if (term) {
    query = query.or(`business_name.ilike.%${term}%,description.ilike.%${term}%,city.ilike.%${term}%`);
  }
  if (filters.category) {
    query = query.eq("category", filters.category);
  }
  if (filters.city) {
    query = query.eq("city", filters.city);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export interface MerchantFilterOptions {
  categories: string[];
  cities: string[];
}

export async function getMerchantFilterOptions(): Promise<MerchantFilterOptions> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("merchants").select("category, city").eq("is_active", true);
  if (error) throw error;

  const categories = Array.from(new Set((data ?? []).map((m) => m.category))).sort();
  const cities = Array.from(
    new Set((data ?? []).map((m) => m.city).filter((c): c is string => Boolean(c))),
  ).sort();

  return { categories, cities };
}

export async function getMerchantBySlug(slug: string): Promise<MerchantDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("merchants")
    .select("*, services(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}
