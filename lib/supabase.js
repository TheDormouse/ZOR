import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uwuszitxbahafyjjsssl.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3dXN6aXR4YmFoYWZ5ampzc3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjkyNTQsImV4cCI6MjA4NTY0NTI1NH0.OBENH_0cC7MJOqwd5X0MkXQr21ZDiJOGvP0qrQGsAtw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
