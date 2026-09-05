"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export interface AuthActionState {
  error?: string;
  message?: string;
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/client/dashboard");

  if (!email || !password) {
    return { error: "Completează email-ul și parola." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email sau parolă incorectă." };
  }

  // A deactivated account (see deactivateAccountAction below) still has
  // a working password until SUPABASE_SERVICE_ROLE_KEY is configured
  // for the admin-ban call to actually take effect -- this is what
  // blocks re-entry at the app level in the meantime.
  const { data: profile } = await supabase
    .from("profiles")
    .select("deactivated_at")
    .eq("id", data.user.id)
    .single();

  if (profile?.deactivated_at) {
    await supabase.auth.signOut();
    return { error: "Acest cont a fost dezactivat." };
  }

  redirect(redirectTo);
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  // Whitelisted here too, not just in the handle_new_user trigger: an
  // unrecognized value should read as a form bug, not silently become
  // whatever the trigger's own else-branch defaults to.
  const roleInput = String(formData.get("role") ?? "client");
  const role = roleInput === "merchant" ? "merchant" : "client";

  if (!fullName || !email || !password) {
    return { error: "Completează toate câmpurile." };
  }
  if (password.length < 8) {
    return { error: "Parola trebuie să aibă cel puțin 8 caractere." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role } },
  });

  if (error) {
    return {
      error:
        error.code === "user_already_exists"
          ? "Există deja un cont cu acest email."
          : "Nu am putut crea contul. Încearcă din nou.",
    };
  }

  // Depending on the project's email-confirmation setting, signUp may
  // or may not return an active session immediately.
  if (data.session) {
    redirect(role === "merchant" ? "/merchant/dashboard" : "/client/dashboard");
  }

  return { message: "Cont creat! Verifică-ți email-ul pentru a confirma contul." };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * "Delete my account", implemented as a soft lock rather than an actual
 * row delete: profiles.id cascades into merchants/bookings/reviews, so
 * a real delete would also wipe out other people's data (a merchant's
 * clients lose their booking history; a client's merchant loses the
 * record of a real past visit). Instead this deactivates the owned
 * business (if any), flags the profile, and signs out -- the row and
 * everything referencing it stays intact.
 *
 * Re-authentication is blocked by signInAction's own deactivated_at
 * check. The admin.updateUserById ban below is a stronger, auth-layer
 * version of the same thing, but only actually runs once
 * SUPABASE_SERVICE_ROLE_KEY is configured (createServiceRoleClient
 * returns null until then) -- harmless to skip since the check above
 * already covers it.
 */
export async function deactivateAccountAction(): Promise<AuthActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Trebuie să fii autentificat." };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role === "merchant") {
    await supabase.from("merchants").update({ is_active: false }).eq("owner_id", user.id);
  }

  const { error } = await supabase
    .from("profiles")
    .update({ deactivated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return { error: "Nu am putut dezactiva contul. Încearcă din nou." };
  }

  const adminClient = createServiceRoleClient();
  if (adminClient) {
    await adminClient.auth.admin.updateUserById(user.id, { ban_duration: "876000h" });
  }

  await supabase.auth.signOut();
  return { message: "Contul tău a fost dezactivat." };
}

export interface UpdateContactInfoState {
  error?: string;
  success?: boolean;
}

/** Confirms/updates the caller's own name and phone -- phone in
 *  particular is never collected at sign-up, so this is the first
 *  point most clients ever set it, typically surfaced right before
 *  confirming a booking (the merchant dashboard already reads and
 *  displays profiles.phone in several places; this is what fills it). */
export async function updateContactInfoAction(input: {
  fullName: string;
  phone: string;
}): Promise<UpdateContactInfoState> {
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();

  if (!fullName || !phone) {
    return { error: "Completează numele și numărul de telefon." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Trebuie să fii autentificat." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone })
    .eq("id", user.id);

  if (error) {
    return { error: "Nu am putut salva datele de contact. Încearcă din nou." };
  }

  return { success: true };
}
