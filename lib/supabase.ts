import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hrlxefaateuseotgnogw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHhlZmFhdGV1c2VvdGdub2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMzgxMzIsImV4cCI6MjA5NjkxNDEzMn0.d-mPJM9UZAnuaXmLt10G353j5mH8Q6-7-YHfOKy4zXM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type User = {
  id: number
  created_at: string
  name: string
  email: string
  telefono: number
  dni: number
  password: string
  activo: boolean
}