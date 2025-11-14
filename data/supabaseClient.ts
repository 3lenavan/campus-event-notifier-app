import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://klhejovhnuepzdwzvstd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsaGVqb3ZobnVlcHpkd3p2c3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDE2MzgsImV4cCI6MjA3ODA3NzYzOH0.Ki66JxwYh1OxMc7aBcEmsOjqf-4Uy3D6MuOejCOIlTo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
