import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Faltan variables de entorno de Supabase. Revisa tu archivo .env.local');
}

export const supabase = createClient(
    supabaseUrl || 'https://dhxqftfiqyswktoxczwm.supabase.co',
    supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoeHFmdGZpcXlzd2t0b3hjendtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MTExMTksImV4cCI6MjA4NzE4NzExOX0.U-8p66Xr3AM_mh4dGx5Tn5gV2ZDoy-uVS39HLMonzfU'
);
