import { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getProfile, upsertProfileFromAuth } from '../services/profileService';
import { UserProfile } from '../types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

/**
 * Hook to manage authentication state and user profile
 * Externalizes Supabase Auth state and automatically creates/updates local user profiles
 */
export const useAuthUser = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (authUser: User) => {
    try {
      const userProfile = await upsertProfileFromAuth(authUser);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      throw error;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      // Reload profile from storage (which may have been updated by verification)
      const updatedProfile = await getProfile(user.id);
      if (updatedProfile) {
        setProfile(updatedProfile);
      } else {
        // If profile doesn't exist, recreate it from auth
        await loadProfile(user);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  }, [user, loadProfile]);

  useEffect(() => {
    let isMounted = true;

    const handleAuthChange = async (authUser: User | null) => {
      if (!isMounted) return;

      if (authUser) {
        setUser(authUser);
        try {
          await loadProfile(authUser);
        } catch (error) {
          console.error('Error handling auth state change:', error);
          if (isMounted) {
            setUser(null);
            setProfile(null);
          }
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    };

    const syncInitialSession = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error retrieving auth session:', error);
        }
        await handleAuthChange(data?.session?.user ?? null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoading(true);
      void handleAuthChange(session?.user ?? null).finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    });

    syncInitialSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  return { user, profile, loading, refreshProfile };
};
