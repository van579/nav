module.exports = {
  globDirectory: "build/",
  globPatterns: [
    "**/*.{json,ico,html,png,txt,css,js}"
  ],
  globIgnores: [
    "service-worker.js",
    "workbox-*.js",
    "asset-manifest.json"
  ],
  swDest: "build/service-worker.js",
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    {
      // Cache images with CacheFirst strategy
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        },
      },
    },
    {
      // Cache API calls with NetworkFirst strategy
      // Matches routes starting with /api/
      urlPattern: /\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 24 Hours
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    }
  ]
}; 