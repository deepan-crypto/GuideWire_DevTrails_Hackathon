import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Bell, AlertCircle, CheckCircle, TrendingUp, Zap } from 'lucide-react-native';
import { getCachedRiderId } from '@/utils/onboardingState';
import { getNotifications, markNotificationAsRead } from '@/utils/api';

interface Notification {
  _id: string;
  type: 'WEATHER_PAYOUT' | 'POLICY_ACTIVE' | 'CLAIM_APPROVED' | 'INFO';
  title: string;
  message: string;
  amount?: number;
  trigger_type?: string;
  zone?: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const riderId = getCachedRiderId();
      if (!riderId) return;
      const data = await getNotifications(riderId, 50);
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notif: Notification) => {
    if (!notif.is_read) {
      try {
        const riderId = getCachedRiderId();
        if (riderId) {
          await markNotificationAsRead(riderId, notif._id);
          setNotifications(
            notifications.map(n =>
              n._id === notif._id ? { ...n, is_read: true } : n
            )
          );
        }
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'WEATHER_PAYOUT':
        return '⛈️';
      case 'POLICY_ACTIVE':
        return '✅';
      case 'CLAIM_APPROVED':
        return '💰';
      default:
        return 'ℹ️';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Bell size={24} color="#1A1A24" />
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#E63946" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContent}>
          <Bell size={48} color="#CCC" />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubText}>You'll see weather alerts & payouts here</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {notifications.map((notif) => (
            <TouchableOpacity
              key={notif._id}
              style={[styles.notificationCard, !notif.is_read && styles.unreadCard]}
              onPress={() => handleNotificationPress(notif)}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{getNotificationIcon(notif.type)}</Text>
              </View>

              <View style={styles.contentContainer}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, !notif.is_read && styles.titleBold]}>
                    {notif.title}
                  </Text>
                  {notif.amount && (
                    <Text style={styles.amount}>₹{notif.amount}</Text>
                  )}
                </View>

                <Text style={styles.message}>{notif.message}</Text>

                <View style={styles.metaRow}>
                  {notif.trigger_type && (
                    <View style={styles.badge2}>
                      <Text style={styles.badge2Text}>
                        {notif.trigger_type === 'WEATHER' ? '🌧️' : '⚙️'} {notif.trigger_type}
                      </Text>
                    </View>
                  )}
                  {notif.zone && (
                    <Text style={styles.metaText}>{notif.zone}</Text>
                  )}
                  <Text style={styles.timestamp}>
                    {new Date(notif.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {!notif.is_read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E9F2',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A24',
  },
  badge: {
    backgroundColor: '#E63946',
    borderRadius: 10,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },

  content: {
    flex: 1,
    padding: 16,
  },

  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },

  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E9F2',
  },
  unreadCard: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FECACA',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },

  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A24',
    flex: 1,
  },
  titleBold: {
    fontWeight: '700',
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00A25B',
  },
  message: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    marginBottom: 8,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge2: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D9F6',
  },
  badge2Text: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0066CC',
  },
  metaText: {
    fontSize: 11,
    color: '#888',
  },
  timestamp: {
    fontSize: 10,
    color: '#AAA',
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E63946',
  },
});
