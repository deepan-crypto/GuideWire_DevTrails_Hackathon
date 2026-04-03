import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { loadOnboardingState } from '@/utils/onboardingState';
import { router } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  useFrameworkReady();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadOnboardingState().then((done) => {
      if (done) {
        router.replace('/(worker-tabs)' as any);
      }
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
        <Stack.Screen name="payment" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

