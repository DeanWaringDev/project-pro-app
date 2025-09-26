/**
 * metro.config.js - Metro Bundler Configuration for React Native/Expo
 * 
 * This configuration file customizes the Metro bundler behavior:
 * - Extends the default Expo Metro configuration
 * - Adds CSS file support for web compatibility
 * - Handles asset resolution and bundling
 * - Optimizes for React Native and web platforms
 * 
 * Configuration Details:
 * - getDefaultConfig(__dirname): Uses Expo's optimized Metro setup
 * - assetExts.push('css'): Enables CSS file imports for web builds
 * - Maintains compatibility with React Native asset handling
 * 
 * Asset Extensions:
 * - Standard: png, jpg, jpeg, bmp, gif, webp, psd, svg, tiff
 * - Added: css (for web platform styling support)
 * - Enables proper bundling of web-specific assets
 * 
 * Platform Support:
 * - iOS: Native asset handling
 * - Android: Native asset handling  
 * - Web: Extended support with CSS assets
 */
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('css');
module.exports = config;