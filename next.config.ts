import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
      protocol:"https",
      hostname:"eg-rv.homzmart.net",
      port:"",
      pathname:"/**"
    }
  ],
  
  unoptimized: true,
  minimumCacheTTL: 86400,
  formats: ["image/avif", "image/webp"],
},

 reactStrictMode: false,
  poweredByHeader: false,
//  output: "export",
  output: "standalone",
  compress: true,

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
