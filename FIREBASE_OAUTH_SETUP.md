# Firebase OAuth Client ID Setup Guide

## Step-by-Step Instructions for Adding OAuth Client IDs

### Step 1: Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **project-pro-app**

### Step 2: Navigate to Authentication
1. In the left sidebar, click **"Authentication"**
2. Click on the **"Sign-in method"** tab
3. Find **"Google"** in the list of providers

### Step 3: Enable Google Sign-In
1. Click on **"Google"** provider
2. Toggle the **"Enable"** switch to ON
3. You'll see a configuration screen

### Step 4: Configure OAuth Client IDs

#### Current Project Information:
- **Project ID**: `project-pro-app`
- **Package Name**: `com.deanwaringdev.projectpro` (from your google-services.json)
- **Project Number**: `1006772650440`

#### A. Web Client ID (Already Configured)
✅ This is automatically configured when you enable Google sign-in

#### B. Android OAuth Client ID
1. In the Google sign-in configuration screen, you'll see **"Web SDK configuration"**
2. Click **"Web client ID"** dropdown
3. If you don't see an Android client ID, you need to create one:

**To create Android OAuth Client:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **project-pro-app**
3. Navigate to **"APIs & Services"** > **"Credentials"**
4. Click **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
5. Select **"Android"** as application type
6. Fill in:
   - **Name**: `Project Pro Android`
   - **Package name**: `com.deanwaringdev.projectpro`
   - **SHA-1 certificate fingerprint**: See instructions below

#### C. iOS OAuth Client ID
1. In Google Cloud Console > Credentials
2. Click **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
3. Select **"iOS"** as application type
4. Fill in:
   - **Name**: `Project Pro iOS`
   - **Bundle ID**: `com.deanwaringdev.projectpro`

### Step 5: Get SHA-1 Certificate Fingerprint (Android)

#### For Development (Debug Certificate):
```bash
# Windows
keytool -list -v -alias androiddebugkey -keystore %USERPROFILE%\.android\debug.keystore

# Mac/Linux
keytool -list -v -alias androiddebugkey -keystore ~/.android/debug.keystore
```
- **Password**: `android`
- Copy the **SHA1** fingerprint

#### For Production:
Use your release keystore's SHA-1 fingerprint

### Step 6: Update Configuration Files

After creating the OAuth clients, download the updated config files:

#### Android - google-services.json
1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll to **"Your apps"** section
3. Click on your Android app
4. Download the **new** `google-services.json`
5. Replace the existing file in your project root

#### iOS - GoogleService-Info.plist
1. In Firebase Console, go to **Project Settings**
2. Click on your iOS app (or add iOS app if not exists)
3. Download `GoogleService-Info.plist`
4. Add to your iOS project configuration

### Step 7: Verify Configuration

#### Check Web Client ID:
In Firebase Console > Authentication > Sign-in method > Google:
- You should see a **Web client ID** starting with your project number

#### Check Mobile Client IDs:
In Google Cloud Console > APIs & Services > Credentials:
- You should see:
  - ✅ Web client (auto-created by Firebase)
  - ✅ Android client
  - ✅ iOS client

### Step 8: Test Implementation

#### Web Testing:
1. Run `npm start`
2. Open in browser
3. Click "Continue with Google"
4. Should work immediately

#### Mobile Testing:
1. Build app for mobile: `expo build:android` or `expo build:ios`
2. Install on device
3. Test Google sign-in
4. Should open Google authentication flow

## Common Issues & Solutions

### Issue: "Error 400: invalid_client"
**Solution**: OAuth client ID not configured properly
- Check package name matches exactly
- Verify SHA-1 fingerprint is correct
- Ensure oauth_client array in google-services.json is populated

### Issue: "Error 403: access_denied"
**Solution**: Google sign-in not enabled in Firebase
- Enable Google provider in Firebase Authentication

### Issue: Web works but mobile doesn't
**Solution**: Mobile OAuth clients not configured
- Add Android/iOS OAuth clients in Google Cloud Console
- Update configuration files

## Quick Reference

### Your Project Details:
- **Firebase Project**: project-pro-app
- **Package Name**: com.deanwaringdev.projectpro
- **Project Number**: 1006772650440
- **Auth Domain**: project-pro-app.firebaseapp.com

### Files to Update After Configuration:
1. `google-services.json` (Android)
2. `GoogleService-Info.plist` (iOS) - if building for iOS

Need help with any of these steps? Let me know which part you'd like me to explain further!