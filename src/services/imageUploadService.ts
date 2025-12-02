import * as ImagePicker from "expo-image-picker";
import { Alert, Platform } from "react-native";
import { supabase } from "../../data/supabaseClient";

/**
 * Request permission
 */
export const requestImagePermissions = async (): Promise<boolean> => {
  if (Platform.OS !== "web") {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Sorry, we need camera roll permissions to upload images."
      );
      return false;
    }
  }
  return true;
};

/**
 * Pick image (uri + base64)
 */
export const pickImage = async (): Promise<{ uri: string; base64: string } | null> => {
  const hasPermission = await requestImagePermissions();
  if (!hasPermission) return null;

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets?.length) return null;

    const asset = result.assets[0];

    return {
      uri: asset.uri,
      base64: asset.base64 || "",
    };
  } catch (err) {
    console.error("Error picking image:", err);
    Alert.alert("Error", "Failed to pick image.");
    return null;
  }
};

/**
 * Upload base64 → Supabase
 */
export const uploadEventImage = async (
  uri: string,
  base64: string,
  userId: string,
  eventId?: string
): Promise<string | null> => {
  try {
    const timestamp = Date.now();
    const rand = Math.random().toString(36).substring(2, 8);

    const filename = eventId
      ? `event-${eventId}-${timestamp}.jpg`
      : `event-${timestamp}-${rand}.jpg`;

    const filePath = `${userId}/${filename}`;

    // Convert base64 → data URL (Supabase requires this)
    const base64DataUrl = `data:image/jpeg;base64,${base64}`;

    const { error } = await supabase.storage
      .from("event-images")
      .upload(filePath, base64DataUrl, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading image:", error);
      throw error;
    }

    // Get public URL
    const { data } = supabase.storage
      .from("event-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (err: any) {
    console.error("Upload error:", err);
    Alert.alert("Upload Error", err.message || "Failed to upload image.");
    return null;
  }
};

/**
 * Delete image
 */
export const deleteEventImage = async (imageUrl: string): Promise<void> => {
  try {
    if (!imageUrl.includes("event-images")) return;

    // Extract actual path: userId/file.jpg
    const filePath = imageUrl.split("/event-images/")[1];

    await supabase.storage.from("event-images").remove([filePath]);
  } catch (err) {
    console.error("Error deleting image:", err);
  }
};
