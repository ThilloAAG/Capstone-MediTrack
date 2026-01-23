import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../src/firebase';
import { doctorNotificationService } from '../../../services/doctorNotificationService';

// ✅ Type definition
type DoctorNotification = {
  id: string;
  doctorId: string;
  category: 'alert' | 'interaction' | 'message' | 'appointment' | 'lab';
  title: string;
  description: string;
  patientName?: string;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: Date;
};

const CATEGORIES = ['All', 'Alerts', 'Messages', 'Schedule'];

export default function NotificationsScreen() {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  const [activeTab, setActiveTab] = useState('All');
  const [notifications, setNotifications] = useState<DoctorNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Fetch notifications with proper typing
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const notificationsRef = collection(db, 'doctorNotifications');

      let q;
      if (activeTab === 'All') {
        q = query(
          notificationsRef,
          where('doctorId', '==', userId),
          where('isDismissed', '==', false)
        );
      } else {
        const categoryMap: { [key: string]: string } = {
          'Alerts': 'alert',
          'Messages': 'message',
          'Schedule': 'appointment',
        };
        q = query(
          notificationsRef,
          where('doctorId', '==', userId),
          where('category', '==', categoryMap[activeTab]),
          where('isDismissed', '==', false)
        );
      }

      const snapshot = await getDocs(q);

      // ✅ Cast Firestore data to our type
      const data: DoctorNotification[] = snapshot.docs.map((doc) => {
        const d = doc.data() as any;
        return {
          id: doc.id,
          doctorId: d.doctorId || '',
          category: d.category || 'alert',
          title: d.title || '',
          description: d.description || '',
          patientName: d.patientName,
          isRead: !!d.isRead,
          isDismissed: !!d.isDismissed,
          createdAt: d.createdAt?.toDate?.() || new Date(),
        };
      });

      // Sort by newest first
      data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setNotifications(data);

      // Count unread
      const unread = data.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, activeTab]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // ✅ Handle mark as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await doctorNotificationService.markAsRead(notificationId);
      fetchNotifications(); // Refresh list
    } catch (error) {
      console.error('Error marking as read:', error);
      Alert.alert('Error', 'Failed to mark as read');
    }
  };

  // ✅ Handle dismiss
  const handleDismiss = async (notificationId: string) => {
    try {
      await doctorNotificationService.dismissNotification(notificationId);
      fetchNotifications(); // Refresh list
      Alert.alert('Success', 'Notification dismissed');
    } catch (error) {
      console.error('Error dismissing:', error);
      Alert.alert('Error', 'Failed to dismiss');
    }
  };

  // ✅ Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await doctorNotificationService.markAllAsRead(userId);
      fetchNotifications(); // Refresh list
      Alert.alert('Success', 'All marked as read');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  // ✅ Group notifications by date
  const groupedNotifications = notifications.reduce(
    (acc, notif) => {
      const date = new Date(notif.createdAt);
      const isToday = new Date().toDateString() === date.toDateString();
      const key = isToday ? 'New Alerts' : 'Earlier Today';

      if (!acc[key]) acc[key] = [];
      acc[key].push(notif);
      return acc;
    },
    {} as { [key: string]: DoctorNotification[] }
  );

  const renderNotificationCard = (notification: DoctorNotification) => (
    <View key={notification.id} style={styles.card}>
      {/* Left colored border */}
      <View
        style={[
          styles.leftBorder,
          {
            backgroundColor: getColorForCategory(notification.category).border,
          },
        ]}
      />

      <View style={styles.content}>
        {/* Icon + Title + Time */}
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: getColorForCategory(notification.category).bg,
              },
            ]}
          >
            <Ionicons
              name={getIconForCategory(notification.category)}
              size={24}
              color={getColorForCategory(notification.category).icon}
            />
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.title}>{notification.title}</Text>
            <Text style={styles.description}>{notification.description}</Text>
          </View>

          <View style={styles.rightSection}>
            <Text style={styles.timeAgo}>
              {getTimeAgo(notification.createdAt)}
            </Text>
            {!notification.isRead && <View style={styles.unreadDot} />}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          {notification.category === 'alert' && (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => handleMarkAsRead(notification.id)}
              >
                <Text style={styles.primaryButtonText}>Mark Read</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => handleDismiss(notification.id)}
              >
                <Text style={styles.secondaryButtonText}>Dismiss</Text>
              </TouchableOpacity>
            </>
          )}
          {notification.category === 'interaction' && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => handleMarkAsRead(notification.id)}
            >
              <Text style={styles.primaryButtonText}>Review</Text>
            </TouchableOpacity>
          )}
          {notification.category === 'message' && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => handleMarkAsRead(notification.id)}
            >
              <Text style={styles.primaryButtonText}>Reply</Text>
            </TouchableOpacity>
          )}
          {(notification.category === 'appointment' ||
            notification.category === 'lab') && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => handleMarkAsRead(notification.id)}
            >
              <Text style={styles.secondaryButtonText}>View</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderSection = (title: string, items: DoctorNotification[]) => (
    <View key={title}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((notification) => renderNotificationCard(notification))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.titleContainer}>
          <Ionicons name="notifications" size={28} color="#1F2937" />
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.tab,
              activeTab === category && styles.activeTab,
            ]}
            onPress={() => setActiveTab(category)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === category && styles.activeTabText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount} UNREAD</Text>
          </View>
        </View>
      )}

      {/* Notifications List */}
      <FlatList
        data={Object.entries(groupedNotifications).flatMap(([, items]) => items)}
        renderItem={({ item }) => {
          const dateKey =
            new Date(item.createdAt).toDateString() === new Date().toDateString()
              ? 'New Alerts'
              : 'Earlier Today';
          const isFirstInSection =
            groupedNotifications[dateKey]?.[0]?.id === item.id;

          return isFirstInSection
            ? renderSection(dateKey, groupedNotifications[dateKey])
            : null;
        }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="notifications-off-outline"
              size={48}
              color="#D1D5DB"
            />
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ✅ Helper functions
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function getIconForCategory(
  category: string
): keyof typeof Ionicons.glyphMap {
  switch (category) {
    case 'alert':
      return 'warning';
    case 'interaction':
      return 'shield';
    case 'message':
      return 'chatbubble';
    case 'appointment':
      return 'calendar';
    case 'lab':
      return 'flask';
    default:
      return 'information-circle';
  }
}

function getColorForCategory(category: string) {
  switch (category) {
    case 'alert':
      return { bg: '#FEE2E2', border: '#FECACA', icon: '#DC2626' };
    case 'interaction':
      return { bg: '#FEF3C7', border: '#FCD34D', icon: '#D97706' };
    case 'message':
      return { bg: '#DBEAFE', border: '#93C5FD', icon: '#0284C7' };
    case 'appointment':
      return { bg: '#F0F9FF', border: '#BAE6FD', icon: '#0284C7' };
    case 'lab':
      return { bg: '#E0E7FF', border: '#C7D2FE', icon: '#4F46E5' };
    default:
      return { bg: '#F3F4F6', border: '#D1D5DB', icon: '#6B7280' };
  }
}

// ✅ Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  markAllRead: {
    color: '#0284C7',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#0284C7',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#0284C7',
    fontWeight: '600',
  },
  badgeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  badge: {
    backgroundColor: '#DBEAFE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  leftBorder: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleSection: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  timeAgo: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284C7',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#1F2937',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
});
