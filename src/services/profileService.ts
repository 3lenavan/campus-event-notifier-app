import { User } from "firebase/auth";
import { supabase } from "../../data/supabaseClient";
import { ADMIN_EMAILS } from "../lib/constants";
import { sha256 } from "../lib/hash";
import { Club, UserProfile } from "../types";

/**
 * Load user profile from Supabase
 */
export const getProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    // Load basic profile
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("uid", uid)
      .maybeSingle();

    if (profileError) {
      console.error("Error loading profile:", profileError);
      return null;
    }

    if (!profileData) return null;

    // Load memberships from join: clubs_users → clubs
    const { data: membershipsData, error: membershipError } = await supabase
      .from("clubs_users")
      .select("clubs(slug)")
      .eq("user_id", uid);

    if (membershipError) {
      console.error("Error loading memberships:", membershipError);
      return null;
    }

    const memberships =
      membershipsData?.map((row: any) => row.clubs?.slug).filter(Boolean) || [];

    // Final user profile object
    return {
  uid: profileData.uid,
  name: profileData.name,
  email: profileData.email,
  role: profileData.role || "student",
  isAdmin: profileData.is_admin || false,
  memberships, // <-- actual memberships loaded from clubs_users
};

  } catch (err) {
    console.error("getProfile unexpected error:", err);
    return null;
  }
};

/**
 * Create/update profile when user logs in
 */
export const upsertProfileFromAuth = async (
  user: User
): Promise<UserProfile> => {
  const emailNormalized = (user.email || "").trim().toLowerCase();
  const isAdmin = ADMIN_EMAILS.includes(emailNormalized);

  const profile = {
    uid: user.uid,
    name: user.displayName || user.email?.split("@")[0] || "Unknown User",
    email: emailNormalized,
    role: "student",
    is_admin: isAdmin,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(profile, { onConflict: "uid" })
    .select()
    .single();

  if (error) {
    console.error("Error upserting profile:", error);
    throw error;
  }

  // Return minimal profile (memberships will be refreshed via getProfile)
  return {
    uid: data.uid,
    name: data.name,
    email: data.email,
    role: data.role || "student",
    isAdmin: data.is_admin || false,
    memberships: [], // <-- temporarily empty; getProfile() fills it
  };
};

/**
 * Verify club membership using slug + hashed code
 */
export const verifyClubMembership = async (
  uid: string,
  clubSlug: string,
  codePlaintext: string
): Promise<{ success: boolean; message: string; club?: Club }> => {
  try {
    console.log("📌 VERIFY INPUT:");
    console.log("clubSlug =", clubSlug);
    console.log("codePlaintext =", codePlaintext);

    // Normalize slug
    const normalizedSlug = clubSlug.trim().toLowerCase();

    // Hash verification code
    const hashedCode = await sha256(codePlaintext);

    // Find matching club
    const { data: clubs, error } = await supabase
      .from("clubs")
      .select("*")
      .eq("slug", normalizedSlug)
      .eq("code_hash", hashedCode)
      .limit(1);

    console.log("📦 DB RESULT clubs =", clubs);

    if (error) {
      console.error("verifyClubMembership error:", error);
      return { success: false, message: "Verification failed." };
    }

    if (!clubs || clubs.length === 0) {
      console.log("❌ No matching club for slug + hash");
      return { success: false, message: "Invalid club or code." };
    }

    const club = clubs[0];

    // Check if the user is already a member
    const { data: existing } = await supabase
      .from("clubs_users")
      .select("id")
      .eq("user_id", uid)
      .eq("club_id", club.id)
      .maybeSingle();

    if (existing) {
      return {
        success: true,
        message: "Already a member of this club.",
        club,
      };
    }

    // Insert membership
    const { error: insertError } = await supabase
      .from("clubs_users")
      .insert([{ user_id: uid, club_id: club.id }]);

    if (insertError) {
      return { success: false, message: "Could not save membership." };
    }

    return {
      success: true,
      message: `Successfully joined ${club.name}.`,
      club,
    };
  } catch (err) {
    console.error("verifyClubMembership unexpected error:", err);
    return { success: false, message: "Unexpected error occurred." };
  }
};

/**
 * Check club membership via clubs_users
 */
export const isClubMember = async (
  uid: string,
  clubId: number
): Promise<boolean> => {
  try {
    const { data } = await supabase
      .from("clubs_users")
      .select("id")
      .eq("user_id", uid)
      .eq("club_id", clubId)
      .maybeSingle();

    return !!data;
  } catch (err) {
    console.error("isClubMember error:", err);
    return false;
  }
};
