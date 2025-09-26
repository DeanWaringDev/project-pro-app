/**
 * EditProjectScreen.js - Edit Existing Project Screen
 * 
 * FIXED VERSION - Properly handles success callback and auto-close
 * 
 * Key Fixes:
 * 1. Auto-closes modal after successful project update
 * 2. Calls success callback to trigger parent refresh
 * 3. Better error handling and user feedback
 * 4. Enhanced web compatibility
 */

import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { 
  doc,
  updateDoc,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';
import { auth, db, storage } from '../config/firebase';

export default function EditProjectScreen({ project, onClose, onSuccess }) {
  // Initialize state with existing project values
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Add missing state for date picker
  const [priority, setPriority] = useState('medium');
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  
  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = auth.currentUser;
  const screenWidth = Dimensions.get('window').width;
  const isWeb = Platform.OS === 'web';

  /**
   * Initialize form fields with existing project data
   */
  useEffect(() => {
    if (project) {
      console.log('Initializing edit form with project data:', {
        title: project.title,
        description: project.description,
        priority: project.priority,
        hasDeadline: !!project.deadline,
        hasImage: !!project.imageUrl
      });

      setTitle(project.title || '');
      setDescription(project.description || '');
      setPriority(project.priority || 'medium');
      setCurrentImageUrl(project.imageUrl || null);

      // Handle deadline initialization
      if (project.deadline) {
        try {
          const deadlineDate = project.deadline.toDate();
          setDeadline(deadlineDate);
          setCurrentMonth(deadlineDate); // Set calendar to deadline month
        } catch (error) {
          console.error('Error parsing deadline:', error);
          setDeadline(null);
        }
      } else {
        setDeadline(null);
      }
    }
  }, [project]);

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
      console.log('Requesting media library permissions for image replacement...');
      
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

      console.log('Launching image picker for project update...');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedAsset = result.assets[0];
        console.log('New image selected for project:', selectedAsset.uri);
        
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
      }
    } catch (error) {
      console.error('Error picking replacement image:', error);
      const message = 'Failed to pick image. Please try again.';
      if (isWeb) {
        alert(message);
      } else {
        Alert.alert('Image Selection Error', message);
      }
    }
  };

  /**
   * Upload new image to Firebase Storage
   */
  const uploadImage = async (imageAsset) => {
    if (!imageAsset || !currentUser) return null;

    try {
      console.log('Starting replacement image upload...');
      
      const filename = `projects/${currentUser.uid}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      
      const response = await fetch(imageAsset.uri);
      const blob = await response.blob();

      console.log('Uploading replacement image to:', filename);

      const imageRef = ref(storage, filename);
      await uploadBytes(imageRef, blob);

      const downloadURL = await getDownloadURL(imageRef);
      console.log('Replacement image uploaded successfully:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading replacement image:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  };

  /**
   * Delete old image from Firebase Storage
   */
  const deleteOldImage = async (imageUrl) => {
    if (!imageUrl) return;
    
    try {
      console.log('Attempting to delete old project image:', imageUrl);
      
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      
      console.log('Old project image deleted successfully');
    } catch (error) {
      console.error('Error deleting old project image:', error);
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
   * Handle project update and save to Firestore
   * Enhanced with proper success callback
   */
  const handleUpdateProject = async () => {
    console.log('Starting project update process...');
    
    if (!validateForm()) return;
    
    if (!currentUser || !project) {
      const message = 'Unable to update project. Please try again.';
      if (isWeb) {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
      return;
    }

    setIsLoading(true);

    try {
      console.log('Updating project with data:', {
        title: title.trim(),
        description: description.trim(),
        priority,
        deadline: deadline ? deadline.toDateString() : 'None',
        hasNewImage: !!selectedImage,
        hasCurrentImage: !!currentImageUrl,
        userId: currentUser.uid
      });

      let imageUrl = currentImageUrl; // Keep current image by default

      // Handle image updates
      if (selectedImage) {
        console.log('Processing image replacement...');
        
        // Delete old image if it exists
        if (currentImageUrl) {
          await deleteOldImage(currentImageUrl);
        }
        
        // Upload new image
        imageUrl = await uploadImage(selectedImage);
      }

      // Prepare deadline timestamp
      let deadlineTimestamp = null;
      if (deadline) {
        deadlineTimestamp = Timestamp.fromDate(deadline);
      }

      // Prepare update data
      const updateData = {
        title: title.trim(),
        description: description.trim(),
        deadline: deadlineTimestamp,
        priority: priority,
        imageUrl: imageUrl,
        updatedAt: serverTimestamp(),
      };

      console.log('Saving project updates to Firestore...');
      
      // Update the project in Firestore
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, updateData);
      
      console.log('Project updated successfully:', project.id);

      // Show success message and close screen
      const successMessage = `Project "${title.trim()}" has been updated successfully.`;
      
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
      console.error('Error updating project:', error);
      
      let errorMessage = 'Failed to update project. Please try again.';
      
      if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'You do not have permission to update this project.';
      }
      
      if (isWeb) {
        alert(errorMessage);
      } else {
        Alert.alert('Update Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if no project data
  if (!project) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No project data available</Text>
          <TouchableOpacity onPress={onClose} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Project</Text>
        <TouchableOpacity 
          onPress={handleUpdateProject}
          style={[
            styles.saveButton,
            (!title.trim() || !description.trim()) && styles.saveButtonDisabled
          ]}
          disabled={!title.trim() || !description.trim()}
        >
          <Text style={[
            styles.saveButtonText,
            (!title.trim() || !description.trim()) && styles.saveButtonTextDisabled
          ]}>
            Save
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
              <Text style={styles.label}>Project Image</Text>
              
              <TouchableOpacity
                onPress={pickImage}
                style={[
                  styles.imageUpload,
                  isWeb && screenWidth > 768 && styles.imageUploadWeb
                ]}
              >
                {selectedImage ? (
                  // Show newly selected image
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
                ) : currentImageUrl ? (
                  // Show current project image
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: currentImageUrl }}
                      style={styles.selectedImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.imageChangeText}>
                      Tap to change image
                    </Text>
                  </View>
                ) : (
                  // No image state
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
              <Text style={styles.label}>Deadline</Text>
              
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
                  <Text style={styles.addDeadlineText}>Edit Deadline</Text>
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
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  closeButton: {
    padding: 4,
  },
  saveButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#4b5563',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButtonTextDisabled: {
    color: '#9ca3af',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});