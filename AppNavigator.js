import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthScreen from './src/screens/AuthScreen';
import ProjectsScreen from './src/screens/ProjectsScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SidebarMenu from './src/components/SidebarMenu';
import { auth } from './src/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();
export const navigationRef = createNavigationContainerRef();

export default function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showSidebar, setShowSidebar] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });
    return unsubscribe;
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
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
          onNavigate={screen => {
            setShowSidebar(false);
            if (navigationRef.isReady()) {
              // Map sidebar keys to stack screen names
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
