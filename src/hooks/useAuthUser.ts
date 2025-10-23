import { User, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { upsertProfileFromAuth } from '../services/profileService';
import { UserProfile } from '../types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

/**
 * Hook to manage authentication state and user profile
 * Externalizes Firebase Auth state and automatically creates/updates local user profiles
 */
export const useAuthUser = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in - create or update local profile
          const userProfile = await upsertProfileFromAuth(firebaseUser);
          setUser(firebaseUser);
          setProfile(userProfile);
        } else {
          // User is signed out
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error handling auth state change:', error);
        // On error, clear state
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return { user, profile, loading };
};
