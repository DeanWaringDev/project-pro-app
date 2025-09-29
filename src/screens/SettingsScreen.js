
/**
 * SettingsScreen.js - Application Settings and Configuration Screen
 * 
 * This screen provides access to application settings and user preferences:
 * - Theme preferences (dark/light mode)
 * - Notification settings
 * - Data management options
 * - Privacy settings
 * - App version information
 * - Help and support links
 * 
 * Features:
 * - Theme toggle functionality
 * - Notification preferences management
 * - Data export/import options
 * - Privacy controls
 * - About section with app information
 * - Help and feedback options
 * 
 * TODO: Implement full settings functionality
 * - Add theme toggle with context
 * - Implement notification preferences
 * - Add data management options
 * - Include privacy settings
 * - Add app information and version
 * 
 * @param {Object} navigation - React Navigation object for screen navigation
 * @param {Function} openSidebar - Function to open the sidebar menu
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Header from '../components/Header';

const SettingsScreen = ({ navigation, openSidebar }) => {
  return (
    <View style={styles.container}>
      <Header title="Settings" onMenuPress={openSidebar} navigation={navigation} />
      <Text style={styles.text}>Settings</Text>
      
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Profile Settings</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Change Password</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Notifications</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Language</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Help & FAQ</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Contact Support</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    // Remove padding to allow header to stretch edge-to-edge
  },
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
    marginBottom: 0,
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
  text: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  settingsSection: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#f97316',
    fontWeight: '600',
    marginBottom: 16,
    paddingLeft: 4,
  },
  settingItem: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  settingText: {
    fontSize: 16,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  settingArrow: {
    fontSize: 20,
    color: '#64748b',
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
