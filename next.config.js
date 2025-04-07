/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  transpilePackages: [
    "@radix-ui/react-dropdown-menu",
    "react-feather",
    "tailwind-merge",
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "pdfjs-dist": require.resolve("pdfjs-dist"),
    };
    return config;
  },
};

module.exports = nextConfig;
