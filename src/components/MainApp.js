/**
 * MainApp.js - Main Application Container After Authentication
 *
 * This component renders the main app interface after user authentication.
 * It serves as the container for the authenticated user experience.
 */

import React from 'react';
import ProjectsScreen from '../screens/ProjectsScreen';

export default function MainApp({ user }) {
  // For now, just render the ProjectsScreen
  // Later this could include navigation, tabs, etc.
  return <ProjectsScreen user={user} />;
}