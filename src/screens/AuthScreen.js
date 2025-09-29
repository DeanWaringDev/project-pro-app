/**
 * AuthScreen.js - User Authentication Screen
 * 
 * This screen handles both user login and registration with the following features:
 * - Email/password authentication
 * - Form validation
 * - Toggle between sign-in and sign-up modes
 * - Password visibility toggle
 * - Comprehensive error handling
 * - Loading states during authentication
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function AuthScreen() {
  // Form mode state - toggles between sign-in and sign-up
  const [isSignUp, setIsSignUp] = useState(false);

  // Form input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Configure Google Sign-In on component mount
   */
  useEffect(() => {
    const configureGoogleSignIn = async () => {
      try {
        if (Platform.OS !== 'web') {
          // Configure Google Sign-In for mobile
          await GoogleSignin.configure({
            webClientId: '1006772650440-kreg1u5jppnllu8e0ae37blpnn5iihfu.apps.googleusercontent.com', // Web client for local debug builds
          });
        } else {
          // Handle redirect result for web
          try {
            const result = await getRedirectResult(auth);
            if (result?.user) {
              console.log('Google Sign-In redirect successful:', result.user.email);
              Alert.alert('Success', `Welcome, ${result.user.displayName || result.user.email}!`);
            }
          } catch (error) {
            if (error.code && error.code !== 'auth/null-user') {
              console.error('Google Sign-In redirect error:', error);
              Alert.alert('Google Sign-In Error', 'Sign-in failed. Please try again.');
            }
          }
        }
      } catch (error) {
        console.error('Google Sign-In configuration error:', error);
      }
    };

    configureGoogleSignIn();
  }, []);

  /**
   * Validate form inputs before submission
   * @returns {boolean} - True if form is valid, false otherwise
   */
  const validateForm = () => {
    // Check for empty fields
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return false;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return false;
    }

    // Password length validation
    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long.');
      return false;
    }
    
    // Password confirmation validation (only for sign-up)
    if (isSignUp && password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return false;
    }

    return true;
  };

  /**
   * Handle authentication (both sign-in and sign-up)
   */
  const handleAuth = async () => {
    console.log(`Attempting ${isSignUp ? 'sign-up' : 'sign-in'} for:`, email);
    
    // Validate form first
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // Create new user account
        console.log('Creating new user account...');
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
        console.log('User account created successfully:', userCredential.user.email);
        Alert.alert('Success', 'Account created successfully!');
      } else {
        // Sign in existing user
        console.log('Signing in existing user...');
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
        console.log('User signed in successfully:', userCredential.user.email);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      
      // Handle specific Firebase authentication errors
      let errorMessage = 'An error occurred. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address. Please check your email or sign up for a new account.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists. Try signing in instead.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please use at least 6 characters.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        default:
          errorMessage = error.message;
      }
      
      Alert.alert('Authentication Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Google Sign-In
   */
  const handleGoogleSignIn = async () => {
    console.log('Attempting Google Sign-In...');
    console.log('Platform:', Platform.OS);
    setIsLoading(true);

    try {
      if (Platform.OS === 'web') {
        // Web platform - use Firebase popup
        googleProvider.setCustomParameters({
          prompt: 'select_account'
        });

        try {
          const result = await signInWithPopup(auth, googleProvider);
          if (result?.user) {
            console.log('Google Sign-In successful:', result.user.email);
            Alert.alert('Success', `Welcome, ${result.user.displayName || result.user.email}!`);
          }
        } catch (popupError) {
          if (popupError.code === 'auth/popup-blocked') {
            await signInWithRedirect(auth, googleProvider);
            return;
          }
          throw popupError;
        }
      } else {
        // Mobile platform - use react-native-google-signin
        console.log('Checking Google Play Services...');
        await GoogleSignin.hasPlayServices();
        console.log('Google Play Services available');

        console.log('Initiating Google Sign-In...');
        const userInfo = await GoogleSignin.signIn();
        console.log('Google Sign-In userInfo:', userInfo);
        console.log('Google Sign-In userInfo.data:', userInfo.data);
        
        // Extract tokens from the correct location - explicitly from userInfo.data
        const idToken = userInfo.data?.idToken || userInfo.idToken;
        const accessToken = userInfo.data?.accessToken || userInfo.accessToken;
        console.log('Got tokens - idToken length:', idToken?.length, 'accessToken length:', accessToken?.length);
        
        if (!idToken) {
          throw new Error('No ID token received from Google Sign-In');
        }
        
        // Get the Google credential using both idToken and accessToken
        const googleCredential = GoogleAuthProvider.credential(idToken, accessToken);
        console.log('Created Google credential');
        
        // Sign in with Firebase using the credential
        const result = await signInWithCredential(auth, googleCredential);
        console.log('Firebase signInWithCredential result:', result?.user?.email);

        if (result?.user) {
          console.log('Google Sign-In successful:', result.user.email);
          Alert.alert('Success', `Welcome, ${result.user.displayName || result.user.email}!`);
        }
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);

      let errorMessage = 'Google Sign-In failed. Please try again.';

      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-in was cancelled. Please try again.';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Popup was blocked by browser. Please allow popups and try again.';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'An account already exists with this email using a different sign-in method.';
          break;
        case 'auth/cancelled-popup-request':
        case 'SIGN_IN_CANCELLED':
          // Don't show error for cancellation
          return;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'DEVELOPER_ERROR':
          errorMessage = 'Google Sign-In configuration error. Please check:\n1. Package name matches Google Console\n2. Certificate fingerprint is correct\n3. Web Client ID is valid';
          break;
        case 'PLAY_SERVICES_NOT_AVAILABLE':
          errorMessage = 'Google Play Services not available. Please update Google Play Services.';
          break;
        default:
          errorMessage = error.message || 'Google Sign-In failed. Please try again.';
      }

      Alert.alert('Google Sign-In Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear form when switching between sign-in and sign-up
   */
  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    console.log(`Switched to ${!isSignUp ? 'sign-up' : 'sign-in'} mode`);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="light" />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          
          {/* App Header Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Project Pro</Text>
            <Text style={styles.subtitle}>
              Manage your projects with ease
            </Text>
          </View>

          {/* Authentication Form */}
          <View style={styles.form}>
            
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  textContentType={isSignUp ? "newPassword" : "password"}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input (only shown during sign-up) */}
            {isSignUp && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#9ca3af"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                />
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleAuth}
              style={[styles.authButton, isLoading && styles.authButtonDisabled]}
              disabled={isLoading}
              accessibilityLabel={isSignUp ? "Create account" : "Sign in"}
            >
              <Text style={styles.authButtonText}>
                {isLoading 
                  ? (isSignUp ? 'Creating Account...' : 'Signing In...') 
                  : (isSignUp ? 'Create Account' : 'Sign In')
                }
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-In Button */}
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
              disabled={isLoading}
              accessibilityLabel="Sign in with Google"
            >
              <Ionicons
                name="logo-google"
                size={20}
                color="#4285F4"
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            {/* Toggle between Sign In and Sign Up */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </Text>
              <TouchableOpacity 
                onPress={handleToggleMode}
                accessibilityLabel={isSignUp ? "Switch to sign in" : "Switch to sign up"}
              >
                <Text style={styles.toggleLink}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * Styles for the authentication screen
 * Uses a dark theme that matches the rest of the app
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Dark background
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 12, // Smaller space for Android navigation bar
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 12, // Smaller space for Android navigation bar
    // On web, limit max width for better desktop experience
    maxWidth: Platform.OS === 'web' ? 400 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24, // Reduced space below logo
  },
  logoContainer: {
    width: 110,
    height: 110,
    backgroundColor: '#dbeafe', // Much lighter blue
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 95,
    height: 95,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#94a3b8', // Muted text color
    textAlign: 'center',
  },
  form: {
    gap: 12, // Reduce vertical gap between form elements
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1e293b', // Dark input background
    color: 'white',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155', // Subtle border
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    backgroundColor: '#1e293b',
    color: 'white',
    padding: 16,
    paddingRight: 48, // Space for eye icon
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4, // Increase touch target
  },
  authButton: {
    backgroundColor: '#2563eb', // Blue button
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  authButtonDisabled: {
    opacity: 0.5,
  },
  authButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12, // Reduce divider margin
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerText: {
    color: '#94a3b8',
    fontSize: 14,
    marginHorizontal: 16,
  },
  googleButton: {
    backgroundColor: 'white',
    padding: 14, // Slightly smaller button
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8, // Reduce space below Google button
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  googleButtonDisabled: {
    opacity: 0.5,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8, // Move toggle closer to button
  },
  toggleText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  toggleLink: {
    color: '#f97316', // Orange accent color
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
});