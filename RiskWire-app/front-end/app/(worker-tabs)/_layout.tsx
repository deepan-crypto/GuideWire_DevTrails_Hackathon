import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { LayoutDashboard, User, IndianRupee, Bell } from 'lucide-react-native';

const PB_NAVY = '#0F4C81';

export default function WorkerTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: PB_NAVY,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: styles.label,
        tabBarIconStyle: styles.icon,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="payouts"
        options={{
          title: 'Payouts',
          tabBarIcon: ({ color }) => <IndianRupee size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="updates"
        options={{
          title: 'Updates',
          tabBarIcon: ({ color }) => <Bell size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E5E9F2',
    borderTopWidth: 1,
    height: 80,
    paddingTop: 8,
    paddingBottom: 16,
  },
  label: { fontSize: 11, fontWeight: '700' },
  icon: { marginBottom: 2 },
});
