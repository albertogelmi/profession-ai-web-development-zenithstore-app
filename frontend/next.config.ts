import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Docker standalone build (Dockerfile uses .next/standalone)
  output: 'standalone',
  // Tree-shake large packages to reduce CSS chunk splitting and preload warnings
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-slider',
      '@radix-ui/react-switch',
      '@radix-ui/react-separator',
      '@radix-ui/react-progress',
      '@radix-ui/react-label',
      'sonner',
    ],
  },
};

export default nextConfig;
