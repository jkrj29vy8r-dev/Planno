import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Conectare · Planno" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-[15px] font-semibold tracking-tight">
          Planno
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Bine ai revenit</CardTitle>
            <CardDescription>Conectează-te pentru a-ți gestiona rezervările.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Suspense>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
