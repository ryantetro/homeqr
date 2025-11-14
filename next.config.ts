import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.zillowstatic.com',
      },
      {
        protocol: 'https',
        hostname: '**.photos.zillowstatic.com',
      },
      {
        protocol: 'https',
        hostname: '**.zillow.com',
      },
      {
        protocol: 'https',
        hostname: '**.utahrealestate.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.utahrealestate.com',
      },
      {
        protocol: 'https',
        hostname: '**.realtor.com',
      },
      {
        protocol: 'https',
        hostname: '**.redfin.com',
      },
      {
        protocol: 'https',
        hostname: '**.homes.com',
      },
      {
        protocol: 'https',
        hostname: '**.trulia.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
    localPatterns: [
      {
        pathname: '/api/image-proxy',
        search: 'url=*',
      },
      {
        pathname: '/logo.png',
      },
      {
        pathname: '/logowords.png',
      },
      {
        pathname: '/next.svg',
      },
      {
        pathname: '/vercel.svg',
      },
      {
        pathname: '/file.svg',
      },
      {
        pathname: '/globe.svg',
      },
      {
        pathname: '/window.svg',
      },
    ],
    unoptimized: false,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 95, 100],
  },
};

export default nextConfig;
