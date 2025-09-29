  /**
   * Get priority color based on priority level (matching ProjectsScreen)
   */
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
      case "high":
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
 * CalendarScreen.js - Calendar View with Project and Task Deadlines
 *
 * This screen displays a calendar with the following features:
 * - Monthly calendar view showing current month by default
 * - Visual indicators for project deadlines
 * - Visual indicators for task deadlines
 * - Month navigation (previous/next)
 * - Real-time data from Firestore
 * - Responsive design for web and mobile
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import Header from '../components/Header';
import Ionicons from '@expo/vector-icons/Ionicons';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { safeToDateString, dateToLocalString } from '../utils/dateUtils';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getMonthMatrix(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const matrix = [];
  let week = [];
  let dayOfWeek = firstDay.getDay();
  // Fill initial empty days
  for (let i = 0; i < dayOfWeek; i++) week.push(null);
  for (let date = 1; date <= lastDay.getDate(); date++) {
    week.push(new Date(year, month, date));
    if (week.length === 7) {
      matrix.push(week);
      week = [];
    }
  }
  // Fill trailing empty days
  if (week.length) {
    while (week.length < 7) week.push(null);
    matrix.push(week);
  }
  return matrix;
}

export default function CalendarScreen({ navigation, openSidebar, onDeadlinePress }) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [deadlines, setDeadlines] = useState({}); // { 'YYYY-MM-DD': [ { type, title, ... }, ... ] }
  const [selectedDate, setSelectedDate] = useState(null); // { iso: 'YYYY-MM-DD', dateObj: Date }
  const [projects, setProjects] = useState({}); // { projectId: { title, ... } }
  const [taskCounts, setTaskCounts] = useState({}); // { projectId: { total, completed } }
  const monthMatrix = getMonthMatrix(year, month);
  const displayMonthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    function toDateString(deadline) {
      let date = deadline;
      if (date && typeof date === 'object' && date.toDate) {
        date = date.toDate();
      } else if (date && !(date instanceof Date)) {
        date = new Date(date);
      }
      if (date instanceof Date && !isNaN(date)) {
        // Use local timezone to avoid timezone shift issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return null;
    }

    // Listen for project deadlines
    const projectsQuery = query(
      collection(db, 'projects'),
      where('userId', '==', currentUser.uid)
    );
    const unsubProjects = onSnapshot(projectsQuery, (querySnapshot) => {
      const projectDeadlines = {};
      const projectsData = {};
      
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const projectId = docSnap.id;
        
        // Store project data for lookup
        projectsData[projectId] = {
          id: projectId,
          title: data.title,
          ...data
        };
        
        // Process deadline
        const dateStr = toDateString(data.deadline);
        if (dateStr) {
          if (!projectDeadlines[dateStr]) projectDeadlines[dateStr] = [];
          projectDeadlines[dateStr].push({
            type: 'Project',
            title: data.title,
            id: projectId,
            ...data
          });
        }
      });
      
      // Update projects lookup
      setProjects(projectsData);
      
      // Merge with existing deadlines, preserving other types
      setDeadlines(prev => {
        const updated = { ...prev };
        // First, remove old project deadlines
        Object.keys(updated).forEach(dateStr => {
          updated[dateStr] = updated[dateStr].filter(item => item.type !== 'Project');
          if (updated[dateStr].length === 0) {
            delete updated[dateStr];
          }
        });
        // Then add new project deadlines
        Object.keys(projectDeadlines).forEach(dateStr => {
          if (!updated[dateStr]) updated[dateStr] = [];
          updated[dateStr] = [...updated[dateStr], ...projectDeadlines[dateStr]];
        });
        return updated;
      });
    });

    // Listen for all tasks to calculate task counts per project
    const allTasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', currentUser.uid)
    );
    const unsubAllTasks = onSnapshot(allTasksQuery, (querySnapshot) => {
      const counts = {};
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const projectId = data.projectId;
        if (projectId) {
          if (!counts[projectId]) {
            counts[projectId] = { total: 0, completed: 0 };
          }
          counts[projectId].total++;
          if (data.completed) {
            counts[projectId].completed++;
          }
        }
      });
      setTaskCounts(counts);
    });

    // Listen for task deadlines (excluding completed tasks)
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', currentUser.uid),
      where('completed', '==', false)
    );
    const unsubTasks = onSnapshot(tasksQuery, (querySnapshot) => {
      const taskDeadlines = {};
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const dateStr = toDateString(data.deadline);
        if (dateStr) {
          if (!taskDeadlines[dateStr]) taskDeadlines[dateStr] = [];
          taskDeadlines[dateStr].push({
            type: 'Task',
            title: data.title,
            id: docSnap.id,
            projectId: data.projectId,
            ...data
          });
        }
      });
      
      // Merge with existing deadlines, preserving other types
      setDeadlines(prev => {
        const updated = { ...prev };
        // First, remove old task deadlines
        Object.keys(updated).forEach(dateStr => {
          updated[dateStr] = updated[dateStr].filter(item => item.type !== 'Task');
          if (updated[dateStr].length === 0) {
            delete updated[dateStr];
          }
        });
        // Then add new task deadlines
        Object.keys(taskDeadlines).forEach(dateStr => {
          if (!updated[dateStr]) updated[dateStr] = [];
          updated[dateStr] = [...updated[dateStr], ...taskDeadlines[dateStr]];
        });
        return updated;
      });
    });

    return () => {
      unsubProjects();
      unsubAllTasks();
      unsubTasks();
    };
  }, []);

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };
  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  // List of deadlines for selected date
  const selectedDeadlines = selectedDate && deadlines[selectedDate.iso] ? deadlines[selectedDate.iso] : [];

  // Format for header: 'Deadlines for 30th September'
  function formatDeadlineHeader(dateObj) {
    if (!dateObj) return '';
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString('default', { month: 'long' });
    // Add ordinal suffix
    const j = day % 10, k = day % 100;
    let suffix = 'th';
    if (j === 1 && k !== 11) suffix = 'st';
    else if (j === 2 && k !== 12) suffix = 'nd';
    else if (j === 3 && k !== 13) suffix = 'rd';
    return `${day}${suffix} ${month}`;
  }

  return (
    <View style={styles.container}>
      <Header title="Calendar" onMenuPress={openSidebar} navigation={navigation} />
      <View style={styles.calendarContainer}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
            <Ionicons name="chevron-back" size={24} color="#3b82f6" />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{displayMonthName}</Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
            <Ionicons name="chevron-forward" size={24} color="#3b82f6" />
          </TouchableOpacity>
        </View>
        <View style={styles.daysRow}>
          {DAYS.map(day => (
            <Text key={day} style={styles.dayLabel}>{day}</Text>
          ))}
        </View>
        {monthMatrix.map((week, i) => (
          <View key={i} style={styles.weekRow}>
            {week.map((date, j) => {
              let dateStr = dateToLocalString(date);
              let isToday = date && date.toDateString() === today.toDateString();
              let hasDeadline = deadlines[dateStr] && deadlines[dateStr].length > 0;
              let isSelected = selectedDate && selectedDate.iso === dateStr;
              return (
                <TouchableOpacity
                  key={j}
                  style={[
                    styles.dayCell, 
                    isToday && styles.todayCell,
                    isSelected && styles.selectedCell
                  ]}
                  onPress={() => {
                    if (date) setSelectedDate({ iso: dateToLocalString(date), dateObj: date });
                  }}
                  activeOpacity={date ? 0.7 : 1}
                  disabled={!date}
                >
                  {date && (
                    <>
                      <Text style={[styles.dateText, isToday && styles.todayText]}>{date.getDate()}</Text>
                      {hasDeadline && <View style={styles.deadlineDot} />}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
      {/* List of deadlines for selected date */}
      {selectedDate && (
        <View style={styles.deadlineListContainer}>
          <Text style={styles.deadlineListTitle}>
            Deadlines for {formatDeadlineHeader(selectedDate.dateObj)}
          </Text>
          {selectedDeadlines.length === 0 ? (
            <Text style={styles.noDeadlinesText}>No deadlines for this date.</Text>
          ) : (
            <ScrollView style={{ maxHeight: 180 }}>
              {selectedDeadlines.map((item, idx) => {
                // Enhanced display text based on item type
                let displayText = '';
                let subText = '';
                
                if (item.type === 'Project') {
                  const taskCount = taskCounts[item.id];
                  const remaining = taskCount ? taskCount.total - taskCount.completed : 0;
                  displayText = `Project: ${item.title}`;
                  subText = remaining > 0 ? `${remaining} task${remaining !== 1 ? 's' : ''} remaining` : 'All tasks complete';
                } else if (item.type === 'Task') {
                  const projectTitle = projects[item.projectId]?.title || 'Unknown Project';
                  displayText = `Task: ${item.title}`;
                  subText = `Project: ${projectTitle}`;
                }

                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.deadlineItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      // Navigate to Projects screen - the tasks modal is handled there
                      const projectId = item.type === 'Project' ? item.id : item.projectId;
                      if (projectId && navigation) {
                        // Navigate to Projects screen with a project ID to auto-open tasks
                        navigation.navigate('Projects', { openProjectId: projectId });
                      }
                    }}
                  >
                    <View style={styles.deadlineItemContent}>
                      <View style={styles.deadlineTextContainer}>
                        <Text style={styles.deadlineTitle}>{displayText}</Text>
                        <Text style={styles.deadlineSubtitle}>{subText}</Text>
                      </View>
                      {item.priority && (
                        <View style={[
                          styles.priorityIndicator,
                          { backgroundColor: `${getPriorityColor(item.priority)}20` }
                        ]}>
                          <Text style={[
                            styles.priorityText,
                            { color: getPriorityColor(item.priority) }
                          ]}>
                            {item.priority.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  calendarContainer: {
    margin: 16,
    marginTop: 24,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    padding: 12,
    elevation: 2,
    // Take about half the screen height
    minHeight: Dimensions.get('window').height * 0.45,
    maxHeight: Dimensions.get('window').height * 0.55,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  monthNavBtn: {
    padding: 8,
    borderRadius: 8,
  },
  monthLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f97316',
    textAlign: 'center',
    flex: 1,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    color: '#64748b',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 1,
    borderRadius: 8,
  },
  todayCell: {
    backgroundColor: '#3b82f6',
  },
  selectedCell: {
    borderWidth: 2,
    borderColor: '#f97316',
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  todayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deadlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
    marginTop: 2,
  },
  deadlineListContainer: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    elevation: 1,
  },
  deadlineListTitle: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 6,
  },
  noDeadlinesText: {
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  deadlineItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  deadlineItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  deadlineTextContainer: {
    flex: 1,
  },
  priorityIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  deadlineType: {
    color: '#3b82f6',
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 14,
    minWidth: 60,
  },
  deadlineTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  deadlineSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontStyle: 'italic',
  },
});
