import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../../data/supabaseClient';
import { Alert, Platform } from 'react-native';

/**
 * Request permissions for image picker
 */
export const requestImagePermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to upload images!'
      );
      return false;
    }
  }
  return true;
};

/**
 * Pick an image from the device
 */
export const pickImage = async (): Promise<string | null> => {
  const hasPermission = await requestImagePermissions();
  if (!hasPermission) {
    return null;
  }

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    // On web, the URI might be a blob URL or data URI
    // On mobile, it's a file URI
    return result.assets[0].uri;
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to pick image. Please try again.');
    return null;
  }
};

/**
 * Upload image to Supabase Storage
 */
export const uploadEventImage = async (
  imageUri: string,
  userId: string,
  eventId?: string
): Promise<string | null> => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const filename = eventId 
      ? `event-${eventId}-${timestamp}.jpg`
      : `event-${timestamp}-${randomId}.jpg`;
    const filePath = `event-images/${userId}/${filename}`;

    // Read the file
    // Handle both file:// URIs (mobile) and blob/data URIs (web)
    let blob: Blob;
    if (Platform.OS === 'web') {
      // On web, fetch should work with blob/data URIs
      const response = await fetch(imageUri);
      blob = await response.blob();
    } else {
      // On mobile, use FileSystem to read the file
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      // Convert base64 to blob
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: 'image/jpeg' });
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('event-images')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading image:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('event-images')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Error uploading image to Supabase:', error);
    Alert.alert('Upload Error', error.message || 'Failed to upload image. Please try again.');
    return null;
  }
};

/**
 * Delete an image from Supabase Storage
 */
export const deleteEventImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const filePath = urlParts.slice(urlParts.indexOf('event-images')).join('/');

    const { error } = await supabase.storage
      .from('event-images')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      // Don't throw - deletion is not critical
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw - deletion is not critical
  }
};

