/**
 * AnalyticsScreen.js - User Analytics and Insights Dashboard
 * 
 * This screen provides comprehensive analytics about user productivity:
 * - Project completion rates and trends
 * - Task productivity metrics
 * - Priority distribution analysis
 * - Time-based completion patterns
 * - Visual progress bars and indicators
 * 
 * Features:
 * - Real-time data aggregation from Firestore
 * - Custom CSS-based charts and progress indicators
 * - Time period filtering (week/month/year)
 * - Performance insights and recommendations
 * 
 * @param {Object} navigation - React Navigation object for screen navigation
 * @param {Function} openSidebar - Function to open the sidebar menu
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import Header from '../components/Header';

const { width: screenWidth } = Dimensions.get('window');

const AnalyticsScreen = ({ navigation, openSidebar }) => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [timeRange, setTimeRange] = useState('month'); // week, month, year
  const [analytics, setAnalytics] = useState({
    completionRate: 0,
    totalProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    priorityDistribution: { high: 0, medium: 0, low: 0 },
    weeklyProgress: [],
    avgCompletionTime: 0
  });

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Listen to projects
    const projectsQuery = query(
      collection(db, 'projects'),
      where('userId', '==', currentUser.uid)
    );
    
    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = [];
      snapshot.forEach(doc => {
        projectsData.push({ id: doc.id, ...doc.data() });
      });
      setProjects(projectsData);
    });

    // Listen to tasks
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', currentUser.uid)
    );
    
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = [];
      snapshot.forEach(doc => {
        tasksData.push({ id: doc.id, ...doc.data() });
      });
      setTasks(tasksData);
    });

    return () => {
      unsubProjects();
      unsubTasks();
    };
  }, []);

  useEffect(() => {
    calculateAnalytics();
  }, [projects, tasks, timeRange]);

  const calculateAnalytics = () => {
    if (!projects.length && !tasks.length) return;

    const now = new Date();
    const timeRangeMs = {
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000
    };

    const cutoffDate = new Date(now.getTime() - timeRangeMs[timeRange]);

    // Filter data by time range
    const recentProjects = projects.filter(project => 
      project.createdAt && project.createdAt.toDate() >= cutoffDate
    );
    
    const recentTasks = tasks.filter(task => 
      task.createdAt && task.createdAt.toDate() >= cutoffDate
    );

    // Calculate completion rates
    const completedProjects = recentProjects.filter(p => p.completed).length;
    const completedTasks = recentTasks.filter(t => t.completed).length;
    const projectCompletionRate = recentProjects.length ? 
      Math.round((completedProjects / recentProjects.length) * 100) : 0;

    // Priority distribution
    const priorityCount = { high: 0, medium: 0, low: 0, urgent: 0 };
    [...recentProjects, ...recentTasks].forEach(item => {
      let priority = item.priority?.toLowerCase() || 'medium';
      if (priority === 'urgent') priority = 'high';
      priorityCount[priority] = (priorityCount[priority] || 0) + 1;
    });

    // Weekly progress (last 7 periods)
    const weeklyProgress = [];
    const weeksToShow = 7;
    const intervalMs = timeRange === 'year' ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

    for (let i = weeksToShow - 1; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i * intervalMs));
      const weekEnd = new Date(weekStart.getTime() + intervalMs);
      
      const weekCompletions = [...recentProjects, ...recentTasks].filter(item => 
        item.completedAt && 
        item.completedAt.toDate() >= weekStart && 
        item.completedAt.toDate() < weekEnd
      ).length;

      weeklyProgress.push(weekCompletions);
    }

    // Average completion time (in days)
    const completedItems = [...recentProjects, ...recentTasks].filter(item => 
      item.completed && item.createdAt && item.completedAt
    );
    
    const avgCompletionTime = completedItems.length ? 
      completedItems.reduce((sum, item) => {
        const created = item.createdAt.toDate();
        const completed = item.completedAt.toDate();
        const days = Math.ceil((completed - created) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0) / completedItems.length : 0;

    setAnalytics({
      completionRate: projectCompletionRate,
      totalProjects: recentProjects.length,
      completedProjects,
      totalTasks: recentTasks.length,
      completedTasks,
      priorityDistribution: priorityCount,
      weeklyProgress,
      avgCompletionTime: Math.round(avgCompletionTime * 10) / 10
    });
  };

  // Custom Progress Bar Component
  const ProgressBar = ({ percentage, color = '#f97316', height = 8 }) => (
    <View style={[styles.progressBarContainer, { height }]}>
      <View 
        style={[
          styles.progressBarFill, 
          { 
            width: `${Math.min(percentage, 100)}%`, 
            backgroundColor: color 
          }
        ]} 
      />
    </View>
  );

  // Custom Chart Bar Component
  const ChartBar = ({ value, maxValue, label, color = '#10b981' }) => {
    const height = maxValue ? (value / maxValue) * 100 : 0;
    return (
      <View style={styles.chartBar}>
        <View style={styles.chartBarContainer}>
          <View 
            style={[
              styles.chartBarFill, 
              { 
                height: `${Math.min(height, 100)}%`, 
                backgroundColor: color 
              }
            ]} 
          />
        </View>
        <Text style={styles.chartBarLabel}>{label}</Text>
        <Text style={styles.chartBarValue}>{value}</Text>
      </View>
    );
  };

  // Custom Pie Chart Component (using stacked bars)
  const PriorityChart = () => {
    const total = analytics.priorityDistribution.high + 
                  analytics.priorityDistribution.medium + 
                  analytics.priorityDistribution.low;
    
    if (total === 0) return <Text style={styles.noDataText}>No data available</Text>;

    const highPercent = (analytics.priorityDistribution.high / total) * 100;
    const mediumPercent = (analytics.priorityDistribution.medium / total) * 100;
    const lowPercent = (analytics.priorityDistribution.low / total) * 100;

    return (
      <View style={styles.priorityChart}>
        <View style={styles.priorityBar}>
          {highPercent > 0 && (
            <View style={[styles.prioritySegment, { flex: highPercent, backgroundColor: '#ef4444' }]} />
          )}
          {mediumPercent > 0 && (
            <View style={[styles.prioritySegment, { flex: mediumPercent, backgroundColor: '#f59e0b' }]} />
          )}
          {lowPercent > 0 && (
            <View style={[styles.prioritySegment, { flex: lowPercent, backgroundColor: '#10b981' }]} />
          )}
        </View>
        <View style={styles.priorityLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>High ({analytics.priorityDistribution.high})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>Medium ({analytics.priorityDistribution.medium})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Low ({analytics.priorityDistribution.low})</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Analytics" onMenuPress={openSidebar} navigation={navigation} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <Text style={styles.sectionTitle}>Time Range</Text>
          <View style={styles.timeRangeButtons}>
            {['week', 'month', 'year'].map(range => (
              <TouchableOpacity
                key={range}
                style={[styles.timeButton, timeRange === range && styles.activeTimeButton]}
                onPress={() => setTimeRange(range)}
              >
                <Text style={[styles.timeButtonText, timeRange === range && styles.activeTimeButtonText]}>
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Key Metrics Cards */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{analytics.completionRate}%</Text>
            <Text style={styles.metricLabel}>Completion Rate</Text>
            <ProgressBar percentage={analytics.completionRate} color="#10b981" />
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{analytics.totalProjects}</Text>
            <Text style={styles.metricLabel}>Total Projects</Text>
            <Text style={styles.metricSubLabel}>({analytics.completedProjects} completed)</Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{analytics.totalTasks}</Text>
            <Text style={styles.metricLabel}>Total Tasks</Text>
            <Text style={styles.metricSubLabel}>({analytics.completedTasks} completed)</Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{analytics.avgCompletionTime}</Text>
            <Text style={styles.metricLabel}>Avg Days</Text>
            <Text style={styles.metricSubLabel}>to complete</Text>
          </View>
        </View>

        {/* Progress Trend Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Recent Completions</Text>
          <View style={styles.barChart}>
            {analytics.weeklyProgress.map((value, index) => {
              const maxValue = Math.max(...analytics.weeklyProgress, 1);
              return (
                <ChartBar
                  key={index}
                  value={value}
                  maxValue={maxValue}
                  label={`W${index + 1}`}
                  color="#10b981"
                />
              );
            })}
          </View>
        </View>

        {/* Priority Distribution */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Priority Distribution</Text>
          <PriorityChart />
        </View>

        {/* Insights Section */}
        <View style={styles.insightsContainer}>
          <Text style={styles.sectionTitle}>Insights</Text>
          
          <View style={styles.insightItem}>
            <Text style={styles.insightText}>
              📈 You've completed {analytics.completedProjects + analytics.completedTasks} items this {timeRange}
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <Text style={styles.insightText}>
              ⏱️ Your average completion time is {analytics.avgCompletionTime} days
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <Text style={styles.insightText}>
              🎯 {analytics.completionRate >= 80 ? 'Excellent completion rate!' : 
                  analytics.completionRate >= 60 ? 'Good progress, keep it up!' :
                  'Consider breaking down tasks into smaller chunks'}
            </Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  timeRangeContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeTimeButton: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  timeButtonText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTimeButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f97316',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  metricSubLabel: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  // Progress Bar Styles
  progressBarContainer: {
    width: '100%',
    backgroundColor: '#374151',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 2,
  },
  chartContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 8,
  },
  // Bar Chart Styles
  barChart: {
    flexDirection: 'row',
    height: 150,
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  chartBarContainer: {
    height: 100,
    width: 24,
    backgroundColor: '#374151',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 4,
    minHeight: 2,
  },
  chartBarLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  chartBarValue: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
  // Priority Chart Styles
  priorityChart: {
    alignItems: 'center',
  },
  priorityBar: {
    flexDirection: 'row',
    width: screenWidth - 80,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  prioritySegment: {
    height: '100%',
  },
  priorityLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  noDataText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  insightsContainer: {
    marginBottom: 24,
  },
  insightItem: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f97316',
  },
  insightText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default AnalyticsScreen;