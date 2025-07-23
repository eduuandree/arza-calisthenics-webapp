// Supabase client for Next.js App Router
// Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local

import { createClient } from '@supabase/supabase-js';
import type { User, ArzaEvaluation, Stat, Planilla, PlanillaBlock, Ejercicio, RutinaGenerada, RutinaGeneradaDetalle } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables:', {
    url: supabaseUrl ? 'Found' : 'Missing',
    key: supabaseAnonKey ? 'Found' : 'Missing'
  })
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Optional: Add a test function to verify connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error) throw error
    console.log('Supabase connection successful')
    return true
  } catch (error) {
    console.error('Supabase connection failed:', error)
    return false
  }
} 

console.log('ENV URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('ENV KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); 