import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack dev omitted `/toolkit` from route discovery (404 in dev while `next build`
  // saw the route). Serving the page under `/teacher-toolkit` and rewriting fixes `/toolkit`.
  async rewrites() {
    return [{ source: '/toolkit', destination: '/teacher-toolkit' }];
  },
};

export default nextConfig;
