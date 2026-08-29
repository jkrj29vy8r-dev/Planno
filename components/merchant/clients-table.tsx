import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Planni } from "@/components/planni";
import { formatDateShort } from "@/lib/format";
import type { MerchantClientSummary } from "@/lib/data/merchant";

export function ClientsTable({ clients, timezone }: { clients: MerchantClientSummary[]; timezone: string }) {
  if (clients.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-16 text-center">
        <Planni state="empty-state" size={120} message="" />
        <p className="text-sm text-muted-foreground">Niciun client încă.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border/40 bg-muted/30 text-left text-xs font-medium text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Total rezervări</th>
              <th className="px-4 py-3 font-medium">Ultima vizită</th>
              <th className="px-4 py-3 font-medium">Următoarea programare</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link href={`/merchant/dashboard/clients/${client.id}`} className="font-medium hover:text-accent">
                    {client.fullName}
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{client.email ?? client.phone ?? "—"}</td>
                <td className="px-4 py-3">{client.totalBookings}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {client.lastVisit ? formatDateShort(new Date(client.lastVisit), timezone) : "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {client.nextUpcoming ? formatDateShort(new Date(client.nextUpcoming), timezone) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
