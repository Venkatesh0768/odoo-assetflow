import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained server in .next/standalone —
  // this keeps the Docker image small (no node_modules copy needed).
  output: "standalone",
};

export default nextConfig;
