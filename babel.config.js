/**
 * babel.config.js - Babel Configuration for React Native/Expo Project
 * 
 * This configuration file sets up Babel transpilation for the project:
 * - Uses the standard Expo Babel preset
 * - Enables API caching for improved build performance
 * - Handles JSX transformation and modern JavaScript features
 * - Supports React Native specific transformations
 * 
 * Preset Details:
 * - babel-preset-expo: Comprehensive preset for Expo projects
 *   - Includes React Native transformations
 *   - Handles async/await and other ES6+ features
 *   - Optimizes for both development and production builds
 * 
 * Caching:
 * - api.cache(true): Enables Babel's caching mechanism
 * - Improves build performance by reusing transformation results
 * - Automatically invalidates when configuration changes
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};