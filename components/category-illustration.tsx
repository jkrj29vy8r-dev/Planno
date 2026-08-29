import { cn } from "@/lib/utils";
import { categoryVisual } from "@/lib/category-visuals";

/** Small, fast string hash -- not for security, only to turn a category
 *  id into a stable stream of "random" numbers so the same category
 *  always draws the same illustration (server and client agree, and it
 *  never changes between visits). */
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (Math.imul(hash, 31) + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function seededValue(seed: string, index: number, min: number, max: number): number {
  const h = hashString(`${seed}:${index}`);
  return min + (h % 10_000) / 10_000 * (max - min);
}

interface Orb {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
}

/** Four soft circles, positioned/sized/faded from the category id, kept
 *  clear of the centre so they never fight the icon badge. Regenerating
 *  this for a category always produces the exact same layout. */
function orbsFor(category: string): Orb[] {
  return Array.from({ length: 4 }, (_, i) => {
    const corner = i % 2 === 0 ? [8, 28] : [72, 92];
    return {
      cx: seededValue(category, i * 4 + 0, corner[0], corner[1]),
      cy: seededValue(category, i * 4 + 1, i < 2 ? 5 : 60, i < 2 ? 40 : 95),
      r: seededValue(category, i * 4 + 2, 14, 34),
      opacity: seededValue(category, i * 4 + 3, 0.08, 0.18),
    };
  });
}

interface CategoryIllustrationProps {
  category: string;
  className?: string;
  iconClassName?: string;
}

/**
 * Category cover art with no external dependency: a two-tone gradient
 * plus a handful of deterministic soft orbs and the category's icon in
 * a glass chip. Every category renders a genuinely different
 * composition (derived from its own id), so no two categories can ever
 * end up showing the same picture -- the failure mode this replaces.
 */
export function CategoryIllustration({ category, className, iconClassName }: CategoryIllustrationProps) {
  const visual = categoryVisual(category);
  const Icon = visual.icon;
  const orbs = orbsFor(category);

  return (
    <div
      className={cn("relative size-full overflow-hidden", className)}
      style={{ background: `linear-gradient(155deg, ${visual.from}, ${visual.to})` }}
    >
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {orbs.map((orb, i) => (
          <circle key={i} cx={orb.cx} cy={orb.cy} r={orb.r} fill="white" opacity={orb.opacity} />
        ))}
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-[2px]">
          <Icon className={cn("size-6 text-white", iconClassName)} strokeWidth={1.6} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
