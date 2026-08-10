import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://osaqaemntuzrjouzobvx.supabase.co';
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zYXFhZW1udHV6cmpvdXpvYnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyOTI2NDAsImV4cCI6MjA5NTg2ODY0MH0.gYgeBTCcz4zxb-CHTPI8qrbogRcwMArTfHiZ9twcf7k';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultAnonKey;

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
