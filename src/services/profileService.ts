import { User } from 'firebase/auth';
import { supabase } from '../../data/supabaseClient';
import { ADMIN_EMAILS } from '../lib/constants';
import { sha256 } from '../lib/hash';
import { Club, UserProfile } from '../types';

/**
 * Get user profile from Supabase
 */
export const getProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('uid', uid)
      .maybeSingle();

    if (error) {
      console.error('Error getting user profile from Supabase:', error);
      return null;
    }

    if (!data) return null;

    return {
      uid: data.uid,
      name: data.name,
      email: data.email,
      role: data.role || 'student',
      memberships: data.memberships || [],
      isAdmin: data.is_admin || false,
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Create or update user profile from Firebase Auth user
 */
export const upsertProfileFromAuth = async (user: User): Promise<UserProfile> => {
  try {
    const emailNormalized = (user.email || '').trim().toLowerCase();
    const existing = await getProfile(user.uid);

    const profileData = {
      uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'Unknown User',
      email: emailNormalized,
      role: existing?.role || 'student',
      memberships: existing?.memberships || [],
      is_admin: (ADMIN_EMAILS as readonly string[]).includes(emailNormalized),
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        uid: profileData.uid,
        name: profileData.name,
        email: profileData.email,
        role: profileData.role,
        memberships: profileData.memberships,
        is_admin: profileData.is_admin,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'uid' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting user profile to Supabase:', error);
      throw error;
    }

    return {
      uid: data.uid,
      name: data.name,
      email: data.email,
      role: data.role || 'student',
      memberships: data.memberships || [],
      isAdmin: data.is_admin || false,
    };
  } catch (error) {
    console.error('Error upserting user profile:', error);
    throw error;
  }
};

/**
 * Verify club membership using slug + hashed verification code
 * Returns updated profile!
 */
export const verifyClubMembership = async (
  uid: string,
  clubSlug: string,
  codePlaintext: string
): Promise<{ success: boolean; message: string; club?: Club; profile?: UserProfile }> => {
  try {
    const hashedCode = await sha256(codePlaintext);

    // Find club matching slug + code
    const { data: clubs, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('slug', clubSlug)
      .eq('code_hash', hashedCode)
      .limit(1);

    if (error) {
      console.error('Supabase error verifying club:', error);
      return { success: false, message: 'Verification failed. Try again.' };
    }

    if (!clubs || clubs.length === 0) {
      return { success: false, message: 'Invalid club or verification code.' };
    }

    const club = clubs[0];

    // Fetch profile
    const profile = await getProfile(uid);
    if (!profile) {
      return { success: false, message: 'User profile not found.' };
    }

    const memberships = profile.memberships || [];

    // Already member
    if (memberships.includes(club.slug)) {
      const refreshed = await getProfile(uid);
      return { success: true, message: 'Already a member.', club, profile: refreshed || profile };
    }

    // Add membership
    const updatedMemberships = [...memberships, club.slug];

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        memberships: updatedMemberships,
        updated_at: new Date().toISOString(),
      })
      .eq('uid', uid);

    if (updateError) {
      console.error('Error updating user memberships:', updateError);
      return { success: false, message: 'Failed to update membership.' };
    }

    // *** IMPORTANT: REFRESH UPDATED PROFILE ***
    const updatedProfile = await getProfile(uid);

    return {
      success: true,
      message: `Successfully joined ${club.name}!`,
      club,
      profile: updatedProfile!,
    };
  } catch (error) {
    console.error('Unexpected verification error:', error);
    return { success: false, message: 'Unexpected error occurred.' };
  }
};

/**
 * Check if user is a member of a club
 */
export const isClubMember = async (uid: string, clubSlug: string): Promise<boolean> => {
  try {
    const profile = await getProfile(uid);
    return profile?.memberships.includes(clubSlug) || false;
  } catch {
    return false;
  }
};
