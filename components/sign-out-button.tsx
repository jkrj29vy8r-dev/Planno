"use client";

import { LogOut } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";

/** A client component, not a plain <form action={signOutAction}>: this
 *  page is itself under middleware's PROTECTED_PREFIXES, so a
 *  server-side redirect from inside the action races this page's own
 *  "no profile -> /login" guard once the session is cleared. The hard
 *  navigation below always wins instead. */
export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => {
        void signOutAction().then(() => {
          window.location.href = "/";
        });
      }}
      className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
    >
      <LogOut className="size-4" aria-hidden="true" />
      Deconectare
    </button>
  );
}
