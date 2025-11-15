import { router, useFocusEffect } from "expo-router";
import { getAuth } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useAuthUser } from "../../src/hooks/useAuthUser";
import { listApprovedEvents } from "../../src/services/eventsService";
import { listClubs } from "../../src/services/clubsService";
import { getEventsInteractions, toggleFavorite as toggleFavoriteService, toggleLike as toggleLikeService } from "../../src/services/interactionsService";
import EventCard, { Event as BaseEvent } from "../event-card";

type FeedEvent = BaseEvent & {
  likes: number;
  liked: boolean;
  favorited: boolean;
  club: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
};

export default function HomeScreen() {
  const { user, profile } = useAuthUser();
  
  useEffect(() => {
    const unsub = getAuth().onAuthStateChanged((user) => {
      if (!user) {
        router.replace("/");
      }
    });
    return () => unsub();
  }, []);

  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadApproved = useCallback(async () => {
    try {
      const approved = await listApprovedEvents();
      const clubs = await listClubs();
      
      // Map events to FeedEvent format
      const eventsMapped: FeedEvent[] = approved.map((event) => {
        const date = new Date(event.dateISO);
        return {
          id: event.id,
          title: event.title,
          description: event.description,
          date: date.toISOString(),
          time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
          location: event.location,
          category: "Club Event",
          attendees: 0,
          maxAttendees: undefined,
          imageUrl: undefined,
          isUserAttending: false,
          likes: 0,
          liked: false,
          favorited: false,
          club: { id: event.clubId, name: clubs.find((c:any)=>c.id===event.clubId)?.name || "Unknown Club" },
        };
      }).sort((a,b)=> new Date(a.date).getTime() - new Date(b.date).getTime());

      // Load likes and favorites if user is logged in
      if (user?.uid) {
        const eventIds = eventsMapped.map(e => e.id);
        const interactions = await getEventsInteractions(user.uid, eventIds);
        
        // Update events with interaction data
        eventsMapped.forEach(event => {
          event.liked = interactions.likedEvents.has(event.id);
          event.favorited = interactions.favoritedEvents.has(event.id);
          event.likes = interactions.likeCounts[event.id] || 0;
        });
      }

      setEvents(eventsMapped);
    } catch (e) {
      console.error("Error loading approved events:", e);
    }
  }, [user]);

  useEffect(() => { loadApproved(); }, [loadApproved]);
  useFocusEffect(useCallback(() => { loadApproved(); }, [loadApproved]));

  const onPressEvent = useCallback((event: BaseEvent) => {
    router.push({ pathname: "/event-details-screen", params: { id: event.id } });
  }, []);

  const toggleLike = useCallback(async (eventId: string) => {
    if (!user?.uid) {
      alert("Please log in to like events.");
      return;
    }

    try {
      // Optimistically update UI
      setEvents((prev) =>
        prev.map((e) => {
          if (e.id === eventId) {
            const newLiked = !e.liked;
            return {
              ...e,
              liked: newLiked,
              likes: e.likes + (newLiked ? 1 : -1),
            };
          }
          return e;
        })
      );

      // Update in Firestore
      const newLikedState = await toggleLikeService(user.uid, eventId);
      
      // Reload to get accurate like count
      const interactions = await getEventsInteractions(user.uid, [eventId]);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? {
                ...e,
                liked: interactions.likedEvents.has(eventId),
                likes: interactions.likeCounts[eventId] || 0,
              }
            : e
        )
      );
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert optimistic update on error
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, liked: !e.liked, likes: e.likes + (e.liked ? 1 : -1) }
            : e
        )
      );
      alert("Failed to update like. Please try again.");
    }
  }, [user]);

  const toggleFavorite = useCallback(async (eventId: string) => {
    if (!user?.uid) {
      alert("Please log in to favorite events.");
      return;
    }

    try {
      // Optimistically update UI
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, favorited: !e.favorited } : e
        )
      );

      // Update in Firestore
      await toggleFavoriteService(user.uid, eventId);
      
      // Reload to ensure consistency
      const interactions = await getEventsInteractions(user.uid, [eventId]);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, favorited: interactions.favoritedEvents.has(eventId) }
            : e
        )
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Revert optimistic update on error
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, favorited: !e.favorited } : e
        )
      );
      alert("Failed to update favorite. Please try again.");
    }
  }, [user]);

  const toggleRSVP = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              isUserAttending: !e.isUserAttending,
              attendees: e.attendees + (e.isUserAttending ? -1 : 1),
            }
          : e
      )
    );
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadApproved().finally(() => setRefreshing(false));
  }, [loadApproved]);

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            {/* Simulated header with club name to resemble Instagram-like feed */}
            <View style={styles.postHeader}>
              <View style={styles.clubAvatar} />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.clubName}>{item.club.name}</Text>
                <Text style={styles.postSubtle}>{item.location}</Text>
              </View>
            </View>

            <EventCard
              event={item}
              onPress={onPressEvent}
              onRSVP={toggleRSVP}
              onLike={toggleLike}
              onFavorite={toggleFavorite}
              liked={item.liked}
              favorited={item.favorited}
              likesCount={item.likes}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  listContent: { padding: 12, paddingBottom: 40 },
  postCard: {
    backgroundColor: "transparent",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  clubAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FACC15",
  },
  clubName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  postSubtle: { fontSize: 12, color: "#6B7280" },
});