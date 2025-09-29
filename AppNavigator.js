/**
 * AppNavigator.js - Main Navigation and Authentication Controller
 * 
 * This component serves as the central navigation hub and authentication state manager.
 * 
 * Key Features:
 * - Firebase authentication state management with persistence
 * - Navigation between authenticated and unauthenticated states
 * - Sidebar navigation integration
 * - Loading state management during auth initialization
 * - User session persistence across app restarts
 * 
 * Authentication Flow:
 * 1. Check for stored authentication state (offline persistence)
 * 2. Initialize Firebase auth state listener
 * 3. Restore user session if valid stored state exists
 * 4. Update UI based on authentication status
 */

import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, Text } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';

// Screens
import AuthScreen from './src/screens/AuthScreen';
import ProjectsScreen from './src/screens/ProjectsScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Components
import SidebarMenu from './src/components/SidebarMenu';

// Configuration & Utils
import { auth } from './src/config/firebase';
import { storeAuthState, clearAuthState, getStoredAuthState } from './src/utils/authStorage';

const Stack = createNativeStackNavigator();
export const navigationRef = createNavigationContainerRef();

export default function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showSidebar, setShowSidebar] = React.useState(false);
  const [user, setUser] = React.useState(null);

  // Enhanced authentication state management with persistence
  React.useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Check if user was previously authenticated
        const storedAuth = await getStoredAuthState();
        
        if (storedAuth.isAuthenticated && storedAuth.userPreferences && isMounted) {
          console.log('Found stored authentication for user:', storedAuth.userPreferences.email);
          // Temporarily set user as authenticated based on stored data
          setIsAuthenticated(true);
          setUser({
            uid: storedAuth.userId,
            email: storedAuth.userPreferences.email,
            displayName: storedAuth.userPreferences.displayName,
            photoURL: storedAuth.userPreferences.photoURL
          });
          console.log('Restored user from storage, waiting for Firebase confirmation...');
        }

        // Set up Firebase auth state listener
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (!isMounted) return;

          if (user) {
            // User is confirmed by Firebase - update with fresh data
            console.log('Firebase confirmed authentication for:', user.email);
            setUser(user);
            setIsAuthenticated(true);
            // Update stored auth state with fresh data
            await storeAuthState(user, 'email');
          } else {
            // No Firebase user - check if we had stored data
            const currentStoredAuth = await getStoredAuthState();
            if (currentStoredAuth.isAuthenticated) {
              console.log('Firebase session expired, but user was stored. Clearing stored state.');
              await clearAuthState();
            }
            // Clear authentication state
            setUser(null);
            setIsAuthenticated(false);
            console.log('User signed out or session expired');
          }
          setIsLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) {
          setIsLoading(false);
          setIsAuthenticated(false);
        }
      }
    };

    const unsubscribePromise = initializeAuth();

    return () => {
      isMounted = false;
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, []);

  // Sidebar navigation handler
  const handleSidebarNavigation = (screen, navigation) => {
    setShowSidebar(false);
    if (!navigation) return;
    switch (screen) {
      case 'home':
      case 'projects':
        navigation.navigate('Projects');
        break;
      case 'calendar':
        navigation.navigate('Calendar');
        break;
      case 'profile':
        navigation.navigate('Profile');
        break;
      case 'settings':
        navigation.navigate('Settings');
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#0f172a' 
      }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ 
          color: '#94a3b8', 
          marginTop: 16, 
          fontSize: 16 
        }}>
          Checking authentication...
        </Text>
      </View>
    );
  }

  // Render SidebarMenu once at the top level, pass openSidebar to all screens
  return (
    <NavigationContainer ref={navigationRef}>
      <>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            <>
              <Stack.Screen name="Projects">
                {props => (
                  <ProjectsScreen
                    {...props}
                    openSidebar={() => setShowSidebar(true)}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Calendar">
                {props => (
                  <CalendarScreen
                    {...props}
                    openSidebar={() => setShowSidebar(true)}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Analytics">
                {props => (
                  <AnalyticsScreen
                    {...props}
                    openSidebar={() => setShowSidebar(true)}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Profile">
                {props => (
                  <ProfileScreen
                    {...props}
                    openSidebar={() => setShowSidebar(true)}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Settings">
                {props => (
                  <SettingsScreen
                    {...props}
                    openSidebar={() => setShowSidebar(true)}
                  />
                )}
              </Stack.Screen>
            </>
          ) : (
            <Stack.Screen name="Auth" component={AuthScreen} />
          )}
        </Stack.Navigator>
        <SidebarMenu
          visible={showSidebar}
          onClose={() => setShowSidebar(false)}
          currentTheme="dark"
          user={user}
          onThemeToggle={() => {
            console.log('Theme toggle pressed');
          }}
          onNavigate={screen => {
            setShowSidebar(false);
            if (navigationRef.isReady()) {
              let target = screen;
              if (screen === 'home') target = 'Projects';
              navigationRef.navigate(target);
            }
          }}
        />
      </>
    </NavigationContainer>
  );
}
