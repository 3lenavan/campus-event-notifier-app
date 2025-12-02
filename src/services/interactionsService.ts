// interactionsService.ts
// Likes = Supabase
// Favorites = Supabase

import { supabase } from "../../data/supabaseClient"; 
import { db } from "../lib/firebase"; // only needed for notifications etc., KEEPING


// SUPABASE LIKES
export const likeEvent = async (userId: string, eventId: string): Promise<void> => {
  const { error } = await supabase.from("likes").insert({
    user_uid: userId,
    event_id: eventId,
  });

  if (error) {
    console.error("Error liking event:", error);
    throw error;
  }
};

export const unlikeEvent = async (userId: string, eventId: string): Promise<void> => {
  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("user_uid", userId)
    .eq("event_id", eventId);

  if (error) {
    console.error("Error unliking event:", error);
    throw error;
  }
};

export const isEventLiked = async (userId: string, eventId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from("likes")
    .select("id")
    .eq("user_uid", userId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) {
    console.error("Error checking like:", error);
    return false;
  }

  return !!data;
};

export const getEventLikeCount = async (eventId: string): Promise<number> => {
  const { count, error } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  if (error) {
    console.error("Error getting like count:", error);
    return 0;
  }

  return count || 0;
};

export const toggleLike = async (userId: string, eventId: string): Promise<boolean> => {
  const liked = await isEventLiked(userId, eventId);

  if (liked) {
    await unlikeEvent(userId, eventId);
    return false;
  } else {
    await likeEvent(userId, eventId);
    return true;
  }
};

export const getUserLikedEvents = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from("likes")
    .select("event_id")
    .eq("user_uid", userId);

  if (error) {
    console.error("Error getting liked events:", error);
    return [];
  }

  return data.map((row) => row.event_id);
};


// SUPABASE FAVORITES — THIS SECTION IS EXACTLY WHAT YOU ALREADY HAD
export const favoriteEvent = async (userId: string, eventId: string): Promise<void> => {
  const { error } = await supabase.from("favorites").insert({
    user_uid: userId,
    event_id: eventId,
  });

  if (error) {
    console.error("Error favoriting event:", error);
    throw error;
  }
};

export const unfavoriteEvent = async (userId: string, eventId: string): Promise<void> => {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_uid", userId)
    .eq("event_id", eventId);

  if (error) {
    console.error("Error unfavoriting:", error);
    throw error;
  }
};

export const isEventFavorited = async (userId: string, eventId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_uid", userId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) {
    console.error("Error checking favorite:", error);
    return false;
  }

  return !!data;
};

export const getUserFavoritedEvents = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from("favorites")
    .select("event_id")
    .eq("user_uid", userId);

  if (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }

  return data.map((row) => row.event_id);
};

export const toggleFavorite = async (userId: string, eventId: string): Promise<boolean> => {
  const isFav = await isEventFavorited(userId, eventId);

  if (isFav) {
    await unfavoriteEvent(userId, eventId);
    return false;
  } else {
    await favoriteEvent(userId, eventId);
    return true;
  }
};

// Combined Loader (Home + Discover + Profile use this)
export const getEventsInteractions = async (
  userId: string,
  eventIds: string[]
): Promise<{
  likedEvents: Set<string>;
  favoritedEvents: Set<string>;
  likeCounts: Record<string, number>;
}> => {
  const likedEvents = new Set<string>();
  const favoritedEvents = new Set<string>();
  const likeCounts: Record<string, number> = {};

  // Initialize like counts
  eventIds.forEach((id) => (likeCounts[id] = 0));

  // Load likes from Supabase
  for (const id of eventIds) {
    const count = await getEventLikeCount(id);
    likeCounts[id] = count;

    const liked = await isEventLiked(userId, id);
    if (liked) likedEvents.add(id);
  }

  // Load favorites from Supabase
  const favorites = await getUserFavoritedEvents(userId);
  favorites.forEach((id) => favoritedEvents.add(id.toString()));

  return { likedEvents, favoritedEvents, likeCounts };
};
