import Link from "next/link";
import { getAllMerchantsForAdmin } from "@/lib/data/admin";
import { categoryLabel } from "@/lib/categories";
import { formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Comercianți · Admin · Planno" };

export default async function AdminMerchantsPage() {
  const merchants = await getAllMerchantsForAdmin();

  return (
    <div className="space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Comercianți</h1>
        <p className="text-sm text-muted-foreground">
          {merchants.length} {merchants.length === 1 ? "afacere înregistrată" : "afaceri înregistrate"} pe Planno.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/40 bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border/40 text-left text-xs text-muted-foreground">
              <th className="px-5 py-3 font-medium">Afacere</th>
              <th className="px-5 py-3 font-medium">Categorie</th>
              <th className="px-5 py-3 font-medium">Oraș</th>
              <th className="px-5 py-3 font-medium">Rating</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Înscris</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {merchants.map((merchant) => (
              <tr key={merchant.id}>
                <td className="px-5 py-3 font-medium text-foreground">
                  <Link href={`/merchants/${merchant.slug}`} className="hover:text-accent hover:underline">
                    {merchant.businessName}
                  </Link>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{categoryLabel(merchant.category)}</td>
                <td className="px-5 py-3 text-muted-foreground">{merchant.city ?? "—"}</td>
                <td className="px-5 py-3 text-muted-foreground">
                  {merchant.rating !== null ? `${merchant.rating.toFixed(1)} (${merchant.ratingCount})` : "—"}
                </td>
                <td className="px-5 py-3">
                  <span className={cn("text-xs", merchant.isActive ? "text-emerald-500" : "text-muted-foreground")}>
                    {merchant.isActive ? "Activ" : "Inactiv"}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{formatDateShort(new Date(merchant.createdAt))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {merchants.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">Niciun comerciant încă.</p>
        )}
      </div>
    </div>
  );
}
