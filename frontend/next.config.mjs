/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  turbopack: {
    root: import.meta.dirname,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
      "recharts",
      "framer-motion",
      "@tanstack/react-table",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
    ],
  },
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: "all",
        maxInitialRequests: 25,
        minSize: 20_000,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          framework: {
            name: "framework",
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            priority: 40,
            enforce: true,
            chunks: "all",
          },
          charts: {
            name: "charts",
            test: /[\\/]node_modules[\\/](recharts|d3-[^/]+|victory-vendor)[\\/]/,
            priority: 35,
            chunks: "async",
            reuseExistingChunk: true,
          },
          motion: {
            name: "motion",
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            priority: 35,
            chunks: "async",
            reuseExistingChunk: true,
          },
          dnd: {
            name: "dnd",
            test: /[\\/]node_modules[\\/]@dnd-kit[\\/]/,
            priority: 30,
            chunks: "async",
            reuseExistingChunk: true,
          },
          alerts: {
            name: "alerts",
            test: /[\\/]node_modules[\\/]sweetalert2[\\/]/,
            priority: 30,
            chunks: "async",
            reuseExistingChunk: true,
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
