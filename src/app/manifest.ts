import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Neat & Affordable",
    short_name: "NYSC Housing",
    description: "Secure, affordable NYSC housing and member services.",
    start_url: "/member",
    display: "standalone",
    background_color: "#0b1220",
    theme_color: "#0f766e",
    icons: [{ src: "/NYSC.webp", sizes: "192x192", type: "image/webp", purpose: "any" }, { src: "/NYSC.webp", sizes: "512x512", type: "image/webp", purpose: "maskable" }],
  };
}
