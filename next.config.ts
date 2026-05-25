import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Photos now served from /api/photos/[id] — no external image hosts needed
  images: {
    remotePatterns: [],
  },
  // Ensure DB credentials never reach the browser bundle
  serverExternalPackages: ['pg', 'bcryptjs'],
};

export default nextConfig;
