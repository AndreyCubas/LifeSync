// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Debug & Logging Utilities
//
// Provides detailed logging for Supabase operations, especially RLS issues
// ─────────────────────────────────────────────────────────────────────────────

import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface DebugContext {
  operation: string;
  userId?: string;
  table?: string;
  payload?: any;
  timestamp: string;
}

/**
 * Log an operation with full context (for debugging RLS issues)
 */
export function logSupabaseOperation(context: DebugContext, message: string, level: 'info' | 'warn' | 'error' = 'info') {
  const prefix = `[${context.table || 'Unknown'}] ${context.operation}`;
  const details = context.userId ? `(userId: ${context.userId.slice(0, 8)}...)` : '';
  const full = `${prefix} ${details} - ${message}`;

  if (level === 'error') console.error(`❌ ${full}`, context.payload);
  else if (level === 'warn') console.warn(`⚠️  ${full}`, context.payload);
  else console.log(`✅ ${full}`);
}

/**
 * Check current Supabase auth status
 */
export async function debugAuthStatus() {
  if (!isSupabaseConfigured) {
    console.log('[Auth] ℹ️  Using localStorage (Supabase not configured)');
    return;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      console.log(`[Auth] ✅ Authenticated as: ${session.user.id} (${session.user.email})`);
      console.log(`[Auth] Token expires at: ${new Date(session.expires_at! * 1000).toLocaleString()}`);
    } else {
      console.warn('[Auth] ⚠️ Not authenticated - tokens may be missing or expired');
    }
  } catch (err) {
    console.error('[Auth] ❌ Error checking auth status:', err);
  }
}

/**
 * Check RLS policies for a specific table
 */
export function debugRLSError(error: any, context: Omit<DebugContext, 'timestamp'>) {
  const msg = error?.message || String(error);

  // Common RLS error patterns
  if (msg.includes('permission denied')) {
    console.error(`[RLS] ❌ PERMISSION DENIED on ${context.table}`);
    console.error(`[RLS] Your user_id might be null or not matching row user_id`);
    console.error(`[RLS] Check: 1) Are you logged in? 2) Is your auth.uid() in the row? 3) Are RLS policies enabled?`);
  } else if (msg.includes('UPDATE violates') || msg.includes('INSERT violates')) {
    console.error(`[RLS] ❌ CONSTRAINT VIOLATION on ${context.table}`);
    console.error(`[RLS] Check: Required field may be missing (e.g., user_id, date)`);
    console.error(`[RLS] Payload sent:`, context.payload);
  } else if (msg.includes('relation does not exist')) {
    console.error(`[RLS] ❌ TABLE NOT FOUND: ${context.table}`);
    console.error(`[RLS] Check: Table name in TABLES constant matches your schema`);
  } else {
    console.error(`[RLS] ❌ Error: ${msg}`, context.payload);
  }
}

/**
 * Wrap a Supabase operation with full error context
 */
export async function withErrorContext<T>(
  operation: string,
  table: string,
  userId: string,
  fn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: string | null }> {
  const context: DebugContext = { operation, table, userId, timestamp: new Date().toISOString() };

  try {
    const { data, error } = await fn();

    if (error) {
      logSupabaseOperation(context, `Failed`, 'error');
      debugRLSError(error, { operation, table, userId });
      return { data: null, error: error.message };
    }

    logSupabaseOperation(context, 'Success');
    return { data, error: null };
  } catch (err) {
    logSupabaseOperation(context, `Exception: ${err}`, 'error');
    return { data: null, error: String(err) };
  }
}

/**
 * Print diagnostic info on app startup
 */
export async function printDiagnostics() {
  console.group('🔧 LifeSync Diagnostics');
  console.log('Supabase configured:', isSupabaseConfigured);
  if (isSupabaseConfigured) {
    await debugAuthStatus();
  }
  console.groupEnd();
}
