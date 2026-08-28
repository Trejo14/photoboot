import type { NextConfig } from "next";

const s3Host = process.env.S3_PUBLIC_BASE_URL
  ? new URL(process.env.S3_PUBLIC_BASE_URL).hostname
  : "localhost";

const nextConfig: NextConfig = {
  transpilePackages: ["@photobooth/ui", "@photobooth/types"],
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: s3Host },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;