import AsyncStorage from '@react-native-async-storage/async-storage';

// Local Storage utility functions
export const getLS = async <T>(key: string, defaultValue?: T): Promise<T | null> => {
  try {
    const item = await AsyncStorage.getItem(key);
    if (item === null) {
      return defaultValue || null;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error getting item from localStorage with key "${key}":`, error);
    return defaultValue || null;
  }
};

export const setLS = async <T>(key: string, value: T): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting item in localStorage with key "${key}":`, error);
    throw error;
  }
};

export const removeLS = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing item from localStorage with key "${key}":`, error);
    throw error;
  }
};

export const clearLS = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    throw error;
  }
};

// Local Storage keys
export const LS_KEYS = {
  CLUBS: 'clubs',
  USER_PROFILES: 'userProfiles',
  EVENTS: 'events',
  SAVED_EVENTS: (uid: string) => `savedEvents:${uid}`,
  EVENT_POLICY: 'eventPolicy',
} as const;
