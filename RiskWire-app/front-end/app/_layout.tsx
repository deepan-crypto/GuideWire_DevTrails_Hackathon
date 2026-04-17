import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { loadOnboardingState, isOnboardingComplete, hasSeenIntro, clearOnboardingState } from '@/utils/onboardingState';
import { router } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  useFrameworkReady();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadOnboardingState().then(() => {
      const onboardingDone = isOnboardingComplete();

      // Routing logic:
      // 1. If onboarding is complete → go to worker dashboard
      // 2. Otherwise → stay on (tabs) info pages (the initialRouteName)
      //    The (tabs) pages handle routing to onboarding when user is ready
      if (onboardingDone) {
        router.replace('/(worker-tabs)' as any);
      }
      // Default: stay on (tabs) — the 4 info pages (Home, Expert, Products, Understand)
      setReady(true);
    });
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(worker-tabs)" />
        <Stack.Screen name="plans" />
        <Stack.Screen name="activate" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
