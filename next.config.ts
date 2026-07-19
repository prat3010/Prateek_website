import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    return [
      {
        source: "/:path*",
        headers: [
          {
                        key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com https://cdn.jsdelivr.net; ` +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: blob:; " +
               `connect-src 'self'${isDev ? " ws: wss:" : ""} https://va.vercel-scripts.com https://cdn.jsdelivr.net https://rag.prateeq.in; ` +
              "worker-src 'self' blob:; " +
              "font-src 'self'; " +
              "object-src 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self'; " +
              "frame-ancestors 'none';",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
}

export default ((): NextConfig => {
  if (process.env.ANALYZE === "true") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const withBundleAnalyzer: (opts: { enabled: boolean }) => (config?: NextConfig) => NextConfig = require("@next/bundle-analyzer");
      return withBundleAnalyzer({ enabled: true })(nextConfig);
    } catch {
      console.warn("[bundle-analyzer] failed to load, skipping");
    }
  }
  return nextConfig;
})();
