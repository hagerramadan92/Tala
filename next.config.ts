import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix workspace root detection
  outputFileTracingRoot: path.resolve(__dirname),

  allowedDevOrigins: ["127.0.0.1", "localhost"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.freepik.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "your-api-domain.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "thumbs.dreamstime.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.watertank6tons.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "eg-rv.homzmart.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "dashboard.talaaljazeera.com",
        port: "",
        pathname: "/**",
      },
    ],

    unoptimized: true,
    minimumCacheTTL: 86400,
    formats: ["image/avif", "image/webp"],
  },

  reactStrictMode: false,

  poweredByHeader: false,

  // IMPORTANT:
  // Don't use output: "standalone" with npm start
  // output: "standalone",

  compress: true,

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      "react-icons",
      "@mui/material",
      "@mui/icons-material",
      "lucide-react",
      "@fortawesome/react-fontawesome",
      "framer-motion",
      "swiper",
    ],
  },
};

export default nextConfig;
