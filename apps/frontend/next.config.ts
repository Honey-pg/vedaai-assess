import type { NextConfig } from "next";
import path from "path";
import { loadEnvConfig } from "@next/env";

// Merge monorepo root `.env` so `NEXT_PUBLIC_API_URL`, Clerk keys, etc. reach the client bundle during `next dev`.
loadEnvConfig(path.resolve(__dirname, "../.."));

const nextConfig: NextConfig = {
  // Turbopack dev omitted `/toolkit` from route discovery (404 in dev while `next build`
  // saw the route). Serving the page under `/teacher-toolkit` and rewriting fixes `/toolkit`.
  async rewrites() {
    return [{ source: '/toolkit', destination: '/teacher-toolkit' }];
  },
};

export default nextConfig;
