/** Deterministic hue per name (0-359), so a generated avatar keeps the
 *  same colour between renders and between server and client -- a real
 *  hash, never Math.random(), which would differ per render. */
export function hueFor(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 360;
  }
  return hash;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** CSS gradient for a name-derived avatar background. */
export function avatarGradient(name: string): string {
  const hue = hueFor(name);
  return `linear-gradient(140deg, oklch(0.62 0.11 ${hue}), oklch(0.42 0.09 ${(hue + 40) % 360}))`;
}
