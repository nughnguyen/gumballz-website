import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/api/account/purchases": ["./private-data/league-accounts.txt.enc"],
    "/api/game-accounts/offers": ["./private-data/league-accounts.txt.enc"],
    "/api/game-accounts/offers/[slug]": ["./private-data/league-accounts.txt.enc"],
    "/api/admin/game-accounts/inventory": ["./private-data/league-accounts.txt.enc"],
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }];
  },
};

export default nextConfig;
