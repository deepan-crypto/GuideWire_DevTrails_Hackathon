import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { loadOnboardingState, isOnboardingComplete, getCachedRiderId, clearOnboardingState } from '@/utils/onboardingState';
import { router } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

/** Returns true if the riderId is a valid 24-char MongoDB ObjectId hex string */
function isValidMongoId(id: string | null): boolean {
  if (!id) return false;
  return /^[a-f0-9]{24}$/i.test(id);
}

export default function RootLayout() {
  useFrameworkReady();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadOnboardingState().then(async () => {
      const onboardingDone = isOnboardingComplete();
      const riderId = getCachedRiderId();

      if (onboardingDone) {
        // Migration: if stored riderId is a legacy numeric ID (not a MongoDB ObjectId),
        // the old backend data no longer exists — clear the stale state so user re-registers
        if (!isValidMongoId(riderId)) {
          console.warn('[Layout] Stale numeric riderId detected, clearing onboarding state:', riderId);
          await clearOnboardingState();
          // Fall through — stay on (tabs) info pages
        } else {
          router.replace('/(worker-tabs)' as any);
        }
      }
      // Default: stay on (tabs) — the 4 info/intro pages
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
