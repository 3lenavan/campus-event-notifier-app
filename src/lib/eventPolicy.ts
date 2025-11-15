import { supabase } from '../../data/supabaseClient';

export type EventPolicy = {
  enabledGlobal: boolean;
  enabledByClub: Record<string, boolean>;
  moderationMode: "off" | "clubModerator";
  limits: {
    maxPerClubPerDay: number;
    userCooldownMinutes: number;
    allowImages: boolean;
    maxImageMB: number;
    maxTitleLen: number;
    maxDescLen: number;
  };
};

const DEFAULT_POLICY: EventPolicy = {
  enabledGlobal: true,
  enabledByClub: {},
  moderationMode: "off",
  limits: {
    maxPerClubPerDay: 5,
    userCooldownMinutes: 30,
    allowImages: true,
    maxImageMB: 5,
    maxTitleLen: 100,
    maxDescLen: 500,
  },
};

/**
 * Get the current event policy with sensible defaults
 */
export const getEventPolicy = async (): Promise<EventPolicy> => {
  try {
    const { data, error } = await supabase
      .from('event_policy')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.error('Error getting event policy from Supabase:', error);
      return DEFAULT_POLICY;
    }

    if (!data) {
      // If no policy exists, create default one
      await setEventPolicy(DEFAULT_POLICY);
      return DEFAULT_POLICY;
    }

    // Transform Supabase data to EventPolicy interface
    return {
      enabledGlobal: data.enabled_global ?? DEFAULT_POLICY.enabledGlobal,
      enabledByClub: data.enabled_by_club ?? DEFAULT_POLICY.enabledByClub,
      moderationMode: data.moderation_mode ?? DEFAULT_POLICY.moderationMode,
      limits: {
        maxPerClubPerDay: data.limits?.max_per_club_per_day ?? DEFAULT_POLICY.limits.maxPerClubPerDay,
        userCooldownMinutes: data.limits?.user_cooldown_minutes ?? DEFAULT_POLICY.limits.userCooldownMinutes,
        allowImages: data.limits?.allow_images ?? DEFAULT_POLICY.limits.allowImages,
        maxImageMB: data.limits?.max_image_mb ?? DEFAULT_POLICY.limits.maxImageMB,
        maxTitleLen: data.limits?.max_title_len ?? DEFAULT_POLICY.limits.maxTitleLen,
        maxDescLen: data.limits?.max_desc_len ?? DEFAULT_POLICY.limits.maxDescLen,
      },
    };
  } catch (error) {
    console.error('Error getting event policy:', error);
    return DEFAULT_POLICY;
  }
};

/**
 * Set the event policy
 */
export const setEventPolicy = async (policy: EventPolicy): Promise<void> => {
  try {
    const { error } = await supabase
      .from('event_policy')
      .upsert({
        id: 1,
        enabled_global: policy.enabledGlobal,
        enabled_by_club: policy.enabledByClub,
        moderation_mode: policy.moderationMode,
        limits: {
          max_per_club_per_day: policy.limits.maxPerClubPerDay,
          user_cooldown_minutes: policy.limits.userCooldownMinutes,
          allow_images: policy.limits.allowImages,
          max_image_mb: policy.limits.maxImageMB,
          max_title_len: policy.limits.maxTitleLen,
          max_desc_len: policy.limits.maxDescLen,
        },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (error) {
      console.error('Error setting event policy in Supabase:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error setting event policy:', error);
    throw error;
  }
};

/**
 * Check if event creation is enabled for a specific club
 */
export const isCreationEnabledForClub = async (clubId: string): Promise<boolean> => {
  try {
    const policy = await getEventPolicy();
    
    // If global is disabled, no club can create events
    if (!policy.enabledGlobal) {
      return false;
    }
    
    // If club-specific setting exists, use it
    if (clubId in policy.enabledByClub) {
      return policy.enabledByClub[clubId];
    }
    
    // Default to enabled if no specific setting
    return true;
  } catch (error) {
    console.error('Error checking club creation policy:', error);
    return false;
  }
};
