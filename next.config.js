/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  transpilePackages: [
    "@radix-ui/react-dropdown-menu",
    "react-feather",
    "tailwind-merge",
  ],
  webpack: (config) => {
    // Add .node file handling
    config.module.rules.push({
      test: /\.node/,
      use: "raw-loader",
    });

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
  },
};

module.exports = nextConfig;
