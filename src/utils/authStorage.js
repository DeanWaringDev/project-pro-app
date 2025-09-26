/**
 * authStorage.js - Authentication Storage Utilities
 * 
 * Utilities for managing persistent authentication state and user preferences
 * using AsyncStorage for reliable cross-platform storage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  AUTH_STATE: 'userAuthState',
  USER_ID: 'userId',
  USER_PREFERENCES: 'userPreferences',
  REMEMBER_LOGIN: 'rememberLogin',
  LAST_LOGIN_METHOD: 'lastLoginMethod'
};

/**
 * Store user authentication state
 */
export const storeAuthState = async (user, loginMethod = 'email') => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_STATE, 'authenticated');
    await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, user.uid);
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_LOGIN_METHOD, loginMethod);
    
    // Store basic user info for quick access
    const userInfo = {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLoginTime: new Date().toISOString()
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(userInfo));
    console.log('Authentication state stored successfully');
    return true;
  } catch (error) {
    console.error('Error storing auth state:', error);
    return false;
  }
};

/**
 * Clear all stored authentication data
 */
export const clearAuthState = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_ID);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);
    await AsyncStorage.removeItem(STORAGE_KEYS.LAST_LOGIN_METHOD);
    console.log('Authentication state cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing auth state:', error);
    return false;
  }
};

/**
 * Check if user was previously authenticated
 */
export const getStoredAuthState = async () => {
  try {
    const authState = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_STATE);
    const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
    const userPreferences = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    const lastLoginMethod = await AsyncStorage.getItem(STORAGE_KEYS.LAST_LOGIN_METHOD);

    if (authState === 'authenticated' && userId) {
      return {
        isAuthenticated: true,
        userId,
        userPreferences: userPreferences ? JSON.parse(userPreferences) : null,
        lastLoginMethod
      };
    }
    return { isAuthenticated: false };
  } catch (error) {
    console.error('Error getting stored auth state:', error);
    return { isAuthenticated: false };
  }
};

/**
 * Store user preference for remembering login
 */
export const setRememberLogin = async (remember = true) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_LOGIN, remember.toString());
    return true;
  } catch (error) {
    console.error('Error storing remember login preference:', error);
    return false;
  }
};

/**
 * Get user preference for remembering login
 */
export const getRememberLogin = async () => {
  try {
    const remember = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_LOGIN);
    return remember === 'true';
  } catch (error) {
    console.error('Error getting remember login preference:', error);
    return true; // Default to true
  }
};