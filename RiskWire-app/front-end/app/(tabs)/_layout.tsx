import { useState, useEffect, useCallback } from 'react';
import { Tabs, useFocusEffect, router } from 'expo-router';
import { Hop as Home, UserCircle, Users, FileText, Shield } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { loadOnboardingState, isOnboardingComplete } from '@/utils/onboardingState';

export default function TabLayout() {
  const [userCreated, setUserCreated] = useState(isOnboardingComplete());

  // Load from storage on mount
  useEffect(() => {
    loadOnboardingState().then((done) => {
      setUserCreated(done);
      // If already created, go to worker tabs (has bottom tab bar)
      if (done) {
        router.replace('/(worker-tabs)' as any);
      }
    });
  }, []);

  // Re-check on focus (e.g., returning from activate)
  useFocusEffect(
    useCallback(() => {
      const done = isOnboardingComplete();
      setUserCreated(done);
      if (done) {
        router.replace('/(worker-tabs)' as any);
      }
    }, [])
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: userCreated ? styles.tabBarHidden : styles.tabBar,
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
          href: userCreated ? null : '/',
        }}
      />
      <Tabs.Screen
        name="expert"
        options={{
          title: 'Expert',
          tabBarIcon: ({ color }) => <Users color={color} size={24} />,
          href: userCreated ? null : '/expert',
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color }) => <Shield color={color} size={24} />,
          href: userCreated ? null : '/products',
        }}
      />
      <Tabs.Screen
        name="understand"
        options={{
          title: 'Understand',
          tabBarIcon: ({ color }) => <FileText color={color} size={24} />,
          href: userCreated ? null : '/understand',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <UserCircle color={color} size={24} />,
          // Profile tab hidden; profile is accessed from Dashboard as a stack screen
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
