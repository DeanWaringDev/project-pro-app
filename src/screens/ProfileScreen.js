
/**
 * ProfileScreen.js - User Profile Display and Management Screen
 * 
 * This screen displays and manages user profile information including:
 * - User account details
 * - Profile picture management  
 * - Personal preferences
 * - Account settings
 * - User statistics (projects created, tasks completed, etc.)
 * 
 * Features:
 * - Profile picture upload/change
 * - Editable user information
 * - Account preferences
 * - User activity statistics
 * - Sign out functionality
 * 
 * TODO: Implement full profile functionality
 * - Connect to user authentication data
 * - Add profile picture management
 * - Include user statistics from Firestore
 * - Add edit profile functionality
 * 
 * @param {Object} navigation - React Navigation object for screen navigation
 * @param {Function} openSidebar - Function to open the sidebar menu
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { auth } from '../config/firebase';
import Header from '../components/Header';

const ProfileScreen = ({ navigation, openSidebar }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <Header title="Profile" onMenuPress={openSidebar} navigation={navigation} />
      
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Image 
            source={user?.photoURL ? { uri: user.photoURL } : require('../../assets/logo.png')}
            style={styles.avatar}
          />
        </View>
        
        <Text style={styles.displayName}>{user?.displayName || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Member Since:</Text>
          <Text style={styles.infoValue}>{formatDate(user?.metadata?.creationTime)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Sign In:</Text>
          <Text style={styles.infoValue}>{formatDate(user?.metadata?.lastSignInTime)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email Verified:</Text>
          <Text style={[styles.infoValue, user?.emailVerified ? styles.verified : styles.unverified]}>
            {user?.emailVerified ? 'Yes' : 'No'}
          </Text>
        </View>
      </View>

      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Change Password</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Privacy Settings</Text>
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
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    marginTop: 24,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#f97316',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoLabel: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '400',
    flex: 1,
    textAlign: 'right',
  },
  verified: {
    color: '#10b981',
  },
  unverified: {
    color: '#f59e0b',
  },
  actionsSection: {
    paddingHorizontal: 20,
  },
  actionButton: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#f97316',
    fontWeight: '600',
  },
});

export default ProfileScreen;
