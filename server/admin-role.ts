import type { User } from '@supabase/supabase-js'

export function isAdminUser(user: User) {
  return user.app_metadata.role === 'admin'
    || Array.isArray(user.app_metadata.roles) && user.app_metadata.roles.includes('admin')
}
