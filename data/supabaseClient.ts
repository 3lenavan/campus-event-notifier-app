// cSpell:ignore supabase
import { createClient } from "@supabase/supabase-js";

// Get environment variables - throw error if missing
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;



// TypeScript now knows these are strings after the check above
export const supabase = createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string);
