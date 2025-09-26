#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Running prebuild hook to set up Google Services...');

// Create the android/app directory if it doesn't exist
const androidAppDir = path.join(process.cwd(), 'android', 'app');
if (!fs.existsSync(androidAppDir)) {
  fs.mkdirSync(androidAppDir, { recursive: true });
  console.log('📁 Created android/app directory');
}

// Decode the base64 Google Services JSON and write it to the file
if (process.env.GOOGLE_SERVICES_JSON) {
  try {
    const googleServicesContent = Buffer.from(process.env.GOOGLE_SERVICES_JSON, 'base64').toString('utf8');
    const googleServicesPath = path.join(androidAppDir, 'google-services.json');
    
    fs.writeFileSync(googleServicesPath, googleServicesContent);
    console.log('✅ google-services.json created from environment variable');
    
    // Verify the file was created correctly
    if (fs.existsSync(googleServicesPath)) {
      const stats = fs.statSync(googleServicesPath);
      console.log(`📄 File size: ${stats.size} bytes`);
    }
  } catch (error) {
    console.error('❌ Error creating google-services.json:', error.message);
    process.exit(1);
  }
} else {
  console.log('⚠️  GOOGLE_SERVICES_JSON environment variable not found');
  console.log('🔍 Available environment variables:', Object.keys(process.env).filter(key => key.includes('GOOGLE')));
}