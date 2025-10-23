import { router } from "expo-router";
import { getAuth } from "firebase/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import snhuClubs from "../../data/snhu_clubs_with_hashes.json";
import { useAuthUser } from "../../src/hooks/useAuthUser";
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

  // Function to generate realistic events from club data
  const generateEventsFromClubs = useCallback((): FeedEvent[] => {
    const eventTemplates = [
      { type: "Weekly Meeting", time: "6:00 PM", duration: "1 hour", attendees: [15, 50] },
      { type: "Workshop", time: "7:00 PM", duration: "2 hours", attendees: [20, 60] },
      { type: "Social Event", time: "8:00 PM", duration: "3 hours", attendees: [30, 100] },
      { type: "Study Session", time: "5:00 PM", duration: "2 hours", attendees: [10, 30] },
      { type: "Guest Speaker", time: "6:30 PM", duration: "1.5 hours", attendees: [25, 80] },
      { type: "Community Service", time: "10:00 AM", duration: "4 hours", attendees: [15, 40] },
    ];

    const locations = [
      "Student Union Room 201", "Library Conference Room", "Engineering Hall 301", 
      "Business School Auditorium", "Campus Center", "Academic Building 205",
      "Student Lounge", "Multipurpose Room", "Lecture Hall A", "Study Commons"
    ];

    const categories = [
      "Academic", "Arts", "Sports", "Community Service", "Social", "Career", "Cultural"
    ];

    const imageUrls = [
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&q=80&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&q=80&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&q=80&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=80&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&q=80&auto=format&fit=crop",
    ];

    return snhuClubs.slice(0, 20).map((club, index) => {
      const template = eventTemplates[index % eventTemplates.length];
      const daysFromNow = Math.floor(Math.random() * 14); // Events within next 2 weeks
      const eventDate = new Date(Date.now() + daysFromNow * 86400000);
      const [minAttendees, maxAttendees] = template.attendees;
      const currentAttendees = Math.floor(Math.random() * (maxAttendees - minAttendees)) + minAttendees;
      
      return {
        id: club.id,
        title: `${club.name} - ${template.type}`,
        description: `Join ${club.name} for our ${template.type.toLowerCase()}. ${template.duration} of engaging activities and networking opportunities.`,
        date: eventDate.toISOString(),
        time: template.time,
        location: locations[index % locations.length],
        category: categories[index % categories.length],
        attendees: currentAttendees,
        maxAttendees: maxAttendees,
        imageUrl: imageUrls[index % imageUrls.length],
        isUserAttending: Math.random() > 0.7, // 30% chance user is attending
        likes: Math.floor(Math.random() * 50) + 5,
        liked: Math.random() > 0.8, // 20% chance user liked
        favorited: Math.random() > 0.9, // 10% chance user favorited
        club: { 
          id: club.id, 
          name: club.name,
          avatarUrl: undefined 
        },
      };
    });
  }, []);

  const initialData = useMemo<FeedEvent[]>(() => generateEventsFromClubs(), [generateEventsFromClubs]);

  const [events, setEvents] = useState<FeedEvent[]>(initialData);
  const [refreshing, setRefreshing] = useState(false);

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
    setTimeout(() => {
      // Generate new events from clubs data
      const newEvents = generateEventsFromClubs();
      setEvents(newEvents);
      setRefreshing(false);
    }, 900);
  }, [generateEventsFromClubs]);

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
    backgroundColor: "#E5E7EB",
  },
  clubName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  postSubtle: { fontSize: 12, color: "#6B7280" },
});