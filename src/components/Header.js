/**
 * Header.js - Reusable Header Component
 * 
 * A consistent header component used across all screens.
 * 
 * Features:
 * - Logo that navigates to home/projects screen
 * - Dynamic title display
 * - Menu button for sidebar navigation
 * - Accessibility support
 * - Responsive design for web and mobile
 * 
 * Props:
 * @param {string} title - The title to display in the header
 * @param {function} onMenuPress - Callback function when menu button is pressed
 * @param {object} navigation - React Navigation object for screen navigation
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Header({ title, onMenuPress, navigation }) {
  /**
   * Handle logo press - navigate to Projects screen (home)
   */
  const handleLogoPress = () => {
    if (navigation) {
      navigation.navigate('Projects');
    }
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.logoContainer}
        onPress={handleLogoPress}
        accessibilityLabel="Go to home"
      >
        <Image
          source={require('../../assets/logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity
        onPress={onMenuPress}
        style={styles.menuButton}
        accessibilityLabel="Open menu"
      >
        <Ionicons name="menu-outline" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  logoContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#dbeafe',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    width: 44,
    height: 44,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f97316',
    textShadow: '0 2px 4px rgba(249, 115, 22, 0.3)',
  },
  menuButton: {
    padding: 8,
  },
});
