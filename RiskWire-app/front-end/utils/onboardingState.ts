import * as SecureStore from 'expo-secure-store';

const KEY_DONE = 'onboarding_complete';
const KEY_RIDER = 'rider_id';

// In-memory cache for sync reads after initial load
const _cache = { done: false, riderId: null as number | null };

/** Load both flags from storage into cache. Call once on app mount. */
export async function loadOnboardingState(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(KEY_DONE);
  _cache.done = val === 'true';
  const rId = await SecureStore.getItemAsync(KEY_RIDER);
  _cache.riderId = rId ? parseInt(rId, 10) : null;
  return _cache.done;
}

/** Synchronous check — only reliable after loadOnboardingState() has resolved. */
export function isOnboardingComplete(): boolean {
  return _cache.done;
}

/** Synchronous riderId read — only reliable after loadOnboardingState() has resolved. */
export function getCachedRiderId(): number | null {
  return _cache.riderId;
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
  _cache.done = false;
  _cache.riderId = null;
}
