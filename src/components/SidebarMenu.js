import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  Platform,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function SidebarMenu({ 
  visible, 
  onClose, 
  onNavigate,
  currentTheme = 'dark',
  onThemeToggle,
  user 
}) {
  const isDark = currentTheme === 'dark';
  const slideAnim = useRef(new Animated.Value(320)).current;

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
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleNavigation = (screen) => {
    // Map sidebar keys to stack screen names (case-sensitive)
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
      await signOut(auth);
    } catch (error) {
      // log error
    }
  };

  const handleThemeToggle = () => {
    if (onThemeToggle) onThemeToggle();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayBackground} 
          onPress={onClose}
          activeOpacity={1}
        />
        <Animated.View style={[
          styles.sidebar,
          isDark ? styles.sidebarDark : styles.sidebarLight,
          { transform: [{ translateX: slideAnim }] },
        ]}>
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: '#dbeafe' }]}> {/* Match AuthScreen header */}
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[
              styles.appName,
              isDark ? styles.textDark : styles.textLight
            ]}>
              Project Pro
            </Text>
          </View>
          <View style={styles.navigation}>
            <TouchableOpacity
              style={[
                styles.navItem,
                isDark ? styles.navItemDark : styles.navItemLight
              ]}
              onPress={() => handleNavigation('projects')}
            >
              <Ionicons name="home-outline" size={24} color={isDark ? "#3b82f6" : "#2563eb"} />
              <Text style={[styles.navText, isDark ? styles.textDark : styles.textLight]}>Home</Text>
              <Ionicons name="chevron-forward" size={20} color={isDark ? "#64748b" : "#9ca3af"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.navItem,
                isDark ? styles.navItemDark : styles.navItemLight
              ]}
              onPress={() => handleNavigation('calendar')}
            >
              <Ionicons name="calendar-outline" size={24} color={isDark ? "#10b981" : "#059669"} />
              <Text style={[styles.navText, isDark ? styles.textDark : styles.textLight]}>Calendar</Text>
              <Ionicons name="chevron-forward" size={20} color={isDark ? "#64748b" : "#9ca3af"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.navItem,
                isDark ? styles.navItemDark : styles.navItemLight
              ]}
              onPress={() => handleNavigation('profile')}
            >
              <Ionicons name="person-outline" size={24} color={isDark ? "#f59e0b" : "#d97706"} />
              <Text style={[styles.navText, isDark ? styles.textDark : styles.textLight]}>Profile</Text>
              <Ionicons name="chevron-forward" size={20} color={isDark ? "#64748b" : "#9ca3af"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.navItem,
                isDark ? styles.navItemDark : styles.navItemLight
              ]}
              onPress={() => handleNavigation('settings')}
            >
              <Ionicons name="settings-outline" size={24} color={isDark ? "#8b5cf6" : "#7c3aed"} />
              <Text style={[styles.navText, isDark ? styles.textDark : styles.textLight]}>Settings</Text>
              <Ionicons name="chevron-forward" size={20} color={isDark ? "#64748b" : "#9ca3af"} />
            </TouchableOpacity>
          </View>
          <View style={styles.themeSection}>
            <View style={[styles.themeItem, isDark ? styles.navItemDark : styles.navItemLight]}>
              <Ionicons name={isDark ? "moon-outline" : "sunny-outline"} size={24} color={isDark ? "#64748b" : "#9ca3af"} />
              <Text style={[styles.navText, isDark ? styles.textDark : styles.textLight]}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
              <TouchableOpacity
                style={[styles.themeToggle, isDark ? styles.themeToggleDark : styles.themeToggleLight]}
                onPress={handleThemeToggle}
              >
                <View style={[styles.themeToggleThumb, isDark ? styles.themeToggleThumbDark : styles.themeToggleThumbLight]} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.signOutButton, isDark ? styles.signOutButtonDark : styles.signOutButtonLight]}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={24} color="#ef4444" />
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
    zIndex: 10,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    backgroundColor: '#1e293b',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
    marginBottom: 32,
  },
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 0,
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
  },
  themeSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  themeToggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  themeToggleDark: {
    backgroundColor: '#3b82f6',
    alignItems: 'flex-end',
  },
  themeToggleLight: {
    backgroundColor: '#d1d5db',
    alignItems: 'flex-start',
  },
  themeToggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  themeToggleThumbDark: {
    backgroundColor: '#ffffff',
  },
  themeToggleThumbLight: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 12,
  },
});
