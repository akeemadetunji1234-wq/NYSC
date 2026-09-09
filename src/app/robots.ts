import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://nysc-mu.vercel.app").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/control-room-7f3k9d/", "/agent/", "/member/", "/api/", "/forgot-password", "/reset-password", "/verify-google"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
