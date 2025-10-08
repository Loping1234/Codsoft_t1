import { createClient } from '@supabase/supabase-js'

// These will read from your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

// Test that environment variables are loading
console.log('Supabase Config Check:', {
  url: supabaseUrl ? '✅ URL loaded' : '❌ URL missing',
  key: supabaseAnonKey ? '✅ Key loaded' : '❌ Key missing'
})

// Create custom fetch for development to handle SSL issues
const customFetch = (url: RequestInfo | URL, options?: RequestInit) => {
  // In development, handle SSL certificate issues
  return fetch(url, {
    ...options,
  }).catch(error => {
    console.error('Fetch error:', error);
    // If SSL error, provide helpful message
    if (error.message?.includes('certificate') || error.message?.includes('SSL') || error.message?.includes('ERR_CERT')) {
      throw new Error('SSL Certificate Error: Your Supabase instance has an invalid certificate. Please check your Supabase project settings or use a valid Supabase project.');
    }
    throw error;
  });
};

// Create and export the Supabase client with custom fetch and error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: customFetch,
  },
})

// Export as default as well for compatibility
export default supabase