import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    let supabaseOrigin = "";
    if (supabaseUrl) {
      try {
        supabaseOrigin = new URL(supabaseUrl).origin;
      } catch {
        // Ignore invalid URL
      }
    }
    const extraSupabase = supabaseOrigin ? ` ${supabaseOrigin}` : "";

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com https://cdn.jsdelivr.net https://www.google.com https://www.gstatic.com https://checkout.razorpay.com; ` +
              "style-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com https://checkout.razorpay.com; " +
              `img-src 'self' data: blob: https://www.google.com https://www.gstatic.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://avatars.githubusercontent.com https://checkout.razorpay.com https://rzp.io https://*.supabase.co${extraSupabase}; ` +
              `connect-src 'self'${isDev ? " ws: wss: http://localhost:8000" : ""} https://*.supabase.co wss://*.supabase.co${extraSupabase} https://va.vercel-scripts.com https://cdn.jsdelivr.net https://rag.prateeq.in https://storage.googleapis.com https://www.google.com https://api.razorpay.com https://lumberjack.razorpay.com; ` +
              "worker-src 'self' blob:; " +
              "font-src 'self' https://www.gstatic.com; " +
              "object-src 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self'; " +
              "frame-src 'self' https://www.google.com https://www.gstatic.com https://api.razorpay.com https://checkout.razorpay.com; " +
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
};

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
