import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allowlist for the hero showcase's optional photography. Add a
    // `photo` URL to a category in lib/category-visuals.ts and it
    // renders over that tile's gradient; the gradient stays as the
    // loading and failure backdrop, so a dead URL degrades to the
    // designed tile rather than to a broken image.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lhfuwmtjuqngfuvcknce.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
