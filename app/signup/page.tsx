import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "@/components/signup-form";

export const metadata = { title: "Cont nou · Planno" };

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-[15px] font-semibold tracking-tight">
          Planno
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Creează-ți contul</CardTitle>
            <CardDescription>Rezervă la comercianții tăi preferați în câteva clickuri.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <SignupForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
