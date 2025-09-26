#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create the android/app directory if it doesn't exist
const androidAppDir = path.join(process.cwd(), 'android', 'app');
if (!fs.existsSync(androidAppDir)) {
  fs.mkdirSync(androidAppDir, { recursive: true });
}

// Decode the base64 Google Services JSON and write it to the file
if (process.env.GOOGLE_SERVICES_JSON) {
  const googleServicesContent = Buffer.from(process.env.GOOGLE_SERVICES_JSON, 'base64').toString('utf8');
  const googleServicesPath = path.join(androidAppDir, 'google-services.json');
  
  fs.writeFileSync(googleServicesPath, googleServicesContent);
  console.log('✓ google-services.json created from environment variable');
} else {
  console.log('⚠️  GOOGLE_SERVICES_JSON environment variable not found');
}