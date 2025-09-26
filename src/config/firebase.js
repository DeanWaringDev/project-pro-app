/**
 * firebase.js - Firebase Configuration and Initialization
 * 
 * This file initializes Firebase services for the Project Pro app:
 * - Authentication (for user login/signup)
 * - Firestore Database (for storing projects and tasks)
 * - Storage (for uploading project images)
 * - Google Auth Provider (for potential Google sign-in)
 */

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Firebase configuration object
 * These credentials connect your app to your specific Firebase project
 * 
 * SECURITY NOTE: These keys are safe to expose in client-side code
 * The security comes from Firestore security rules, not hiding these keys
 */
const firebaseConfig = {
  apiKey: "AIzaSyAmhBP2GD6gPI9axj4gtUBcY39YB-9s54w",
  authDomain: "project-pro-app.firebaseapp.com",
  projectId: "project-pro-app",
  storageBucket: "project-pro-app.firebasestorage.app",
  messagingSenderId: "1006772650440",
  appId: "1:1006772650440:web:a9835f041b3019b6fb80fd"
};

/**
 * Initialize Firebase app with configuration
 */
console.log('Initializing Firebase app...');
const app = initializeApp(firebaseConfig);
console.log('Firebase app initialized successfully');

/**
 * Initialize Firebase services
 */

// Authentication service - handles user login/signup/logout with persistent storage
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
console.log('Firebase Auth initialized with AsyncStorage persistence');

// Firestore database - stores projects, tasks, and user data
export const db = getFirestore(app);
console.log('Firestore database initialized');

// Cloud Storage - stores project images and other files
export const storage = getStorage(app);
console.log('Firebase Storage initialized');

// Google Auth Provider - for Google sign-in (if implemented later)
export const googleProvider = new GoogleAuthProvider();

// Export the app instance as default
export default app;