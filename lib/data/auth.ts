import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";

/** Cached per request: SiteHeader, layouts, and pages all call this
 *  independently, and this keeps that down to one query per request. */
export const getCurrentProfile = cache(async (): Promise<Tables<"profiles"> | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw error;
  return data;
});
