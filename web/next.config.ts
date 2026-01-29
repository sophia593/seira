import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization for external sources
  images: {
    remotePatterns: [
      // Ticketmaster event images
      {
        protocol: 'https',
        hostname: 's1.ticketm.net',
      },
      {
        protocol: 'https',
        hostname: 'media.ticketmaster.com',
      },
      {
        protocol: 'https',
        hostname: 'images.universe.com',
      },
      // Hotel images (common providers)
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'photos.hotelbeds.com',
      },
      {
        protocol: 'https',
        hostname: '*.booking.com',
      },
      // Generic image CDNs
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
      },
    ],
    // Optimize images
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
