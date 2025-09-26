/**
 * AddTaskScreen.js - Create New Task Screen
 * 
 * FIXED VERSION - Properly handles success callback and auto-close
 * 
 * Key Fixes:
 * 1. Auto-closes modal after successful task creation
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
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
  collection, 
  addDoc, 
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function AddTaskScreen({ project, onClose, onSuccess }) {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(null);
  const [priority, setPriority] = useState('medium');
  
  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = auth.currentUser;
  const screenWidth = Dimensions.get('window').width;
  const isWeb = Platform.OS === 'web';

  // Priority options (matching EditTaskScreen)
  const priorities = [
    { key: 'low', label: 'Low Priority', color: '#10b981', icon: 'arrow-down' },
    { key: 'medium', label: 'Medium Priority', color: '#f59e0b', icon: 'remove' },
    { key: 'urgent', label: 'Urgent', color: '#ef4444', icon: 'arrow-up' },
  ];



  /**
   * Validate form inputs before submission
   */
  const validateForm = () => {
    if (!title.trim()) {
      const message = 'Task title is required.';
      if (isWeb) {
        alert(message);
      } else {
        Alert.alert('Validation Error', message);
      }
      return false;
    }

    if (title.trim().length < 2) {
      const message = 'Task title must be at least 2 characters long.';
      if (isWeb) {
        alert(message);
      } else {
        Alert.alert('Validation Error', message);
      }
      return false;
    }

    if (title.trim().length > 100) {
      const message = 'Task title must be less than 100 characters.';
      if (isWeb) {
        alert(message);
      } else {
        Alert.alert('Validation Error', message);
      }
      return false;
    }

    if (description.length > 300) {
      const message = 'Task description must be less than 300 characters.';
      if (isWeb) {
        alert(message);
      } else {
        Alert.alert('Validation Error', message);
      }
      return false;
    }

    if (deadline) {
      const today = new Date();
      const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const deadlineDateOnly = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
      todayDateOnly.setHours(0, 0, 0, 0);
      deadlineDateOnly.setHours(0, 0, 0, 0);

      if (deadlineDateOnly < todayDateOnly) {
        const message = 'Task deadline cannot be in the past. Please select today or a future date.';
        if (isWeb) {
          alert(message);
        } else {
          Alert.alert('Validation Error', message);
        }
        return false;
      }
    }

    if (!project || !project.id) {
      const message = 'Invalid project. Please try again.';
      if (isWeb) {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
      return false;
    }

    return true;
  };

  /**
   * Handle task creation and save to Firestore
   * Enhanced with proper success callback
   */
  const handleSaveTask = async () => {
    console.log('Starting task creation process...');
    
    if (!validateForm()) return;
    
    if (!currentUser) {
      const message = 'You must be logged in to create tasks.';
      if (isWeb) {
        alert(message);
      } else {
        Alert.alert('Authentication Error', message);
      }
      return;
    }

    setIsLoading(true);

    try {
      console.log('Creating task with data:', {
        title: title.trim(),
        description: description.trim(),
        priority,
        deadline: deadline ? deadline.toDateString() : 'None',
        projectId: project.id,
        projectTitle: project.title,
        userId: currentUser.uid
      });

      // Prepare deadline timestamp
      let deadlineTimestamp = null;
      if (deadline) {
        deadlineTimestamp = Timestamp.fromDate(deadline);
      }

      // Prepare task data for Firestore
      const taskData = {
        projectId: project.id,
        userId: currentUser.uid,
        title: title.trim(),
        description: description.trim(),
        deadline: deadlineTimestamp,
        priority: priority,
        completed: false, // New tasks start as incomplete
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log('Saving task to Firestore...');
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'tasks'), taskData);
      console.log('Task created successfully with ID:', docRef.id);

      // Show success message and close screen
      const successMessage = `Task "${title.trim()}" has been added to ${project.title}.`;
      
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
      console.error('Error creating task:', error);
      
      let errorMessage = 'Failed to create task. Please try again.';
      
      if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'You do not have permission to create tasks. Please sign in again.';
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
      
      {/* Header with Project Context */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Add Task</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            to {project?.title || 'Project'}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={handleSaveTask}
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
          {/* Task Title */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Task Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter task title"
              placeholderTextColor="#9ca3af"
              multiline={false}
              maxLength={100}
            />
          </View>

          {/* Task Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter task description (optional)"
              placeholderTextColor="#9ca3af"
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
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

/**
 * Styles for the Add Task Screen
 */
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
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
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
});