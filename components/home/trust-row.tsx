import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { avatarGradient, initials } from "@/lib/avatar";
import type { PlatformStats } from "@/lib/data/stats";

interface TrustRowProps {
  /** Real business names, used for the avatar stack. */
  names: string[];
  stats: PlatformStats;
  className?: string;
}

export function TrustRow({ names, stats, className }: TrustRowProps) {
  const shown = names.slice(0, 5);
  const overflow = Math.max(0, stats.merchants - shown.length);

  return (
    <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-3", className)}>
      {shown.length > 0 && (
        <div className="flex items-center -space-x-2.5">
          {shown.map((name) => (
            <span
              key={name}
              title={name}
              className="flex size-9 items-center justify-center rounded-full text-[11px] font-semibold text-white ring-2 ring-background"
              style={{ background: avatarGradient(name) }}
            >
              {initials(name)}
            </span>
          ))}
          {overflow > 0 && (
            <span className="flex size-9 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground ring-2 ring-background">
              +{overflow}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1" aria-label="Rating mediu 4,9 din 5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="size-3.5 fill-accent text-accent" aria-hidden="true" />
          ))}
          <span className="ml-1 text-sm font-medium">4,9</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {stats.merchants} {stats.merchants === 1 ? "afacere activă" : "afaceri active"}
          {stats.cities > 0 && ` în ${stats.cities} ${stats.cities === 1 ? "oraș" : "orașe"}`} ·{" "}
          {stats.services} servicii disponibile
        </p>
      </div>
    </div>
  );
}
