import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Like an event
 */
export const likeEvent = async (userId: string, eventId: string): Promise<void> => {
  try {
    const likeRef = doc(db, 'likes', `${userId}_${eventId}`);
    await setDoc(likeRef, {
      userId,
      eventId,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error liking event:', error);
    throw error;
  }
};

/**
 * Unlike an event
 */
export const unlikeEvent = async (userId: string, eventId: string): Promise<void> => {
  try {
    const likeRef = doc(db, 'likes', `${userId}_${eventId}`);
    await deleteDoc(likeRef);
  } catch (error) {
    console.error('Error unliking event:', error);
    throw error;
  }
};

/**
 * Check if user has liked an event
 */
export const isEventLiked = async (userId: string, eventId: string): Promise<boolean> => {
  try {
    const likeRef = doc(db, 'likes', `${userId}_${eventId}`);
    const likeSnap = await getDoc(likeRef);
    return likeSnap.exists();
  } catch (error) {
    console.error('Error checking if event is liked:', error);
    return false;
  }
};

/**
 * Get like count for an event
 */
export const getEventLikeCount = async (eventId: string): Promise<number> => {
  try {
    const likesRef = collection(db, 'likes');
    const q = query(likesRef, where('eventId', '==', eventId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting like count:', error);
    return 0;
  }
};

/**
 * Favorite an event
 */
export const favoriteEvent = async (userId: string, eventId: string): Promise<void> => {
  try {
    const favoriteRef = doc(db, 'favorites', `${userId}_${eventId}`);
    await setDoc(favoriteRef, {
      userId,
      eventId,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error favoriting event:', error);
    throw error;
  }
};

/**
 * Unfavorite an event
 */
export const unfavoriteEvent = async (userId: string, eventId: string): Promise<void> => {
  try {
    const favoriteRef = doc(db, 'favorites', `${userId}_${eventId}`);
    await deleteDoc(favoriteRef);
  } catch (error) {
    console.error('Error unfavoriting event:', error);
    throw error;
  }
};

/**
 * Check if user has favorited an event
 */
export const isEventFavorited = async (userId: string, eventId: string): Promise<boolean> => {
  try {
    const favoriteRef = doc(db, 'favorites', `${userId}_${eventId}`);
    const favoriteSnap = await getDoc(favoriteRef);
    return favoriteSnap.exists();
  } catch (error) {
    console.error('Error checking if event is favorited:', error);
    return false;
  }
};

/**
 * Get all favorited event IDs for a user
 */
export const getUserFavoritedEvents = async (userId: string): Promise<string[]> => {
  try {
    const favoritesRef = collection(db, 'favorites');
    const q = query(favoritesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data().eventId);
  } catch (error) {
    console.error('Error getting user favorited events:', error);
    return [];
  }
};

/**
 * Get all liked event IDs for a user
 */
export const getUserLikedEvents = async (userId: string): Promise<string[]> => {
  try {
    const likesRef = collection(db, 'likes');
    const q = query(likesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data().eventId);
  } catch (error) {
    console.error('Error getting user liked events:', error);
    return [];
  }
};

/**
 * Get like and favorite status for multiple events (batch operation for performance)
 */
export const getEventsInteractions = async (
  userId: string, 
  eventIds: string[]
): Promise<{
  likedEvents: Set<string>;
  favoritedEvents: Set<string>;
  likeCounts: Record<string, number>;
}> => {
  try {
    const likedEvents = new Set<string>();
    const favoritedEvents = new Set<string>();
    const likeCounts: Record<string, number> = {};

    // Initialize like counts to 0
    eventIds.forEach(id => {
      likeCounts[id] = 0;
    });

    // Batch fetch likes
    if (eventIds.length > 0) {
      const likesRef = collection(db, 'likes');
      
      // Get all likes for these events
      const likesPromises = eventIds.map(async (eventId) => {
        const q = query(likesRef, where('eventId', '==', eventId));
        const snapshot = await getDocs(q);
        likeCounts[eventId] = snapshot.size;
        
        // Check if current user liked it
        const userLike = snapshot.docs.find(doc => doc.data().userId === userId);
        if (userLike) {
          likedEvents.add(eventId);
        }
      });

      await Promise.all(likesPromises);
    }

    // Batch fetch favorites
    if (eventIds.length > 0 && userId) {
      const favoritesRef = collection(db, 'favorites');
      const q = query(favoritesRef, where('userId', '==', userId));
      const favoritesSnapshot = await getDocs(q);
      
      favoritesSnapshot.docs.forEach(doc => {
        const eventId = doc.data().eventId;
        if (eventIds.includes(eventId)) {
          favoritedEvents.add(eventId);
        }
      });
    }

    return { likedEvents, favoritedEvents, likeCounts };
  } catch (error) {
    console.error('Error getting events interactions:', error);
    return {
      likedEvents: new Set(),
      favoritedEvents: new Set(),
      likeCounts: {},
    };
  }
};

/**
 * Toggle like status for an event
 */
export const toggleLike = async (userId: string, eventId: string): Promise<boolean> => {
  try {
    const isLiked = await isEventLiked(userId, eventId);
    if (isLiked) {
      await unlikeEvent(userId, eventId);
      return false;
    } else {
      await likeEvent(userId, eventId);
      return true;
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

/**
 * Toggle favorite status for an event
 */
export const toggleFavorite = async (userId: string, eventId: string): Promise<boolean> => {
  try {
    const isFavorited = await isEventFavorited(userId, eventId);
    if (isFavorited) {
      await unfavoriteEvent(userId, eventId);
      return false;
    } else {
      await favoriteEvent(userId, eventId);
      return true;
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};

