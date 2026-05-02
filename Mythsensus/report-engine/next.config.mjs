/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Allow JSON imports from /data directory
  webpack(config) {
    config.module.rules.push({
      test: /\.json$/,
      type: 'json',
    })
    return config
  },

  // Ensure large JSON files (gods.json ~350KB) don't hit serverless limits
  experimental: {
    serverComponentsExternalPackages: [],
  },
}

export default nextConfig
