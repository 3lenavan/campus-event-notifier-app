import { Platform } from 'react-native';
// @ts-ignore
import CryptoJS from 'react-native-crypto-js';

/**
 * Hash a string using SHA-256 and return as hex string
 * @param text The text to hash
 * @returns Promise<string> The hex-encoded hash
 */
export const sha256 = async (text: string): Promise<string> => {
  try {
    if (Platform.OS === 'web') {
      // Use Web Crypto API for web
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } else {
      // Use CryptoJS for React Native
      const hash = CryptoJS.SHA256(text).toString();
      return hash;
    }
  } catch (error) {
    console.error('Error hashing text:', error);
    throw new Error('Failed to hash text');
  }
};
