/**
 * AddProjectScreen.js - Create New Project Screen
 * 
 * FIXED VERSION - Properly handles success callback and auto-close
 * 
 * Key Fixes:
 * 1. Auto-closes modal after successful project creation
 * 2. Calls success callback to trigger parent refresh
 * 3. Better error handling and user feedback
 * 4. Enhanced web compatibility
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { 
  collection, 
  addDoc, 
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { auth, db, storage } from '../config/firebase';

export default function AddProjectScreen({ onClose, onSuccess }) {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(null);
  const [priority, setPriority] = useState('medium');
  const [selectedImage, setSelectedImage] = useState(null);
  
  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = auth.currentUser;
  const screenWidth = Dimensions.get('window').width;
  const isWeb = Platform.OS === 'web';

  /**
   * Priority options with colors and icons (matching EditTaskScreen)
   */
  const priorities = [
    { key: 'low', label: 'Low Priority', color: '#10b981', icon: 'arrow-down' },
    { key: 'medium', label: 'Medium Priority', color: '#f59e0b', icon: 'remove' },
    { key: 'urgent', label: 'Urgent', color: '#ef4444', icon: 'arrow-up' },
  ];

  /**
   * Handle image selection from device gallery
   */
  const pickImage = async () => {
    try {
      console.log('Requesting media library permissions...');
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        const message = 'Please grant camera roll permissions to upload project images.';
        if (isWeb) {
          alert(message);
        } else {
          Alert.alert('Permission Required', message);
        }
        return;
      }

      console.log('Launching image picker...');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedAsset = result.assets[0];
        console.log('Image selected:', selectedAsset.uri);
        
        if (selectedAsset.fileSize && selectedAsset.fileSize > 5 * 1024 * 1024) {
          const message = 'Please select an image smaller than 5MB.';
          if (isWeb) {
            alert(message);
          } else {
            Alert.alert('Image Too Large', message);
          }
          return;
        }
        
        setSelectedImage(selectedAsset);
      } else {
        console.log('Image selection cancelled or failed');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      const message = 'Failed to pick image. Please try again.';
      if (isWeb) {
        alert(message);
      } else {
        Alert.alert('Image Selection Error', message);
      }
    }
  };

  /**
   * Upload selected image to Firebase Storage
   */
  const uploadImage = async (imageAsset) => {
    if (!imageAsset || !currentUser) return null;

    try {
      console.log('Starting image upload...');
      
      const filename = `projects/${currentUser.uid}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      
      const response = await fetch(imageAsset.uri);
      const blob = await response.blob();

      console.log('Image blob created, uploading to:', filename);

      const imageRef = ref(storage, filename);
      await uploadBytes(imageRef, blob);

      const downloadURL = await getDownloadURL(imageRef);
      console.log('Image uploaded successfully:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  };

  /**
   * Validate form inputs before submission
   */
  const validateForm = () => {
    if (!title.trim()) {
      const message = 'Project title is required.';
      if (isWeb) {
        alert(message);
      } else {
        Alert.alert('Validation Error', message);
      }
      return false;
    }

    if (title.trim().length < 3) {
      const message = 'Project title must be at least 3 characters long.';
      if (isWeb) {
        alert(message);
      } else {
        Alert.alert('Validation Error', message);
      }
      return false;
    }

    if (title.trim().length > 50) {
      const message = 'Project title must be less than 50 characters.';
      if (isWeb) {
        alert(message);
      } else {
        Alert.alert('Validation Error', message);
      }
      return false;
    }

    if (description.length > 200) {
      const message = 'Project description must be less than 200 characters.';
      if (isWeb) {
        alert(message);
      } else {
        Alert.alert('Validation Error', message);
      }
      return false;
    }

    // Check if deadline is before today (but allow today)
    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (deadline && deadline < todayDateOnly) {
      const message = 'Project deadline must be today or in the future.';
      if (isWeb) {
        alert(message);
      } else {
        Alert.alert('Validation Error', message);
      }
      return false;
    }

    return true;
  };

  /**
   * Handle project creation and save to Firestore
   * Enhanced with proper success callback
   */
  const handleCreateProject = async () => {
    console.log('Starting project creation process...');
    
    if (!validateForm()) return;
    
    if (!currentUser) {
      const message = 'You must be logged in to create projects.';
      if (isWeb) {
        alert(message);
      } else {
        Alert.alert('Authentication Error', message);
      }
      return;
    }

    setIsLoading(true);

    try {
      console.log('Creating project with data:', {
        title: title.trim(),
        description: description.trim(),
        priority,
        deadline: deadline ? deadline.toDateString() : 'None',
        hasImage: !!selectedImage,
        userId: currentUser.uid
      });

      // Upload image if selected
      let imageUrl = null;
      if (selectedImage) {
        console.log('Uploading project image...');
        imageUrl = await uploadImage(selectedImage);
      }

      // Prepare deadline timestamp
      let deadlineTimestamp = null;
      if (deadline) {
        deadlineTimestamp = Timestamp.fromDate(deadline);
      }

      // Prepare project data for Firestore
      const projectData = {
        userId: currentUser.uid,
        title: title.trim(),
        description: description.trim(),
        deadline: deadlineTimestamp,
        priority: priority,
        imageUrl: imageUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log('Saving project to Firestore...');
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'projects'), projectData);
      console.log('Project created successfully with ID:', docRef.id);

      // Show success message and close screen
      const successMessage = `Project "${title.trim()}" has been created successfully.`;
      
      if (isWeb) {
        alert(successMessage);
        // For web, close immediately after showing success
        if (onSuccess) {
          onSuccess();
        } else {
          onClose();
        }
      } else {
        Alert.alert(
          'Success!', 
          successMessage,
          [{
            text: 'OK', 
            onPress: () => {
              if (onSuccess) {
                onSuccess();
              } else {
                onClose();
              }
            }
          }]
        );
      }

    } catch (error) {
      console.error('Error creating project:', error);
      
      let errorMessage = 'Failed to create project. Please try again.';
      
      if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'You do not have permission to create projects. Please sign in again.';
      }
      
      if (isWeb) {
        alert(errorMessage);
      } else {
        Alert.alert('Creation Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={onClose}
          style={styles.headerButton}
          accessibilityLabel="Cancel adding project"
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Add Project</Text>
        
        <TouchableOpacity 
          onPress={handleCreateProject}
          style={[styles.headerButton, styles.saveButton]}
          disabled={isLoading || !title.trim()}
          accessibilityLabel="Save project"
        >
          <Text style={[
            styles.saveButtonText,
            (!title.trim() || isLoading) && styles.saveButtonTextDisabled
          ]}>
            {isLoading ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContainer,
            isWeb && screenWidth > 768 && styles.scrollContainerWeb
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            {/* Image Upload Section */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Project Image (Optional)</Text>
              
              <TouchableOpacity
                onPress={pickImage}
                style={[
                  styles.imageUpload,
                  isWeb && screenWidth > 768 && styles.imageUploadWeb
                ]}
              >
                {selectedImage ? (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: selectedImage.uri }}
                      style={styles.selectedImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.imageChangeText}>
                      Tap to change image
                    </Text>
                  </View>
                ) : (
                  <View style={styles.imageUploadEmpty}>
                    <Ionicons name="image-outline" size={48} color="#64748b" />
                    <Text style={styles.imageUploadText}>Add Project Image</Text>
                    <Text style={styles.imageUploadSubtext}>
                      Tap to select from gallery
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Project Title */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Project Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter project title"
                placeholderTextColor="#9ca3af"
                value={title}
                onChangeText={setTitle}
                maxLength={50}
                returnKeyType="next"
              />
              <Text style={styles.characterCount}>
                {title.length}/50 characters
              </Text>
            </View>

            {/* Project Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your project (optional)"
                placeholderTextColor="#9ca3af"
                value={description}
                onChangeText={setDescription}
                multiline={true}
                numberOfLines={4}
                maxLength={200}
                textAlignVertical="top"
                returnKeyType="done"
              />
              <Text style={styles.characterCount}>
                {description.length}/200 characters
              </Text>
            </View>

            {/* Priority Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Priority Level</Text>
              <View style={styles.priorityContainer}>
                {priorities.map((priorityOption) => (
                  <TouchableOpacity
                    key={priorityOption.key}
                    style={[
                      styles.priorityOption,
                      priority === priorityOption.key && styles.priorityOptionSelected,
                      { borderColor: priorityOption.color }
                    ]}
                    onPress={() => setPriority(priorityOption.key)}
                    accessibilityLabel={`Select ${priorityOption.label}`}
                  >
                    <Ionicons 
                      name={priorityOption.icon} 
                      size={16} 
                      color={priority === priorityOption.key ? 'white' : priorityOption.color} 
                    />
                    <Text style={[
                      styles.priorityText,
                      priority === priorityOption.key && styles.priorityTextSelected
                    ]}>
                      {priorityOption.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Deadline Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Deadline (Optional)</Text>
              
              {deadline ? (
                <View style={styles.deadlineDisplay}>
                  <View style={styles.deadlineInfo}>
                    <Ionicons name="calendar-outline" size={20} color="#6366f1" />
                    <Text style={styles.deadlineText}>
                      {deadline.toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.deadlineButtons}>
                    <TouchableOpacity 
                      onPress={() => setShowDatePicker(true)}
                      style={styles.editDeadlineButton}
                      accessibilityLabel="Change deadline date"
                    >
                      <Ionicons name="pencil" size={12} color="white" />
                      <Text style={styles.deadlineButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setDeadline(null)}
                      style={styles.clearDeadlineButton}
                      accessibilityLabel="Remove deadline"
                    >
                      <Ionicons name="trash" size={12} color="white" />
                      <Text style={styles.deadlineButtonText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.addDeadlineButton}
                  onPress={() => setShowDatePicker(true)}
                  accessibilityLabel="Add deadline date"
                >
                  <Ionicons name="calendar-outline" size={20} color="#6366f1" />
                  <Text style={styles.addDeadlineText}>Set Deadline</Text>
                </TouchableOpacity>
              )}

              {/* Date Picker */}
              {showDatePicker && (
                <DateTimePicker
                  value={deadline || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setDeadline(selectedDate);
                    }
                  }}
                  minimumDate={new Date()}
                />
              )}
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: '#374151',
    borderBottomWidth: 1,
    borderBottomColor: '#4b5563',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButtonTextDisabled: {
    opacity: 0.5,
  },
  placeholder: {
    width: 32,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  scrollContainerWeb: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  form: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  textArea: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: '#4b5563',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  description: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 6,
    lineHeight: 20,
  },
  datePickerButton: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4b5563',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePickerText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 12,
  },
  calendarContainer: {
    marginTop: 12,
    backgroundColor: '#374151',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4b5563',
    padding: 16,
  },
  calendarContainerWeb: {
    maxWidth: 400,
    alignSelf: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 4,
  },
  calendarTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  calendarDayLabels: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarDayLabel: {
    flex: 1,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 4,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderRadius: 20,
  },
  calendarToday: {
    backgroundColor: '#3b82f6',
  },
  calendarSelected: {
    backgroundColor: '#10b981',
  },
  calendarPast: {
    opacity: 0.3,
  },
  calendarDayText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  calendarTodayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  calendarSelectedText: {
    color: 'white',
    fontWeight: 'bold',
  },
  calendarPastText: {
    color: '#64748b',
  },
  calendarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  calendarClearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#374151',
    borderRadius: 6,
  },
  calendarClearText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  calendarCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  calendarCancelText: {
    color: 'white',
    fontWeight: '600',
  },
  imageUpload: {
    backgroundColor: '#374151',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#4b5563',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  imageUploadWeb: {
    maxWidth: 300,
    alignSelf: 'center',
  },
  imageUploadEmpty: {
    alignItems: 'center',
  },
  imageUploadText: {
    color: '#64748b',
    fontSize: 18,
    marginTop: 8,
  },
  imageUploadSubtext: {
    color: '#475569',
    fontSize: 14,
    marginTop: 4,
  },
  imageContainer: {
    alignItems: 'center',
  },
  selectedImage: {
    width: 96,
    height: 96,
    borderRadius: 8,
    marginBottom: 12,
  },
  imageChangeText: {
    color: '#3b82f6',
    fontSize: 14,
  },
  priorityContainer: {
    gap: 12,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#374151',
  },
  priorityOptionSelected: {
    backgroundColor: '#6366f1',
  },
  priorityText: {
    marginLeft: 12,
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  priorityTextSelected: {
    color: 'white',
  },
  deadlineDisplay: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  deadlineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deadlineText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  deadlineButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editDeadlineButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearDeadlineButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deadlineButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  addDeadlineButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4b5563',
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addDeadlineText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    padding: 16,
    paddingBottom: Platform.OS === 'android' ? 48 : 16, // Increase from 32 to 48 on Android
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#334155',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});