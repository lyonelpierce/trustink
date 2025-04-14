/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  transpilePackages: [
    "@radix-ui/react-dropdown-menu",
    "react-feather",
    "tailwind-merge",
  ],
  webpack: (config, { nextRuntime }) => {
    // Add canvas alias for Node.js runtime
    if (nextRuntime === "nodejs") {
      config.resolve.alias.canvas = false;
    }

    // Existing PDF.js configuration
    config.resolve.alias = {
      ...config.resolve.alias,
      "pdfjs-dist": require.resolve("pdfjs-dist"),
    };
    return config;
  },
  experimental: {
    turbo: {
      resolveAlias: {
        canvas: "./empty-module.ts",
      },
    },
    serverComponentsExternalPackages: ["pdf-parse"],
  },
};

module.exports = nextConfig;
