/**
 * App.js - Main Application Entry Point
 * 
 * This is the root component of the Project Pro application.
 * It handles:
 * - Firebase authentication state management
 * - Conditional rendering between AuthScreen and MainApp
 * - Loading states during authentication checks
 * - User session persistence
 */

import React from 'react';
import AppNavigator from './AppNavigator';

export default function App() {
  return <AppNavigator />;
}