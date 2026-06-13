import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product imagery is served from Unsplash (see src/lib/product-image.ts).
    // Allow that host so next/image still optimizes (resize/format/srcset)
    // instead of disabling optimization globally.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
