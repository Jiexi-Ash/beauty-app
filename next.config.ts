import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vibrant-gnu-509.eu-west-1.convex.cloud",
        port: "",
        pathname: "/**"
      }
    ]
  }
};

export default nextConfig;
