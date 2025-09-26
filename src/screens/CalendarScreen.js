// Utility to safely convert Firestore Timestamp, string, or Date to a valid date string
function safeToDateString(deadline) {
  let date = deadline;
  if (date && typeof date === 'object' && date.toDate) {
    date = date.toDate();
  } else if (date && !(date instanceof Date)) {
    date = new Date(date);
  }
  return date instanceof Date && !isNaN(date) ? date.toDateString() : '';
}
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
        return date.toISOString().slice(0, 10);
      }
      return null;
    }

    // Listen for project deadlines
    const projectsQuery = query(
      collection(db, 'projects'),
      where('userId', '==', currentUser.uid)
    );
    const unsubProjects = onSnapshot(projectsQuery, (querySnapshot) => {
      const newDeadlines = {};
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const dateStr = toDateString(data.deadline);
        if (dateStr) {
          if (!newDeadlines[dateStr]) newDeadlines[dateStr] = [];
          newDeadlines[dateStr].push({
            type: 'Project',
            title: data.title,
            ...data
          });
        }
      });
      setDeadlines(prev => ({ ...prev, ...newDeadlines }));
    });

    // Listen for task deadlines
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', currentUser.uid)
    );
    const unsubTasks = onSnapshot(tasksQuery, (querySnapshot) => {
      const newDeadlines = {};
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const dateStr = toDateString(data.deadline);
        if (dateStr) {
          if (!newDeadlines[dateStr]) newDeadlines[dateStr] = [];
          newDeadlines[dateStr].push({
            type: 'Task',
            title: data.title,
            ...data
          });
        }
      });
      setDeadlines(prev => ({ ...prev, ...newDeadlines }));
    });

    return () => {
      unsubProjects();
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
              let dateStr = date ? date.toISOString().slice(0, 10) : '';
              let isToday = date && date.toDateString() === today.toDateString();
              let hasDeadline = deadlines[dateStr] && deadlines[dateStr].length > 0;
              return (
                <TouchableOpacity
                  key={j}
                  style={[styles.dayCell, isToday && styles.todayCell]}
                  onPress={() => {
                    if (date) setSelectedDate({ iso: date.toISOString().slice(0, 10), dateObj: date });
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
              {selectedDeadlines.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.deadlineItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (typeof onDeadlinePress === 'function') {
                      if (item.type === 'Project') {
                        onDeadlinePress({
                          type: 'Project',
                          projectId: item.id,
                        });
                      } else if (item.type === 'Task') {
                        onDeadlinePress({
                          type: 'Task',
                          projectId: item.projectId,
                          taskId: item.id,
                        });
                      }
                    }
                  }}
                >
                  <Text style={styles.deadlineType}>{item.type}</Text>
                  <Text style={styles.deadlineTitle}>{item.title}</Text>
                </TouchableOpacity>
              ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
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
    flex: 1,
  },
});
