import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ltfzekatcjpltiighukw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0Znpla2F0Y2pwbHRpaWdodWt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2Njc4MDIsImV4cCI6MjA2NjI0MzgwMn0.ivNDTScEdfq9satT2EyAmh5QXc2fNQu6lkH7u5mbMQ4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 