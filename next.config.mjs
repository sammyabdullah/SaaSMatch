/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Disable client-side router cache for dynamic pages.
    // Without this, navigating to /dashboard after flagging on /discover
    // serves a stale cached version that doesn't show the new flag.
    staleTimes: {
      dynamic: 0,
    },
  },
};

export default nextConfig;
