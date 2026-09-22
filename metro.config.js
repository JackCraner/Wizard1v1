const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
// Development tools and generated reports must never enter a mobile bundle.
const existing = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
  /[/\\]tools[/\\]balance-lab[/\\].*/,
];
module.exports = config;
