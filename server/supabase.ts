import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types.js'

function getSupabaseConfiguration() {
  return {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  }
}

export function isSupabaseConfigured() {
  const { url, publishableKey } = getSupabaseConfiguration()
  return Boolean(url && publishableKey)
}

export function getSupabaseClient(accessToken?: string) {
  const { url, publishableKey } = getSupabaseConfiguration()
  if (!url || !publishableKey) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY (or their VITE_ equivalents).')
  }

  return createClient<Database>(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  })
}
