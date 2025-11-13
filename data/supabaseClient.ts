import { createClient } from "@supabase/supabase-js";

// Replace these with your project’s info:
const supabaseUrl = "https://klhejovhnuepzdwzvstd.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsaGVqb3ZobnVlcHpkd3p2c3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDE2MzgsImV4cCI6MjA3ODA3NzYzOH0.Ki66JxwYh1OxMc7aBcEmsOjqf-4Uy3D6MuOejCOIlTo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
