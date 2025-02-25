import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://supabasekong-coog40wkc4g44ks80og88cg4.155.133.27.150.sslip.io'
const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc0MDM4ODE0MCwiZXhwIjo0ODk2MDYxNzQwLCJyb2xlIjoiYW5vbiJ9.vCgpSEMKcaK5-ZcteLPRIuoE7ILsybGlwqoTQngML6k'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  }
})

// Helper functions for authentication
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Storage helpers
export const uploadFile = async (bucket, path, file) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file)
  return { data, error }
}

export const getFileUrl = (bucket, path) => {
  // Correction du chemin pour s'assurer qu'il n'y a pas de double slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  // Construction manuelle de l'URL
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`
}
