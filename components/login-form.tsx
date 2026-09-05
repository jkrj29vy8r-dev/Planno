"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInAction, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = {};

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/client/dashboard";
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="redirect" value={redirectTo} />

      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="tu@exemplu.ro"
        leftIcon={<Mail className="size-4" />}
      />
      <Input
        label="Parolă"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        leftIcon={<Lock className="size-4" />}
      />

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="mt-1 w-full" isLoading={isPending}>
        Conectare
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Nu ai cont încă?{" "}
        <Link href="/signup" className="font-medium text-accent hover:underline">
          Creează unul
        </Link>
      </p>
    </form>
  );
}
