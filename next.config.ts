import type { NextConfig } from "next";
const config: NextConfig = {
  // Keep the synthetic integration server separate from normal dev/build output.
  distDir: process.env.LOCAL_PERMISSIONS_TEST === "true" ? ".next/permissions-test" : ".next",
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,
  // The shared local preview uses 127.0.0.1 rather than Next's localhost origin.
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default config;
