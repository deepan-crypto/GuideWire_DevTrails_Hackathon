import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { loadOnboardingState, isOnboardingComplete, hasSeenIntro } from '@/utils/onboardingState';
import { router } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  useFrameworkReady();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadOnboardingState().then(() => {
      const introSeen = hasSeenIntro();
      const onboardingDone = isOnboardingComplete();

      // Routing logic:
      // 1. If onboarding is complete → go directly to worker-tabs (dashboard)
      // 2. If intro seen but onboarding NOT done → show onboarding (gig worker verification)
      // 3. Otherwise → stay on (tabs) info pages (initialRouteName handles this)
      if (onboardingDone) {
        router.replace('/(worker-tabs)' as any);
      } else if (introSeen) {
        router.replace('/onboarding' as any);
      }
      // If intro NOT seen, do nothing — (tabs) is the initialRouteName
      setReady(true);
    });
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
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

