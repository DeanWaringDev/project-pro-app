
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../components/Header';


const SettingsScreen = ({ navigation, openSidebar }) => {
  return (
    <View style={styles.container}>
      <Header title="Settings" onMenuPress={openSidebar} navigation={navigation} />
      <Text style={styles.text}>This is the Settings screen. Add your settings options here.</Text>
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
});

export default SettingsScreen;
