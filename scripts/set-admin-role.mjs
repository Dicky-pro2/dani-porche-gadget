import { createClient } from '@supabase/supabase-js'

const [userId] = process.argv.slice(2)
const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
  throw new Error('Usage: node scripts/set-admin-role.mjs <supabase-auth-user-uuid>')
}
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your local environment.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const { data, error } = await supabase.auth.admin.getUserById(userId)
if (error) throw error
if (!data.user) throw new Error('Supabase Auth user was not found.')

const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(userId, {
  app_metadata: { ...data.user.app_metadata, role: 'admin' },
})
if (updateError) throw updateError

console.log(`Administrator role granted to ${updated.user.email || updated.user.id}.`)
