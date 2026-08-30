import { cn } from "@/lib/utils";

/** A pulsing placeholder block, shaped by whatever className/children
 *  it's given. Used to mirror a page's real layout while its data is
 *  still loading, instead of a blank screen or a generic spinner. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}
