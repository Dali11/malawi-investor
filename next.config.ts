import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        // /markets/stocks was a duplicate of /mse (same data, same
        // columns) — retired in favor of /mse as the canonical stocks
        // list. Keep this redirect for any bookmarked/indexed links.
        source: "/markets/stocks",
        destination: "/mse",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;