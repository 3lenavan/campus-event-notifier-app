import { getLS, setLS, LS_KEYS } from './localStorage';

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
    const policy = await getLS<EventPolicy>(LS_KEYS.EVENT_POLICY, DEFAULT_POLICY);
    return policy || DEFAULT_POLICY;
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
    await setLS(LS_KEYS.EVENT_POLICY, policy);
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
