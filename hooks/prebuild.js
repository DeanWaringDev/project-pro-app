#!/usr/bin/env node

/**
 * prebuild.js - EAS Build Prebuild Hook for Google Services Configuration
 * 
 * This prebuild hook runs automatically during the EAS build process to:
 * - Set up Google Services configuration from environment variables
 * - Create google-services.json from base64 encoded environment data
 * - Ensure proper directory structure for Android builds
 * - Update app.json configuration with Google Services file reference
 * 
 * Environment Requirements:
 * - GOOGLE_SERVICES_JSON: Base64 encoded google-services.json content
 * 
 * Build Process Integration:
 * 1. Runs before the main build process starts
 * 2. Checks for required environment variables
 * 3. Creates android/app directory if needed
 * 4. Decodes and writes google-services.json
 * 5. Updates app.json configuration
 * 6. Provides detailed logging for debugging
 * 
 * Error Handling:
 * - Gracefully handles missing environment variables
 * - Continues build process even if Google Services setup fails
 * - Provides detailed error logging for troubleshooting
 * 
 * Security Notes:
 * - Uses environment variables to avoid committing sensitive data
 * - Base64 encoding ensures proper handling of JSON structure
 * - Only runs during build process, not in development
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Running prebuild hook to set up Google Services...');

// First, check if we have the environment variable
if (!process.env.GOOGLE_SERVICES_JSON) {
  console.log('⚠️  GOOGLE_SERVICES_JSON environment variable not found');
  console.log('🔍 Available environment variables:', Object.keys(process.env).filter(key => key.includes('GOOGLE')));
  console.log('ℹ️  Proceeding without Google Services (Google Sign-In will not work)');
  process.exit(0);
}

try {
  // Create the android/app directory if it doesn't exist
  const androidAppDir = path.join(process.cwd(), 'android', 'app');
  if (!fs.existsSync(androidAppDir)) {
    fs.mkdirSync(androidAppDir, { recursive: true });
    console.log('📁 Created android/app directory');
  }

  // Decode the base64 Google Services JSON and write it to the file
  const googleServicesContent = Buffer.from(process.env.GOOGLE_SERVICES_JSON, 'base64').toString('utf8');
  const googleServicesPath = path.join(androidAppDir, 'google-services.json');
  
  fs.writeFileSync(googleServicesPath, googleServicesContent);
  console.log('✅ google-services.json created from environment variable');
  
  // Verify the file was created correctly
  if (fs.existsSync(googleServicesPath)) {
    const stats = fs.statSync(googleServicesPath);
    console.log(`📄 File size: ${stats.size} bytes`);
  }

  // Also update app.json to include the googleServicesFile reference
  const appJsonPath = path.join(process.cwd(), 'app.json');
  if (fs.existsSync(appJsonPath)) {
    const appJsonContent = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    if (!appJsonContent.expo.android.googleServicesFile) {
      appJsonContent.expo.android.googleServicesFile = './android/app/google-services.json';
      fs.writeFileSync(appJsonPath, JSON.stringify(appJsonContent, null, 2));
      console.log('✅ Updated app.json to reference google-services.json');
    }
  }

} catch (error) {
  console.error('❌ Error creating google-services.json:', error.message);
  process.exit(1);
}