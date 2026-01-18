import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable system TLS certificates for Turbopack
    turbopackUseSystemTlsCerts: true,
  },
};

export default nextConfig;
