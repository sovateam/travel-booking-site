import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    }
  }
})

// Real-time helper
export const subscribeToTasks = (userId, callback) => {
  return supabase
    .channel('user-tasks')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'user_premium_tasks',
        filter: `user_id=eq.${userId}`
      }, 
      callback
    )
    .subscribe()
}
