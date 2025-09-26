#!/bin/bash

# EAS Build Pre-Install Hook
# This script runs before dependencies are installed

echo "🔧 Setting up Google Services JSON from environment variable..."

if [ -n "$GOOGLE_SERVICES_JSON" ]; then
  echo "✅ GOOGLE_SERVICES_JSON environment variable found"
  echo "$GOOGLE_SERVICES_JSON" | base64 --decode > google-services.json
  echo "✅ google-services.json file created successfully"
  
  # Verify the file was created
  if [ -f "google-services.json" ]; then
    echo "✅ google-services.json file verified"
    ls -la google-services.json
  else
    echo "❌ Failed to create google-services.json file"
    exit 1
  fi
else
  echo "❌ GOOGLE_SERVICES_JSON environment variable not found"
  exit 1
fi

echo "🚀 Pre-install setup complete!"