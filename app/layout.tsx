import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Planno",
  description: "Platformă de rezervări pentru comercianți și clienți.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {/* data-vaul-drawer-wrapper goes here, not on <body>: vaul's
            shouldScaleBackground effect (see components/ui/modal.tsx)
            applies a `transform: scale()` to whichever element carries
            this attribute, and a `transform` makes an element the
            containing block for any `position: fixed` descendant --
            including the drawer itself, since vaul portals it into
            `document.body` too. Putting the attribute on body would
            make body's own (very tall, scrollable) height the drawer's
            `bottom: 0` reference instead of the viewport, pushing it
            thousands of pixels down, off-screen. This div wraps only
            the actual page content, so the portaled drawer -- appended
            after it, as body's last child -- stays a sibling outside
            the transformed subtree and keeps positioning against the
            real viewport. */}
        <div data-vaul-drawer-wrapper="" className="min-h-screen">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
