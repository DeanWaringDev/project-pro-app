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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = auth.currentUser;
  const screenWidth = Dimensions.get('window').width;
  const isWeb = Platform.OS === 'web';

  /**
   * Priority options with colors and icons
   */
  const priorityOptions = [
    { 
      value: 'low', 
      label: 'Low Priority', 
      color: '#10b981',
      icon: 'chevron-down-circle',
      description: 'Not urgent, can be done later'
    },
    { 
      value: 'medium', 
      label: 'Medium Priority', 
      color: '#f59e0b',
      icon: 'remove-circle',
      description: 'Important but not critical'
    },
    { 
      value: 'urgent', 
      label: 'Urgent Priority', 
      color: '#ef4444',
      icon: 'chevron-up-circle',
      description: 'Needs immediate attention'
    },
  ];

  /**
   * Custom calendar component for deadline selection
   */
  const renderCalendar = () => {
    const today = new Date();
    
    const getDaysInMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };
    
    const getFirstDayOfMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    const isToday = (day) => {
      const testDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      return testDate.toDateString() === today.toDateString();
    };
    
    const isSelected = (day) => {
      if (!deadline) return false;
      const testDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      return testDate.toDateString() === deadline.toDateString();
    };
    
    const isPastDate = (day) => {
      const testDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return testDate < todayDateOnly;
    };
    
    const selectDate = (day) => {
      if (isPastDate(day)) {
        const message = 'Please select today or a future date for your project deadline.';
        if (isWeb) {
          alert(message);
        } else {
          Alert.alert('Invalid Date', message);
        }
        return;
      }
      
      const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      setDeadline(selectedDate);
      setShowDatePicker(false);
      console.log('Selected deadline:', selectedDate.toDateString());
    };
    
    const previousMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };
    
    const nextMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };
    
    return (
      <View style={[
        styles.calendarContainer,
        isWeb && screenWidth > 768 && styles.calendarContainerWeb
      ]}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={previousMonth} style={styles.calendarNavButton}>
            <Ionicons name="chevron-back" size={20} color="#3b82f6" />
          </TouchableOpacity>
          
          <Text style={styles.calendarTitle}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          
          <TouchableOpacity onPress={nextMonth} style={styles.calendarNavButton}>
            <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.calendarDayLabels}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Text key={day} style={styles.calendarDayLabel}>{day}</Text>
          ))}
        </View>
        
        <View style={styles.calendarGrid}>
          {days.map((day, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => day && selectDate(day)}
              style={[
                styles.calendarDay,
                day && isToday(day) && styles.calendarToday,
                day && isSelected(day) && styles.calendarSelected,
                day && isPastDate(day) && styles.calendarPast,
              ]}
              disabled={!day || isPastDate(day)}
            >
              <Text
                style={[
                  styles.calendarDayText,
                  day && isToday(day) && styles.calendarTodayText,
                  day && isSelected(day) && styles.calendarSelectedText,
                  day && isPastDate(day) && styles.calendarPastText,
                ]}
              >
                {day || ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.calendarFooter}>
          <TouchableOpacity
            onPress={() => {
              setDeadline(null);
              setShowDatePicker(false);
              console.log('Deadline cleared');
            }}
            style={styles.calendarClearButton}
          >
            <Text style={styles.calendarClearText}>Clear Date</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setShowDatePicker(false)}
            style={styles.calendarCancelButton}
          >
            <Text style={styles.calendarCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
  const handleSaveProject = async () => {
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

  /**
   * Render priority selection options
   */
  const renderPriorityOption = (option) => {
    const isSelected = priority === option.value;
    
    return (
      <TouchableOpacity
        key={option.value}
        onPress={() => {
          setPriority(option.value);
          console.log('Priority selected:', option.value);
        }}
        style={[
          styles.priorityOption,
          isSelected && styles.priorityOptionSelected
        ]}
      >
        <Ionicons 
          name={option.icon} 
          size={24} 
          color={isSelected ? option.color : '#64748b'} 
        />
        <View style={styles.priorityContent}>
          <Text 
            style={[
              styles.priorityLabel,
              isSelected && styles.priorityLabelSelected
            ]}
          >
            {option.label}
          </Text>
          <Text 
            style={[
              styles.priorityDescription,
              isSelected && styles.priorityDescriptionSelected
            ]}
          >
            {option.description}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={option.color} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Project</Text>
        <View style={styles.placeholder} />
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

          {/* Image Upload Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Image (Optional)</Text>
            
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Title *</Text>
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
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

          {/* Deadline Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deadline (Optional)</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(!showDatePicker)}
              style={styles.datePickerButton}
            >
              <View style={styles.datePickerContent}>
                <Ionicons name="calendar-outline" size={20} color="#64748b" />
                <Text style={styles.datePickerText}>
                  {deadline ? deadline.toLocaleDateString() : 'Select deadline date'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748b" />
            </TouchableOpacity>

            {showDatePicker && renderCalendar()}
          </View>

          {/* Priority Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Priority *</Text>
            <View style={styles.priorityContainer}>
              {priorityOptions.map(renderPriorityOption)}
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleSaveProject}
          disabled={isLoading || !title.trim()}
          style={[
            styles.saveButton,
            (isLoading || !title.trim()) && styles.saveButtonDisabled
          ]}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Creating Project...' : 'Create Project'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    padding: 4,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#1e293b',
    color: 'white',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  datePickerButton: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
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
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
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
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#334155',
    borderRadius: 8,
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
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
  },
  priorityOptionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e3a8a',
  },
  priorityContent: {
    flex: 1,
    marginLeft: 12,
  },
  priorityLabel: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  priorityLabelSelected: {
    color: 'white',
  },
  priorityDescription: {
    color: '#475569',
    fontSize: 12,
    marginTop: 2,
  },
  priorityDescriptionSelected: {
    color: '#94a3b8',
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