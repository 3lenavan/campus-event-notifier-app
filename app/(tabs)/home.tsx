import { router, useFocusEffect } from "expo-router";
import { getAuth } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useAuthUser } from "../../src/hooks/useAuthUser";
import { getLS, LS_KEYS } from "../../src/lib/localStorage";
import { listApprovedEvents } from "../../src/services/eventsService";
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
      const clubs = (await getLS<any[]>(LS_KEYS.CLUBS, [])) || [];
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
      setEvents(eventsMapped);
    } catch (e) {
      console.error("Error loading approved events:", e);
    }
  }, []);

  useEffect(() => { loadApproved(); }, [loadApproved]);
  useFocusEffect(useCallback(() => { loadApproved(); }, [loadApproved]));

  const onPressEvent = useCallback((event: BaseEvent) => {
    router.push({ pathname: "/event-details-screen", params: { id: event.id } });
  }, []);

  const toggleLike = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, liked: !e.liked, likes: e.likes + (e.liked ? -1 : 1) }
          : e
      )
    );
  }, []);

  const toggleFavorite = useCallback((eventId: string) => {
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, favorited: !e.favorited } : e)));
  }, []);

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