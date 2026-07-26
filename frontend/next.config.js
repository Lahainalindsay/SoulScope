/** @type {import('next').NextConfig} */
const backendBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://soulscope.onrender.com").replace(/\/+$/, "");

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: `${backendBaseUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
