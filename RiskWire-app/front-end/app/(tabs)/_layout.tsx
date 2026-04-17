import { useState, useEffect, useCallback } from 'react';
import { Tabs, useFocusEffect, router } from 'expo-router';
import { Hop as Home, UserCircle, Users, FileText, Shield } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { hasSeenIntro } from '@/utils/onboardingState';

export default function TabLayout() {
  const [showTabs, setShowTabs] = useState(true);

  // Load intro status on mount
  useEffect(() => {
    setShowTabs(true);
  }, []);

  // Keep tabs visible while user browses
  useFocusEffect(
    useCallback(() => {
      setShowTabs(true);
    }, [])
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#0066CC',
        tabBarInactiveTintColor: '#999999',
        tabBarLabelStyle: styles.tabLabel,
        tabBarIconStyle: styles.tabIcon,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
          href: '/',
        }}
      />
      <Tabs.Screen
        name="expert"
        options={{
          title: 'Expert',
          tabBarIcon: ({ color }) => <Users color={color} size={24} />,
          href: '/expert',
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color }) => <Shield color={color} size={24} />,
          href: '/products',
        }}
      />
      <Tabs.Screen
        name="understand"
        options={{
          title: 'Understand',
          tabBarIcon: ({ color }) => <FileText color={color} size={24} />,
          href: '/understand',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <UserCircle color={color} size={24} />,
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopColor: '#E5E5E5',
    borderTopWidth: 1,
    backgroundColor: '#FFFFFF',
    height: 80,
    paddingTop: 8,
    paddingBottom: 16,
  },
  tabBarHidden: {
    display: 'none',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  tabIcon: {
    marginBottom: 4,
  },
});
