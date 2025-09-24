/**
 * ProjectsScreen.js - Main Projects List Screen
 * 
 * This screen displays all user projects with the following features:
 * - Real-time project list from Firestore
 * - Project CRUD operations (Create, Read, Update, Delete)
 * - Progress tracking with task counts
 * - Pull-to-refresh functionality
 * - Empty state when no projects exist
 * - Modal screens for adding/editing projects and viewing tasks
 * 
 * Key fixes in this version:
 * - Proper task counting and progress calculation
 * - Fixed delete functionality
 * - Better error handling for Firestore operations
 * - Responsive design for web
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  Image,
  Alert,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Header from '../components/Header';
import Svg, { Circle } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import AddProjectScreen from "./AddProjectScreen";
import SidebarMenu from "../components/SidebarMenu";
import EditProjectScreen from "./EditProjectScreen";
import TasksScreen from "./TasksScreen";
import CalendarScreen from "./CalendarScreen";
import ProfileScreen from "./ProfileScreen";
import SettingsScreen from "./SettingsScreen";


export default function ProjectsScreen({ navigation, user, openSidebar }) {
  // Project data state
  const [projects, setProjects] = useState([]);
  const [projectTasks, setProjectTasks] = useState({}); // Store tasks for each project

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [showAddProject, setShowAddProject] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showTasksScreen, setShowTasksScreen] = useState(false);
  // Removed modal state for navigation-based screens

  // Remove sidebar state from here
  const [selectedProject, setSelectedProject] = useState(null);

  const currentUser = auth.currentUser;
  const screenWidth = Dimensions.get('window').width;
  const isWeb = screenWidth > 768; // Simple web detection

  /**
   * Set up real-time listener for user's projects
   */
  useEffect(() => {
    if (!currentUser) {
      console.log("No current user found");
      setIsLoading(false);
      return;
    }

    console.log("Setting up Firestore listener for user:", currentUser.uid);

    const projectsQuery = query(
      collection(db, "projects"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      projectsQuery,
      (querySnapshot) => {
        const projectsData = [];

        querySnapshot.forEach((doc) => {
          projectsData.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        console.log(`Loaded ${projectsData.length} projects`);
        setProjects(projectsData);
        setIsLoading(false);
        setIsRefreshing(false);
      },
      (error) => {
        console.error("Firestore listener error:", error);
        setIsLoading(false);
        setIsRefreshing(false);
        Alert.alert(
          "Database Error", 
          `Failed to load projects: ${error.message}`,
          [{ text: "OK" }]
        );
      }
    );

    return () => {
      console.log("Cleaning up projects listener");
      unsubscribe();
    };
  }, [currentUser]);

  /**
   * Set up real-time listener for all tasks to calculate project progress
   */
  useEffect(() => {
    if (!currentUser) return;

    console.log("Setting up tasks listener for progress calculation");

    const tasksQuery = query(
      collection(db, "tasks"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      tasksQuery,
      (querySnapshot) => {
        const tasksByProject = {};

        querySnapshot.forEach((doc) => {
          const task = { id: doc.id, ...doc.data() };
          const projectId = task.projectId;

          if (!tasksByProject[projectId]) {
            tasksByProject[projectId] = {
              total: 0,
              completed: 0,
              tasks: []
            };
          }

          tasksByProject[projectId].total++;
          tasksByProject[projectId].tasks.push(task);
          
          if (task.completed) {
            tasksByProject[projectId].completed++;
          }
        });

        console.log("Updated task counts for projects:", Object.keys(tasksByProject));
        setProjectTasks(tasksByProject);
      },
      (error) => {
        console.error("Tasks listener error:", error);
        // Don't show error to user for task counting, just log it
      }
    );

    return () => {
      console.log("Cleaning up tasks listener");
      unsubscribe();
    };
  }, [currentUser]);

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = () => {
    console.log("Manual refresh triggered");
    setIsRefreshing(true);
    // The onSnapshot listeners will handle the actual refresh
  };


  /**
   * Modal handlers for Add Project
   */
  const handleAddProject = () => {
    console.log("Opening Add Project modal");
    setShowAddProject(true);
  };

  const handleCloseAddProject = () => {
    console.log("Closing Add Project modal");
    setShowAddProject(false);
  };

  /**
   * Modal handlers for Edit Project
   */
  const handleEditProject = (project) => {
    console.log("Edit button pressed for project:", project.title);
    setEditingProject(project);
    setShowEditProject(true);
  };

  const handleCloseEditProject = () => {
    console.log("Closing Edit Project modal");
    setShowEditProject(false);
    setEditingProject(null);
  };

  /**
   * Modal handlers for Tasks Screen
   */
  const handleViewTasks = (project) => {
    console.log("View tasks pressed for project:", project.title);
    setSelectedProject(project);
    setShowTasksScreen(true);
  };

  const handleBackFromTasks = () => {
    console.log("Closing Tasks screen");
    setShowTasksScreen(false);
    setSelectedProject(null);
  };

  const handleBackFromCalendar = () => {
    console.log("Closing Calendar screen");
    setShowCalendarScreen(false);
  };



  /**
   * Handle project deletion with confirmation
   */
  const handleDeleteProject = async (project) => {
    console.log("Delete button pressed for project:", project.title);

    Alert.alert(
      "Delete Project",
      `Are you sure you want to delete "${project.title}"?\n\nThis will also delete all tasks in this project. This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            console.log("User cancelled delete");
          }
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            console.log("User confirmed delete");
            await performProjectDelete(project);
          }
        }
      ],
      { cancelable: true }
    );
  };

  /**
   * Actually delete the project from Firestore
   */
  const performProjectDelete = async (project) => {
    try {
      console.log("Deleting project:", project.id);
      
      // First, delete all tasks for this project
      const projectTaskList = projectTasks[project.id]?.tasks || [];
      console.log(`Deleting ${projectTaskList.length} tasks for project ${project.id}`);
      
      const deletePromises = projectTaskList.map(task => 
        deleteDoc(doc(db, "tasks", task.id))
      );
      
      await Promise.all(deletePromises);
      console.log("All project tasks deleted");

      // Then delete the project itself
      await deleteDoc(doc(db, "projects", project.id));
      console.log("Project deleted successfully");

    } catch (error) {
      console.error("Error deleting project:", error);
      Alert.alert(
        "Delete Error",
        `Failed to delete project: ${error.message}`,
        [{ text: "OK" }]
      );
    }
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
   * Circular Progress Component
   */
  const CircularProgress = ({ progress, size = 50 }) => {
    const radius = (size - 6) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#334155"
            strokeWidth="3"
            fill="transparent"
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#3b82f6"
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
      </View>
    );
  };

  /**
   * Calculate progress percentage for a project
   */
  const calculateProgress = (projectId) => {
    const taskData = projectTasks[projectId];
    if (!taskData || taskData.total === 0) return 0;
    return Math.round((taskData.completed / taskData.total) * 100);
  };

  /**
   * Get task count string for a project
   */
  const getTaskCountString = (projectId) => {
    const taskData = projectTasks[projectId];
    if (!taskData) return "0/0 Tasks";
    return `${taskData.completed}/${taskData.total} Tasks`;
  };

  /**
   * Get task status text for a project
   */
  const getTaskStatusText = (projectId) => {
    const taskData = projectTasks[projectId];
    if (!taskData || taskData.total === 0) return "No tasks yet";
    if (taskData.completed === taskData.total) return "All tasks complete";
    if (taskData.completed === 0) return "Not started";
    return "In progress";
  };

  /**
   * Render individual project item
   */
  const renderProjectItem = ({ item }) => {
    const progress = calculateProgress(item.id);
    const taskCount = getTaskCountString(item.id);
    const taskStatus = getTaskStatusText(item.id);

    return (
      <View style={[
        styles.projectCard,
        isWeb && styles.projectCardWeb
      ]}>
        {/* Project Header with Image and Actions */}
        <View style={styles.projectHeader}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.projectImage}
            />
          ) : (
            <View style={styles.projectImagePlaceholder}>
              <Ionicons name="folder" size={24} color="white" />
            </View>
          )}

          <View style={styles.headerRight}>
            {/* Priority Badge */}
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: `${getPriorityColor(item.priority)}20` },
              ]}
            >
              <Text
                style={[
                  styles.priorityText,
                  { color: getPriorityColor(item.priority) },
                ]}
              >
                {item.priority?.toUpperCase() || "NORMAL"}
              </Text>
            </View>

            {/* Edit Button */}
            <TouchableOpacity
              onPress={(event) => {
                event.stopPropagation();
                handleEditProject(item);
              }}
              style={styles.editButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={`Edit ${item.title}`}
            >
              <Ionicons name="create-outline" size={22} color="#3b82f6" />
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              onPress={(event) => {
                console.log("Delete button touched for:", item.title);
                event.stopPropagation();
                handleDeleteProject(item);
              }}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={`Delete ${item.title}`}
            >
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Project Title */}
        <Text style={styles.projectTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Project Description (if exists) */}
        {item.description && (
          <Text style={styles.projectDescription} numberOfLines={3}>
            {item.description}
          </Text>
        )}

        {/* Deadline (if exists) */}
        {item.deadline && (
          <View style={styles.deadlineContainer}>
            <Ionicons name="calendar-outline" size={14} color="#64748b" />
            <Text style={styles.deadlineText}>
              Due: {formatDate(item.deadline)}
            </Text>
          </View>
        )}

        {/* Progress Section with Task Count */}
        <View style={styles.progressContainer}>
          <CircularProgress progress={progress} size={50} />
          <View style={styles.taskInfo}>
            <Text style={styles.taskCount}>{taskCount}</Text>
            <Text style={styles.taskStatus}>{taskStatus}</Text>
          </View>
          <TouchableOpacity 
            style={styles.viewButton}
            onPress={() => handleViewTasks(item)}
            accessibilityLabel={`View tasks for ${item.title}`}
          >
            <Text style={styles.viewButtonText}>View</Text>
            <Ionicons name="chevron-forward" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /**
   * Render empty state when no projects exist
   */
  const renderEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.emptyLogo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.emptyTitle}>No Projects Yet</Text>
        <Text style={styles.emptyText}>
          Create your first project to start organizing your tasks and tracking
          progress.
        </Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleAddProject}
          accessibilityLabel="Create your first project"
        >
          <Text style={styles.createButtonText}>Create Project</Text>
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
      <Header title="Project Pro" onMenuPress={openSidebar} />

      {/* Projects List */}
      <FlatList
        data={projects}
        renderItem={renderProjectItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          projects.length === 0 && styles.emptyListContainer,
          isWeb && styles.listContainerWeb,
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
        numColumns={isWeb ? 2 : 1}
        key={isWeb ? 'web' : 'mobile'} // Force re-render when switching layouts
      />


      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={handleAddProject}
        accessibilityLabel="Add new project"
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* Add Project Modal */}
      <Modal
        visible={showAddProject}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseAddProject}
      >
        <AddProjectScreen onClose={handleCloseAddProject} />
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        visible={showEditProject}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseEditProject}
      >
        {editingProject && (
          <EditProjectScreen 
            project={editingProject}
            onClose={handleCloseEditProject} 
          />
        )}
      </Modal>

      {/* Tasks Screen Modal */}
      <Modal
        visible={showTasksScreen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleBackFromTasks}
      >
        {selectedProject && (
          <TasksScreen
            project={selectedProject}
            selectedTaskId={selectedTaskId}
            onBack={handleBackFromTasks}
          />
        )}
      </Modal>

      {/* Navigation to Calendar/Profile/Settings now handled by React Navigation */}
    </View>
  );
}

/**
 * Styles for the Projects Screen
 * Includes responsive design for web and mobile
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#1e293b",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  logoContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#dbeafe',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  headerLogo: {
    width: 44,
    height: 44,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f97316", // Orange theme color
    textShadow: "0 2px 4px rgba(249, 115, 22, 0.3)", // Subtle orange shadow
  },
  menuButton: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  listContainerWeb: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  separator: {
    height: 16,
  },
  projectCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  projectCardWeb: {
    flex: 1,
    marginHorizontal: 8,
    maxWidth: '48%',
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  projectImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  projectImagePlaceholder: {
    width: 48,
    height: 48,
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  projectTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  projectDescription: {
    color: "#94a3b8",
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  deadlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  deadlineText: {
    color: "#64748b",
    fontSize: 14,
    marginLeft: 8,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    color: "#3b82f6",
    fontSize: 10,
    fontWeight: "bold",
  },
  taskInfo: {
    flex: 1,
    marginLeft: 12,
  },
  taskCount: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  taskStatus: {
    color: "#64748b",
    fontSize: 12,
  },
  viewButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  viewButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
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
  emptyLogo: {
    width: 80,
    height: 80,
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
  createButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  createButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 24,
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