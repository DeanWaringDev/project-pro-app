/**
 * TasksScreen.js - Project Tasks Management Screen
 * 
 * FIXED VERSION - Addresses web-specific issues while maintaining Android compatibility
 * 
 * Key Fixes:
 * 1. Enhanced delete functionality for web
 * 2. Proper modal close callbacks that refresh parent
 * 3. Better error handling for Firestore indexing issues
 * 4. Improved task state management
 * 5. Web-compatible confirmation dialogs
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import AddTaskScreen from './AddTaskScreen';
import EditTaskScreen from './EditTaskScreen';

export default function TasksScreen({ project, onBack, selectedTaskId }) {
  // Task data state
  const [tasks, setTasks] = useState([]);
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);
  const flatListRef = React.useRef(null);
  // Scroll to selectedTaskId on mount or when tasks change
  useEffect(() => {
    if (selectedTaskId && tasks.length > 0) {
      const idx = tasks.findIndex(t => t.id === selectedTaskId);
      if (idx >= 0 && flatListRef.current) {
        setHighlightedTaskId(selectedTaskId);
        setTimeout(() => {
          flatListRef.current.scrollToIndex({ index: idx, animated: true });
        }, 300);
      }
    }
  }, [selectedTaskId, tasks]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [forceRefresh, setForceRefresh] = useState(0); // Force refresh counter

  const currentUser = auth.currentUser;
  const isWeb = Platform.OS === 'web';

  /**
   * Force refresh function for web compatibility
   */
  const triggerRefresh = useCallback(() => {
    console.log('Triggering manual refresh for tasks');
    setForceRefresh(prev => prev + 1);
  }, []);

  /**
   * Set up real-time listener for tasks in this project
   * Enhanced with better error handling and web compatibility
   */
  useEffect(() => {
    if (!currentUser || !project) {
      console.log('Missing currentUser or project');
      setIsLoading(false);
      return;
    }

    console.log('Setting up tasks listener for project:', project.id);

    // Use a simpler query to avoid Firestore indexing issues
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('projectId', '==', project.id),
      where('userId', '==', currentUser.uid)
      // Note: Removed complex orderBy to avoid requiring composite index
    );

    const unsubscribe = onSnapshot(
      tasksQuery,
      (querySnapshot) => {
        const tasksData = [];

        querySnapshot.forEach((doc) => {
          tasksData.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        // Sort tasks in memory instead of in Firestore query
        // This avoids the need for composite indexes
        tasksData.sort((a, b) => {
          // First sort by completion status (incomplete tasks first)
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
          }
          
          // Then by priority (urgent first)
          const priorityOrder = { urgent: 0, medium: 1, low: 2 };
          const aPriority = priorityOrder[a.priority?.toLowerCase()] ?? 3;
          const bPriority = priorityOrder[b.priority?.toLowerCase()] ?? 3;
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          
          // Finally by creation date (newest first) if available
          if (a.createdAt && b.createdAt) {
            return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
          }
          
          return 0;
        });

        console.log(`Loaded and sorted ${tasksData.length} tasks for project ${project.title}`);
        setTasks(tasksData);
        setIsLoading(false);
        setIsRefreshing(false);
      },
      (error) => {
        console.error('Firestore tasks listener error:', error);
        setIsLoading(false);
        setIsRefreshing(false);
        
        // Enhanced error handling for indexing issues
        let errorMessage = 'Failed to load tasks. Please try again.';
        
        if (error.code === 'failed-precondition' || error.message.includes('index')) {
          errorMessage = 'Database indexing in progress. Tasks will load shortly.';
          console.log('FIRESTORE INDEX INFO: If this persists, check Firebase Console for index creation');
        } else if (error.code === 'permission-denied') {
          errorMessage = 'Permission denied. Please sign out and back in.';
        }
        
        // Use web-compatible alerts
        if (isWeb) {
          alert(errorMessage);
        } else {
          Alert.alert("Database Error", errorMessage, [
            { text: "OK" },
            {
              text: "Retry",
              onPress: () => {
                setIsLoading(true);
                triggerRefresh();
              }
            }
          ]);
        }
      }
    );

    return () => {
      console.log('Cleaning up tasks listener');
      unsubscribe();
    };
  }, [currentUser, project, forceRefresh]); // Added forceRefresh dependency

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = useCallback(() => {
    console.log('Manual refresh triggered for tasks');
    setIsRefreshing(true);
    triggerRefresh();
  }, [triggerRefresh]);

  /**
   * Modal handlers for Add Task with enhanced callback
   */
  const handleAddTask = () => {
    console.log('Opening Add Task modal');
    setShowAddTask(true);
  };

  const handleCloseAddTask = useCallback((taskCreated = false) => {
    console.log('Closing Add Task modal, task created:', taskCreated);
    setShowAddTask(false);
    
    // Enhanced refresh when task is created
    if (taskCreated) {
      // Immediate refresh for web
      if (isWeb) {
        triggerRefresh();
        // Additional refresh after a short delay to ensure Firestore sync
        setTimeout(() => {
          triggerRefresh();
        }, 500);
      } else {
        // Single refresh for mobile (works better)
        setTimeout(() => {
          triggerRefresh();
        }, 100);
      }
    } else {
      // Standard refresh when modal just closes
      setTimeout(() => {
        triggerRefresh();
      }, 100);
    }
  }, [triggerRefresh, isWeb]);

  /**
   * Toggle task completion status with enhanced error handling
   */
  const handleToggleTask = async (task) => {
    try {
      console.log(`Toggling task completion: ${task.title} - ${!task.completed ? 'completed' : 'incomplete'}`);
      
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, {
        completed: !task.completed,
        updatedAt: serverTimestamp(),
      });
      
      console.log('Task completion toggled successfully');
      
      // Trigger refresh for web compatibility
      if (isWeb) {
        triggerRefresh();
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      
      const errorMessage = error.code === 'permission-denied'
        ? "You don't have permission to update this task."
        : 'Failed to update task. Please check your connection and try again.';
      
      if (isWeb) {
        alert(errorMessage);
      } else {
        Alert.alert('Update Error', errorMessage, [{ text: 'OK' }]);
      }
    }
  };

  /**
   * Handle task deletion with enhanced web support
   */
  const handleDeleteTask = async (task) => {
    console.log("Delete button pressed for task:", task.title);

    // Enhanced confirmation for web vs mobile
    const confirmDelete = () => new Promise((resolve) => {
      if (isWeb) {
        const confirmed = window.confirm(
          `Are you sure you want to delete "${task.title}"? This action cannot be undone.`
        );
        resolve(confirmed);
      } else {
        Alert.alert(
          "Delete Task",
          `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => resolve(false)
            },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => resolve(true)
            }
          ],
          { cancelable: true }
        );
      }
    });

    const confirmed = await confirmDelete();
    if (!confirmed) {
      console.log("User cancelled task delete");
      return;
    }

    console.log("User confirmed task delete");
    await performTaskDelete(task);
  };

  /**
   * Actually delete the task from Firestore
   */
  const performTaskDelete = async (task) => {
    try {
      console.log('Deleting task:', task.id);
      await deleteDoc(doc(db, "tasks", task.id));
      console.log("Task deleted successfully");
      
      // Show success message
      if (isWeb) {
        alert(`Task "${task.title}" has been deleted successfully.`);
      } else {
        Alert.alert("Success", `Task "${task.title}" has been deleted successfully.`);
      }

      // Trigger refresh
      triggerRefresh();

    } catch (error) {
      console.error("Error deleting task:", error);
      
      const errorMessage = error.code === 'permission-denied'
        ? "You don't have permission to delete this task."
        : `Failed to delete task: ${error.message}`;
      
      if (isWeb) {
        alert(errorMessage);
      } else {
        Alert.alert("Delete Error", errorMessage, [{ text: "OK" }]);
      }
    }
  };

  /**
   * Handle task editing - open edit modal
   */
  const handleEditTask = (task) => {
    console.log("Edit button pressed for task:", task.title);
    setTaskToEdit(task);
    setShowEditTask(true);
  };

  /**
   * Handle edit task completion
   */
  const handleTaskUpdated = () => {
    console.log("Task updated, refreshing tasks list");
    setShowEditTask(false);
    setTaskToEdit(null);
    triggerRefresh();
  };

  /**
   * Get priority color based on priority level
   */
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#64748b";
    }
  };

  /**
   * Format Firestore timestamp to readable date string
   */
  const formatDate = (timestamp) => {
    if (!timestamp) return null;
    try {
      return timestamp.toDate().toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  /**
   * Calculate progress percentage based on completed tasks
   */
  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.completed).length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  /**
   * Check if a task is overdue
   */
  const isTaskOverdue = (task) => {
    if (!task.deadline || task.completed) return false;
    try {
      return new Date() > task.deadline.toDate();
    } catch (error) {
      return false;
    }
  };

  /**
   * Handle back navigation with proper cleanup
   */
  const handleBackPress = useCallback(() => {
    console.log('Back button pressed from tasks screen');
    if (onBack) {
      onBack(); // This will trigger refresh in parent component
    }
  }, [onBack]);

  /**
   * Render individual task item
   */
  const renderTaskItem = ({ item }) => {
    const isOverdue = isTaskOverdue(item);
    
    return (
      <View style={styles.taskCard}>
        <View style={styles.taskHeader}>
          {/* Completion Checkbox */}
          <TouchableOpacity
            onPress={() => handleToggleTask(item)}
            style={styles.checkboxContainer}
            accessibilityLabel={item.completed ? "Mark as incomplete" : "Mark as complete"}
          >
            <View style={[
              styles.checkbox,
              item.completed && styles.checkboxChecked
            ]}>
              {item.completed && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </View>
          </TouchableOpacity>

          {/* Task Content */}
          <View style={styles.taskContent}>
            <Text style={[
              styles.taskTitle,
              item.completed && styles.taskTitleCompleted
            ]} numberOfLines={2}>
              {item.title}
            </Text>

            {item.description && (
              <Text style={[
                styles.taskDescription,
                item.completed && styles.taskDescriptionCompleted
              ]} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            <View style={styles.taskMeta}>
              {/* Priority Badge */}
              <View style={[
                styles.priorityBadge,
                { backgroundColor: `${getPriorityColor(item.priority)}20` },
              ]}>
                <Text style={[
                  styles.priorityText,
                  { color: getPriorityColor(item.priority) },
                ]}>
                  {item.priority?.toUpperCase() || "NORMAL"}
                </Text>
              </View>

              {/* Deadline (if exists) */}
              {item.deadline && (
                <View style={styles.deadlineContainer}>
                  <Ionicons 
                    name={isOverdue ? "warning-outline" : "calendar-outline"} 
                    size={12} 
                    color={isOverdue ? "#ef4444" : "#64748b"} 
                  />
                  <Text style={[
                    styles.deadlineText,
                    isOverdue && styles.overdueText
                  ]}>
                    {isOverdue ? 'Overdue: ' : ''}{formatDate(item.deadline)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons Container */}
          <View style={styles.actionButtonsContainer}>
            {/* Edit Button */}
            <TouchableOpacity
              onPress={(event) => {
                event.stopPropagation();
                event.preventDefault();
                handleEditTask(item);
              }}
              style={styles.editTaskButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={`Edit ${item.title}`}
            >
              <Ionicons name="create-outline" size={22} color="#3b82f6" />
            </TouchableOpacity>

            {/* Delete Button with enhanced event handling */}
            <TouchableOpacity
              onPress={(event) => {
                event.stopPropagation();
                event.preventDefault();
                handleDeleteTask(item);
              }}
              style={styles.deleteTaskButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={`Delete ${item.title}`}
            >
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  /**
   * Render empty state when no tasks exist
   */
  const renderEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#64748b" />
        </View>
        <Text style={styles.emptyTitle}>No Tasks Yet</Text>
        <Text style={styles.emptyText}>
          Add your first task to start tracking progress on this project.
        </Text>
        <TouchableOpacity
          style={styles.createTaskButton}
          onPress={handleAddTask}
          accessibilityLabel="Create your first task"
        >
          <Text style={styles.createTaskButtonText}>Create Task</Text>
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Main render method
   */
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBackPress} 
          style={styles.backButton}
          accessibilityLabel="Go back to projects"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {project?.title || 'Project Tasks'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {tasks.length} tasks • {calculateProgress()}% complete
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Bar Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${calculateProgress()}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {tasks.filter(task => task.completed).length} of {tasks.length} completed
        </Text>
      </View>

      {/* Tasks List */}
      <FlatList
        ref={flatListRef}
        data={tasks}
        renderItem={({ item, ...rest }) => {
          const isHighlighted = item.id === highlightedTaskId;
          return (
            <View style={isHighlighted ? [styles.highlightedTask, styles.taskCard] : styles.taskCard}>
              {renderTaskItem({ item, ...rest })}
            </View>
          );
        }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          tasks.length === 0 && styles.emptyListContainer,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={["#3b82f6"]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onScrollBeginDrag={() => setHighlightedTaskId(null)}
      />


      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={handleAddTask}
        accessibilityLabel="Add new task"
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* Add Task Modal */}
      <Modal
        visible={showAddTask}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => handleCloseAddTask(false)}
      >
        <AddTaskScreen 
          project={project}
          onClose={handleCloseAddTask}
          onSuccess={() => handleCloseAddTask(true)}
        />
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        visible={showEditTask}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setShowEditTask(false);
          setTaskToEdit(null);
        }}
      >
        <EditTaskScreen 
          visible={showEditTask}
          task={taskToEdit}
          projectId={project?.id}
          onClose={() => {
            setShowEditTask(false);
            setTaskToEdit(null);
          }}
          onTaskUpdated={handleTaskUpdated}
        />
      </Modal>
    </View>
  );
}

/**
 * Styles for the Tasks Screen
 * Enhanced with better web support
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#1e293b",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#1e293b",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#374151",
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 4,
    minWidth: 2, // Ensure some width is always visible
  },
  progressText: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  separator: {
    height: 12,
  },
  taskCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  highlightedTask: {
    borderWidth: 2,
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(251, 191, 36, 0.13)', // subtle yellow highlight
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkboxContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#64748b",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#64748b",
  },
  taskDescription: {
    color: "#94a3b8",
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  taskDescriptionCompleted: {
    color: "#64748b",
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  deadlineContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  deadlineText: {
    color: "#64748b",
    fontSize: 12,
    marginLeft: 4,
  },
  overdueText: {
    color: "#ef4444",
    fontWeight: "600",
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  editTaskButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  deleteTaskButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 128,
    height: 128,
    backgroundColor: "#1e293b",
    borderRadius: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  createTaskButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  createTaskButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: Platform.OS === 'android' ? 60 : 24, // Increase from 40 to 60 on Android
    right: 24,
    width: 64,
    height: 64,
    backgroundColor: "#f97316",
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});