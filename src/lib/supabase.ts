import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tlsowrfkikyodnpktjwo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsc293cmZraWt5b2RucGt0andvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MDY0OTAsImV4cCI6MjA3ODE4MjQ5MH0.HdKG4lV40GKMZs9RhRV9PqnYlm6YOAMjI5II-Uc7Ejo'

// For client components
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server components and API routes
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey)