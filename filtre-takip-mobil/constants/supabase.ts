import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tgmxdnenkfjzbuthozbm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbXhkbmVua2ZqemJ1dGhvemJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTI2NTAsImV4cCI6MjA2MjIyODY1MH0.-_mIMzJIBT2BXIuvVPZkYjJVJQtDwzd9Cp-S8AUSk0I';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY); 