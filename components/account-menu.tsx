"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { signOutAction } from "@/lib/actions/auth";

export function AccountMenu({ fullName }: { fullName: string }) {
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant="ghost" size="icon" magnetic={false} aria-label="Meniu cont">
          <UserIcon className="size-4" />
        </Button>
      </DropdownTrigger>
      <DropdownContent>
        <DropdownLabel>{fullName}</DropdownLabel>
        <DropdownItem asChild>
          <Link href="/client/dashboard">
            <LayoutDashboard className="size-4" />
            Dashboard
          </Link>
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem
          destructive
          icon={<LogOut className="size-4" />}
          onSelect={() => {
            // Hard navigation, not router.push: guarantees a fresh
            // request with the now-cleared session cookie, so there's
            // no race with a protected page's own re-render.
            void signOutAction().then(() => {
              window.location.href = "/";
            });
          }}
        >
          Deconectare
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
