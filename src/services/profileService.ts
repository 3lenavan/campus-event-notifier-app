import { User } from 'firebase/auth';
import { sha256 } from '../lib/hash';
import { getLS, LS_KEYS, setLS } from '../lib/localStorage';
import { Club, UserProfile } from '../types';

/**
 * Get user profile from Local Storage
 */
export const getProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userProfiles = await getLS<Record<string, UserProfile>>(LS_KEYS.USER_PROFILES, {});
    return userProfiles[uid] || null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Create or update user profile from Firebase Auth user
 */
export const upsertProfileFromAuth = async (user: User): Promise<UserProfile> => {
  try {
    const userProfiles = await getLS<Record<string, UserProfile>>(LS_KEYS.USER_PROFILES, {});
    
    let profile = userProfiles[user.uid];
    
    if (!profile) {
      // Create new profile for first-time user
      profile = {
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Unknown User',
        email: user.email || '',
        role: 'student',
        memberships: [],
      };
    } else {
      // Update existing profile with latest auth data
      profile.name = user.displayName || profile.name;
      profile.email = user.email || profile.email;
    }
    
    // Save back to Local Storage
    userProfiles[user.uid] = profile;
    await setLS(LS_KEYS.USER_PROFILES, userProfiles);
    
    return profile;
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
    // Get clubs and user profile
    const [clubs, userProfiles] = await Promise.all([
      getLS<Club[]>(LS_KEYS.CLUBS, []),
      getLS<Record<string, UserProfile>>(LS_KEYS.USER_PROFILES, {}),
    ]);

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
    
    // Compare hashes
    if (providedHash !== club.codeHash) {
      return { success: false, message: 'Invalid verification code.' };
    }

    // Update user profile
    const profile = userProfiles[uid];
    if (!profile) {
      return { success: false, message: 'User profile not found. Please log in again.' };
    }

    // Update role to member if not already
    if (profile.role !== 'member') {
      profile.role = 'member';
    }

    // Add club to memberships if not already there
    if (!profile.memberships.includes(club.id)) {
      profile.memberships = [...profile.memberships, club.id];
    }

    // Save updated profile
    userProfiles[uid] = profile;
    await setLS(LS_KEYS.USER_PROFILES, userProfiles);

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
