/** @type {import('next').NextConfig} */
const backendApiBase = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (!backendApiBase) {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: `${backendApiBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
