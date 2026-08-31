"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Building2, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Planni } from "@/components/planni";
import { cn } from "@/lib/utils";
import { signUpAction, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = {};

const ROLE_OPTIONS = [
  { value: "client", label: "Client", description: "Caut și rezerv servicii", icon: User },
  { value: "merchant", label: "Comerciant", description: "Îmi listez afacerea", icon: Building2 },
] as const;

export function SignupForm({ initialRole = "client" }: { initialRole?: "client" | "merchant" }) {
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);
  const [role, setRole] = React.useState<"client" | "merchant">(initialRole);

  if (state.message) {
    return (
      <div className="flex flex-col items-center gap-2 py-2 text-center">
        <Planni state="success" size={120} message={state.message} />
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="role" value={role} />

      <div role="radiogroup" aria-label="Tip de cont" className="grid grid-cols-2 gap-3">
        {ROLE_OPTIONS.map((option) => {
          const isSelected = role === option.value;
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setRole(option.value)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition-all",
                isSelected ? "border-accent bg-card shadow-lg shadow-accent/10" : "border-border/40 bg-card/50 hover:border-border",
              )}
            >
              <Icon className={cn("size-4", isSelected ? "text-accent" : "text-muted-foreground")} aria-hidden="true" />
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </button>
          );
        })}
      </div>

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
