"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email sau parolă incorectă." };
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
    options: { data: { full_name: fullName } },
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
    redirect("/client/dashboard");
  }

  return { message: "Cont creat! Verifică-ți email-ul pentru a confirma contul." };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
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
