// /js/supabase-client.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://tjgpmdsaorhoshkprecc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZ3BtZHNhb3Job3Noa3ByZWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MDI4MTMsImV4cCI6MjA5Mjk3ODgxM30.ZpLeIKRHx46kq41AzRKnydmz-3U61-5kdM1ZVj-29H8';

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function logoutUser() {
  await supabaseClient.auth.signOut();
  window.location.href = '/login';
}

export async function requireAuth() {
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  if (error || !session) {
    window.location.href = '/login';
    return null;
  }
  return session.user;
}
