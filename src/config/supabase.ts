import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Значения берутся из файла .env в корне проекта:
// EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
// EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Supabase клиент с AsyncStorage для хранения сессии
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Используем AsyncStorage вместо localStorage (React Native)
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
