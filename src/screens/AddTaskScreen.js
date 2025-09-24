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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = auth.currentUser;
  const screenWidth = Dimensions.get('window').width;
  const isWeb = Platform.OS === 'web';

  /**
   * Priority options with colors, icons, and descriptions
   */
  const priorityOptions = [
    { 
      value: 'low', 
      label: 'Low Priority', 
      color: '#10b981',
      icon: 'chevron-down-circle',
      description: 'Can be done later'
    },
    { 
      value: 'medium', 
      label: 'Medium Priority', 
      color: '#f59e0b',
      icon: 'remove-circle',
      description: 'Should be done soon'
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
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
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
      testDate.setHours(0, 0, 0, 0);
      todayDateOnly.setHours(0, 0, 0, 0);
      return testDate < todayDateOnly;
    };
    
    const selectDate = (day) => {
      if (isPastDate(day)) {
        const message = 'Please select today or a future date for your task deadline.';
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
      console.log('Task deadline selected:', selectedDate.toDateString());
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
              console.log('Task deadline cleared');
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
          console.log('Task priority selected:', option.value);
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
      
      {/* Header with Project Context */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Add Task</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            to {project?.title || 'Project'}
          </Text>
        </View>
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

          {/* Task Title */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Task Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter task title"
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              returnKeyType="next"
            />
            <Text style={styles.characterCount}>
              {title.length}/100 characters
            </Text>
          </View>

          {/* Task Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the task (optional)"
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline={true}
              numberOfLines={3}
              maxLength={300}
              textAlignVertical="top"
              returnKeyType="done"
            />
            <Text style={styles.characterCount}>
              {description.length}/300 characters
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
          onPress={handleSaveTask}
          disabled={isLoading || !title.trim()}
          style={[
            styles.saveButton,
            (isLoading || !title.trim()) && styles.saveButtonDisabled
          ]}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Creating Task...' : 'Create Task'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Styles for the Add Task Screen
 */
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
    height: 80,
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