// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '***' : 'Missing')
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export const db = {
  // Add any database helper functions here if needed
}
// Add this to lib/supabase.js for password hashing (basic implementation)
export const hashPassword = async (password) => {
  // In production, use: await bcrypt.hash(password, 12)
  // For now, using a simple base64 encoding (NOT secure for production)
  return btoa(password);
};

export const verifyPassword = async (password, hashedPassword) => {
  // In production, use: await bcrypt.compare(password, hashedPassword)
  // For now, using simple base64 decoding
  return atob(hashedPassword) === password;
};