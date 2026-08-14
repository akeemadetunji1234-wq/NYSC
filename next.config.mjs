import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  poweredByHeader: false,
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self' https://accounts.google.com",
      `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''} https://api.mapbox.com https://*.mapbox.com https://accounts.google.com https://www.gstatic.com https://js.pusher.com`,
      "style-src 'self' 'unsafe-inline' https://api.mapbox.com https://*.mapbox.com",
      "img-src 'self' data: blob: https://*.mapbox.com https://images.unsplash.com https://www.svgrepo.com https://i.pravatar.cc https://*.googleusercontent.com",
      "font-src 'self' data:",
      "connect-src 'self' https://api.mapbox.com https://*.mapbox.com https://events.mapbox.com https://accounts.google.com https://www.googleapis.com https://*.pusher.com https://*.pusherapp.com wss://*.pusher.com wss://*.pusherapp.com",
      "frame-src 'self' https://accounts.google.com",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      ...(!isDevelopment ? ['upgrade-insecure-requests'] : []),
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          { key: 'Origin-Agent-Cluster', value: '?1' },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'www.svgrepo.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      // ...existing aliases
    };
    return config;
  },
};

export default nextConfig;
