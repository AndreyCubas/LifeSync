// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Auth Initialization
//
// Sets up Supabase auth listener when app loads
// This ensures the user state is synchronized with Supabase auth state
// ─────────────────────────────────────────────────────────────────────────────

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAppStore } from './appStore';
import type { User } from '../types';

/**
 * Initialize Supabase auth listener
 * Call this once when app starts (e.g., in App.tsx useEffect)
 */
export function initializeSupabaseAuth() {
  if (!isSupabaseConfigured) return;

  // Set up listener for auth state changes
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    const store = useAppStore.getState();

    if (session?.user) {
      // User is logged in
      const user: User = {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.name ?? session.user.email ?? '',
        createdAt: session.user.created_at,
      };
      store.setUser(user);
      console.log('[Auth] ✅ User logged in:', user.id);
    } else {
      // User is logged out
      store.setUser(null);
      console.log('[Auth] ✅ User logged out');
    }
  });

  return data;
}

/**
 * Check if user is currently authenticated
 */
export async function checkAuthStatus() {
  if (!isSupabaseConfigured) return null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      return {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.name ?? session.user.email ?? '',
        createdAt: session.user.created_at,
      } as User;
    }
  } catch (err) {
    console.error('[Auth] Error checking session:', err);
  }
  return null;
}
