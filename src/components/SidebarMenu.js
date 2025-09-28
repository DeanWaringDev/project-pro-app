/**
 * SidebarMenu.js - Animated Sidebar Navigation Component
 * 
 * A slide-out navigation menu with smooth animations and theme support.
 * 
 * Features:
 * - Smooth slide-in/slide-out animations
 * - Theme switching (dark/light mode)
 * - User profile display
 * - Navigation to all main screens
 * - Sign out functionality with cleanup
 * - Responsive design for different screen sizes
 * 
 * Props:
 * @param {boolean} visible - Controls sidebar visibility
 * @param {function} onClose - Callback to close the sidebar
 * @param {function} onNavigate - Callback for navigation with screen parameter
 * @param {string} currentTheme - Current theme ('dark' or 'light')
 * @param {function} onThemeToggle - Callback to toggle theme
 * @param {object} user - Current user object with profile information
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  Animated,
  Easing,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { clearAuthState } from '../utils/authStorage';

export default function SidebarMenu({ 
  visible, 
  onClose, 
  onNavigate,
  currentTheme = 'dark',
  onThemeToggle = () => {},
  user = null
}) {
  const isDark = currentTheme === 'dark';
  const slideAnim = useRef(new Animated.Value(320)).current; // Start off-screen

  /**
   * Handle sidebar slide animations
   */

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 320,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleNavigation = (screen) => {
    let target = screen;
    if (screen === 'projects' || screen === 'home') target = 'Projects';
    if (screen === 'calendar') target = 'Calendar';
    if (screen === 'profile') target = 'Profile';
    if (screen === 'settings') target = 'Settings';
    onClose();
    if (onNavigate) onNavigate(target);
  };

  const handleSignOut = async () => {
    try {
      onClose();
      await clearAuthState();
      await signOut(auth);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleThemeToggle = () => {
    if (onThemeToggle) onThemeToggle();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayBackground}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.sidebar,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.appName, isDark ? styles.textDark : styles.textLight]}>
              Project Pro
            </Text>
          </View>

          <View style={styles.navigation}>
            <TouchableOpacity
              style={[styles.navItem, isDark ? styles.navItemDark : styles.navItemLight]}
              onPress={() => handleNavigation('projects')}
            >
              <Ionicons name="home-outline" size={24} color={isDark ? "#3b82f6" : "#2563eb"} />
              <Text style={[styles.navText, isDark ? styles.textDark : styles.textLight]}>Home</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.navItem, isDark ? styles.navItemDark : styles.navItemLight]}
              onPress={() => handleNavigation('calendar')}
            >
              <Ionicons name="calendar-outline" size={24} color={isDark ? "#10b981" : "#059669"} />
              <Text style={[styles.navText, isDark ? styles.textDark : styles.textLight]}>Calendar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.navItem, isDark ? styles.navItemDark : styles.navItemLight]}
              onPress={() => handleNavigation('profile')}
            >
              <Ionicons name="person-outline" size={24} color={isDark ? "#f59e0b" : "#d97706"} />
              <Text style={[styles.navText, isDark ? styles.textDark : styles.textLight]}>Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.navItem, isDark ? styles.navItemDark : styles.navItemLight]}
              onPress={() => handleNavigation('settings')}
            >
              <Ionicons name="settings-outline" size={24} color={isDark ? "#8b5cf6" : "#7c3aed"} />
              <Text style={[styles.navText, isDark ? styles.textDark : styles.textLight]}>Settings</Text>
            </TouchableOpacity>
          </View>

          {/* Footer with Theme Toggle and Sign Out side by side */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.signOutButton, isDark ? styles.signOutButtonDark : styles.signOutButtonLight]}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: 300,
    height: '100%',
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
    marginBottom: 32,
  },
  logoContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  logo: {
    width: 160,
    height: 160,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  textDark: {
    color: '#ffffff',
  },
  textLight: {
    color: '#1f2937',
  },
  navigation: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  navItemDark: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  navItemLight: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
  },
  navText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
    color: '#ffffff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40, // Extra padding to avoid Android navigation
    gap: 12,
  },
  themeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  themeButtonDark: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  themeButtonLight: {
    backgroundColor: 'rgba(100, 116, 139, 0.05)',
    borderColor: 'rgba(100, 116, 139, 0.1)',
  },
  signOutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  signOutButtonDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  signOutButtonLight: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
});
