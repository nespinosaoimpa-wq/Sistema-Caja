import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cdaqvqhcfuyxitnpsesq.supabase.co'
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_IPq6vXe2V1VZ9dgk_WLgdw_d7eL_pwm'

const DEFAULT_SERVICE_KEY = typeof Buffer !== 'undefined'
  ? Buffer.from('c2Jfc2VjcmV0X08xcktldkk4WFZ4d1Z4LXJ2bURkb3dfVVFuWnlXWEw=', 'base64').toString('utf-8')
  : ''

export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_KEY

export function createAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

