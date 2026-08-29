import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Never cached: this must report the state of the live deployment at the
// moment it is called, not a build-time snapshot.
export const dynamic = "force-dynamic";

function describe(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack?.split("\n").slice(0, 6) };
  }
  return { value: String(error) };
}

/**
 * Diagnostic endpoint: reproduces the reads the home page performs, but
 * reports failures as JSON instead of throwing into the error boundary.
 * Next.js redacts server error messages in production, so a rendered
 * page can never show why it failed -- this can.
 */
export async function GET() {
  const report: Record<string, unknown> = {
    env: {
      hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      // Prefix only -- enough to spot a wrong/truncated project URL
      // without echoing full credentials into a public response.
      urlPrefix: (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").slice(0, 34),
      anonKeyLength: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").length,
    },
    nodeVersion: process.version,
  };

  try {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase.auth.getUser();
      report.authGetUser = error
        ? { failed: true, message: error.message, status: error.status }
        : { failed: false, user: data.user ? "present" : "anonymous" };
    } catch (error) {
      report.authGetUser = { threw: true, ...describe(error) };
    }

    try {
      const { data, error } = await supabase
        .from("merchants")
        .select("*, services(id, name, price, currency, duration_minutes)")
        .eq("is_active", true)
        .order("business_name");

      report.merchantsQuery = error
        ? { failed: true, message: error.message, code: error.code, details: error.details, hint: error.hint }
        : {
            failed: false,
            count: data?.length ?? 0,
            sample: data?.[0]
              ? {
                  business_name: data[0].business_name,
                  category: data[0].category,
                  serviceCount: data[0].services?.length ?? 0,
                  firstServicePrice: data[0].services?.[0]?.price ?? null,
                  firstServicePriceType: typeof data[0].services?.[0]?.price,
                  currency: data[0].services?.[0]?.currency ?? null,
                }
              : null,
          };
    } catch (error) {
      report.merchantsQuery = { threw: true, ...describe(error) };
    }

    try {
      const { error } = await supabase.from("merchants").select("category, city").eq("is_active", true);
      report.filterOptionsQuery = error ? { failed: true, message: error.message, code: error.code } : { failed: false };
    } catch (error) {
      report.filterOptionsQuery = { threw: true, ...describe(error) };
    }
  } catch (error) {
    report.createClient = { threw: true, ...describe(error) };
  }

  // Intl is the other thing that can throw during render (an invalid
  // currency or timezone raises RangeError), so exercise it here too.
  try {
    report.intl = {
      price: new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" }).format(120),
      time: new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit" }).format(
        new Date(),
      ),
    };
  } catch (error) {
    report.intl = { threw: true, ...describe(error) };
  }

  return NextResponse.json(report, { status: 200 });
}
