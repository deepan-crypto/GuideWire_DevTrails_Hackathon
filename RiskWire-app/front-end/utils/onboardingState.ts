import * as SecureStore from 'expo-secure-store';

const KEY_DONE = 'onboarding_complete';
const KEY_RIDER = 'rider_id';
const KEY_INTRO_SEEN = 'intro_pages_seen';

// In-memory cache for sync reads after initial load
const _cache = { done: false, riderId: null as number | null, introSeen: false };

/** Load both flags from storage into cache. Call once on app mount. */
export async function loadOnboardingState(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(KEY_DONE);
  _cache.done = val === 'true';
  const rId = await SecureStore.getItemAsync(KEY_RIDER);
  _cache.riderId = rId ? parseInt(rId, 10) : null;
  const introVal = await SecureStore.getItemAsync(KEY_INTRO_SEEN);
  _cache.introSeen = introVal === 'true';
  return _cache.done;
}

/** Synchronous check — only reliable after loadOnboardingState() has resolved. */
export function isOnboardingComplete(): boolean {
  return _cache.done;
}

/** Check if intro (tabs) pages have been seen. */
export function hasSeenIntro(): boolean {
  return _cache.introSeen;
}

/** Synchronous riderId read — only reliable after loadOnboardingState() has resolved. */
export function getCachedRiderId(): number | null {
  return _cache.riderId;
}

/** Mark intro pages as seen. */
export async function setIntroSeen(): Promise<void> {
  await SecureStore.setItemAsync(KEY_INTRO_SEEN, 'true');
  _cache.introSeen = true;
}

/** Mark onboarding as complete and store the riderId. */
export async function setOnboardingComplete(riderId: number): Promise<void> {
  await SecureStore.setItemAsync(KEY_DONE, 'true');
  await SecureStore.setItemAsync(KEY_RIDER, String(riderId));
  _cache.done = true;
  _cache.riderId = riderId;
}

/** Clear onboarding state (for logout / reset). */
export async function clearOnboardingState(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_DONE);
  await SecureStore.deleteItemAsync(KEY_RIDER);
  await SecureStore.deleteItemAsync(KEY_INTRO_SEEN);
  _cache.done = false;
  _cache.riderId = null;
  _cache.introSeen = false;
}
