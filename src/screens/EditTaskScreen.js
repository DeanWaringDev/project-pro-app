/**
 * EditTaskScreen.js - Edit Task Modal Screen
 * 
 * This modal screen allows users to edit existing tasks within a project.
 * It provides a form with fields for title, description, priority, and deadline.
 * 
 * Features:
 * - Pre-populated form fields with existing task data
 * - Input validation
 * - Priority selection
 * - Date picker for deadline
 * - Save changes to Firestore
 * - Cancel without saving changes
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function EditTaskScreen({ 
  visible, 
  onClose, 
  task, 
  projectId, 
  onTaskUpdated 
}) {
  // Form state - initialize with existing task data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [deadline, setDeadline] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with task data when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setDeadline(task.deadline ? task.deadline.toDate() : null);
    } else {
      // Reset form when no task
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDeadline(null);
    }
  }, [task]);

  // Handle save task updates
  const handleSaveTask = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a task title.');
      return;
    }

    if (!task || !projectId) {
      Alert.alert('Error', 'Missing task or project information.');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare update data
      const updateData = {
        title: title.trim(),
        description: description.trim(),
        priority: priority,
        updatedAt: serverTimestamp(),
      };

      // Add deadline if set
      if (deadline) {
        updateData.deadline = deadline;
      } else {
        // Remove deadline field if not set
        updateData.deadline = null;
      }

      // Update task in Firestore
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, updateData);

      console.log('Task updated successfully:', task.id);

      // Call callback to refresh parent component
      if (onTaskUpdated) {
        onTaskUpdated();
      }

      // Close modal
      onClose();

    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert(
        'Update Failed', 
        'Failed to update the task. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle date picker
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS
    if (selectedDate) {
      setDeadline(selectedDate);
    }
  };

  // Clear deadline
  const clearDeadline = () => {
    setDeadline(null);
  };

  // Priority options
  const priorities = [
    { key: 'low', label: 'Low Priority', color: '#10b981', icon: 'arrow-down' },
    { key: 'medium', label: 'Medium Priority', color: '#f59e0b', icon: 'remove' },
    { key: 'urgent', label: 'Urgent', color: '#ef4444', icon: 'arrow-up' },
  ];

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!visible || !task) return null;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={onClose}
          style={styles.headerButton}
          accessibilityLabel="Cancel editing"
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Edit Task</Text>
        
        <TouchableOpacity 
          onPress={handleSaveTask}
          style={[styles.headerButton, styles.saveButton]}
          disabled={isLoading || !title.trim()}
          accessibilityLabel="Save task changes"
        >
          <Text style={[
            styles.saveButtonText,
            (!title.trim() || isLoading) && styles.saveButtonTextDisabled
          ]}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form}>
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
                  {formatDate(deadline)}
                </Text>
              </View>
              <View style={styles.deadlineButtons}>
                <TouchableOpacity 
                  onPress={() => setShowDatePicker(true)}
                  style={styles.deadlineButton}
                  accessibilityLabel="Change deadline date"
                >
                  <Text style={styles.deadlineButtonText}>Change</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={clearDeadline}
                  style={[styles.deadlineButton, styles.clearButton]}
                  accessibilityLabel="Remove deadline"
                >
                  <Text style={[styles.deadlineButtonText, styles.clearButtonText]}>
                    Clear
                  </Text>
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
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  form: {
    flex: 1,
    padding: 20,
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
    minHeight: 100,
    maxHeight: 150,
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
    marginLeft: 12,
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  deadlineButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deadlineButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#ef4444',
  },
  deadlineButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  clearButtonText: {
    color: 'white',
  },
  addDeadlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#6366f1',
    borderStyle: 'dashed',
  },
  addDeadlineText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
  },
});