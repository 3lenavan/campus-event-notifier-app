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

    if (!data) {
      return null;
    }

    // Transform Supabase data to UserProfile interface
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
    
    // Check if profile exists
    const existing = await getProfile(user.uid);
    
    const profileData = {
      uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'Unknown User',
      email: emailNormalized,
      role: existing?.role || 'student',
      memberships: existing?.memberships || [],
      is_admin: (ADMIN_EMAILS as readonly string[]).includes(emailNormalized),
    };

    // Upsert to Supabase
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
      }, {
        onConflict: 'uid',
      })
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
 * Verify club membership using verification code
 */
export const verifyClubMembership = async (
  uid: string,
  clubInput: string,
  codePlaintext: string
): Promise<{ success: boolean; message: string; club?: Club }> => {
  try {
    // Get clubs from Supabase
    const { listClubs } = await import('./clubsService');
    const clubs = await listClubs();

    if (!clubs || clubs.length === 0) {
      return { success: false, message: 'No clubs found. Please contact support.' };
    }

    // Find club by ID or name
    const club = clubs.find(c => c.id === clubInput || c.name.toLowerCase() === clubInput.toLowerCase());
    
    if (!club) {
      return { success: false, message: 'Club not found. Please check the club name or ID.' };
    }

    // Hash the provided code
    const providedHash = await sha256(codePlaintext);
    
    // Compare hashes: support member/moderator specific hashes and legacy
    const validHashes = [club.codeHash_member, club.codeHash_moderator, club.codeHash].filter(Boolean);
    if (!validHashes.includes(providedHash)) {
      return { success: false, message: 'Invalid verification code.' };
    }

    // Get current profile
    const profile = await getProfile(uid);
    if (!profile) {
      return { success: false, message: 'User profile not found. Please log in again.' };
    }

    // Update role to member if not already
    const newRole = profile.role !== 'member' ? 'member' : profile.role;

    // Add club to memberships if not already there
    const newMemberships = profile.memberships.includes(club.id)
      ? profile.memberships
      : [...profile.memberships, club.id];

    // Update profile in Supabase
    const { error } = await supabase
      .from('user_profiles')
      .update({
        role: newRole,
        memberships: newMemberships,
        updated_at: new Date().toISOString(),
      })
      .eq('uid', uid);

    if (error) {
      console.error('Error updating user profile in Supabase:', error);
      return { success: false, message: 'Failed to update membership. Please try again.' };
    }

    return { 
      success: true, 
      message: `Successfully joined ${club.name}!`,
      club 
    };
  } catch (error) {
    console.error('Error verifying club membership:', error);
    return { success: false, message: 'An error occurred during verification.' };
  }
};

/**
 * Check if user is a member of a specific club
 */
export const isClubMember = async (uid: string, clubId: string): Promise<boolean> => {
  try {
    const profile = await getProfile(uid);
    return profile?.role === 'member' && profile.memberships.includes(clubId) || false;
  } catch (error) {
    console.error('Error checking club membership:', error);
    return false;
  }
};
