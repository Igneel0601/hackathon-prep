import type { MetadataRoute } from "next";

// PWA manifest — makes the POS installable on desktop (Chrome/Edge) and lets it
// run standalone + offline. Served by Next at /manifest.webmanifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Odoo Cafe POS",
    short_name: "Cafe POS",
    description: "Restaurant point-of-sale — orders, kitchen display, payments. Works offline.",
    start_url: "/",
    display: "standalone",
    background_color: "#160f0a",
    theme_color: "#160f0a",
    orientation: "any",
    icons: [
      { src: "/logo-badge.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/logo-badge.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
