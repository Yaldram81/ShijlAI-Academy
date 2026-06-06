import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    ".space-z.ai",
    "preview-chat-1fb4353a-6134-4f5b-8523-e7025c23d642.space-z.ai",
  ],
};

export default nextConfig;
