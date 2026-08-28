"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

/**
 * Applies the `.dark` class to <html> based on stored preference /
 * system setting, before paint, so there is never a flash of the
 * wrong theme. Pair with `suppressHydrationWarning` on <html>.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
