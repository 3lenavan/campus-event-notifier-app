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
          imageUrl: event.imageUrl,
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

  const getUserGreeting = () => {
    if (!profile?.name && !user?.displayName) {
      return "Hello";
    }
    const name = profile?.name || user?.displayName || "";
    const firstName = name.split(" ")[0];
    return `Hello, ${firstName}`;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>{getUserGreeting()}</Text>
              <Text style={styles.headerSubtitle}>Welcome to Campus Events</Text>
            </View>
            {user && (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(profile?.name || user?.displayName || user?.email || "?")[0].toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
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
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No events available</Text>
            <Text style={styles.emptySubtext}>Check back later for new events</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  listContent: { paddingHorizontal: 20, paddingBottom: 120 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 0,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "400",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
  },
});