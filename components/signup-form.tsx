"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Planni } from "@/components/planni";
import { signUpAction, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = {};

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);

  if (state.message) {
    return (
      <div className="flex flex-col items-center gap-2 py-2 text-center">
        <Planni state="success" size={120} message={state.message} />
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        label="Nume complet"
        name="fullName"
        autoComplete="name"
        placeholder="Ana Popescu"
        leftIcon={<User className="size-4" />}
        required
      />
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="tu@exemplu.ro"
        leftIcon={<Mail className="size-4" />}
        required
      />
      <Input
        label="Parolă"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="Minimum 8 caractere"
        leftIcon={<Lock className="size-4" />}
        required
      />

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="mt-1 w-full" isLoading={isPending}>
        Creează cont
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Ai deja cont?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Conectează-te
        </Link>
      </p>
    </form>
  );
}
