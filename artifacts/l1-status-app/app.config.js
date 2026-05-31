// Dynamic config so EXPO_BASE_URL can be injected at build time
// (needed for GitHub Pages which serves from a subdirectory)
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.EXPO_BASE_URL ?? "",
  },
});
