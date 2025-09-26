#!/usr/bin/env node

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