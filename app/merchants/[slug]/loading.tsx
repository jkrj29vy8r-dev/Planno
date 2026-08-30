import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the real page's shape (hero / header / tabs / service cards)
 *  so the layout doesn't jump once data arrives -- a spinner would hide
 *  that structure and read as a blank screen for longer than it is. */
export default function MerchantLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 border-b border-border/40" aria-hidden="true" />
      <Skeleton className="h-56 w-full rounded-none sm:h-72 lg:h-80" />

      <main className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col gap-3 py-6">
          <Skeleton className="h-5 w-20 rounded-full" />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
          <Skeleton className="h-4 w-48" />
        </div>

        <div className="mb-6 flex gap-6 border-b border-border/40 pb-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>

        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
          ))}
        </div>
      </main>
    </div>
  );
}
