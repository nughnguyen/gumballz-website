import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// This client has admin privileges, use ONLY in API routes (server-side)
export const serverSupabase = createClient(supabaseUrl || 'http://127.0.0.1:54321', supabaseServiceKey || 'missing-service-role-key', { auth: { persistSession: false, autoRefreshToken: false } })
