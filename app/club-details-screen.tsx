import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../src/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import EventCard from "./event-card";

// Firestore types
interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl?: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  attendees: number;
  maxAttendees?: number;
  imageUrl?: string;
  clubId: string;
  clubName: string;
}

export default function ClubDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [club, setClub] = useState<Club | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubAndEvents = async () => {
      try {
        // Fetch club head
        const clubDoc = await getDoc(doc(db, "clubs", id as string));
        if (clubDoc.exists()) {
          const data = clubDoc.data() as Club;
          const { id: _, ...rest } = data; // Avoid duplicate id
          setClub({ id: clubDoc.id, ...rest });
        }

        // Fetch events for this club
        const eventsRef = collection(db, "events");
        const q = query(eventsRef, where("clubId", "==", id));
        const eventSnap = await getDocs(q);

        const eventData = eventSnap.docs.map((d) => {
          const data = d.data() as Event;
          const { id: _, ...rest } = data;
          return { id: d.id, ...rest };
        });

        const sortedEvents = eventData.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        setEvents(sortedEvents);
      } catch (err) {
        console.error("Error fetching club or events:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClubAndEvents();
  }, [id]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Academic: "#3B82F6",
      Social: "#8B5CF6",
      Sports: "#22C55E",
      Arts: "#EC4899",
      Career: "#F97316",
      Other: "#6B7280",
    };
    return colors[category] || colors["Other"];
  };

  const eventsToShow = showAllEvents ? events : events.slice(0, 3);
  const hasMore = events.length > 3;

  // Handle RSVP action
  const handleRSVP = async (eventId: string, eventTitle: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Please log in to RSVP.");
        return;
      }

      await setDoc(doc(db, "rsvps", `${user.uid}_${eventId}`), {
        userId: user.uid,
        eventId: eventId,
        timestamp: serverTimestamp(),
      });

      alert(`You have RSVP’d for “${eventTitle}” successfully!`);
    } catch (error) {
      console.error("Error RSVPing:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading club details...</Text>
      </View>
    );
  }

  if (!club) {
    return (
      <View style={styles.center}>
        <Text>Club not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back-outline" size={22} color="#111" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Club Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Club Banner */}
        <View
          style={[
            styles.banner,
            { backgroundColor: getCategoryColor(club.category) },
          ]}
        >
          {club.imageUrl ? (
            <Image
              source={{ uri: club.imageUrl }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>{club.name}</Text>
              <Text style={styles.bannerCategory}>{club.category}</Text>
            </View>
          )}
        </View>

        {/* About Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{club.description}</Text>
        </View>

        {/* Upcoming Events */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>

          {events.length === 0 ? (
            <Text style={styles.noEventsText}>No upcoming events yet.</Text>
          ) : (
            <>
              {eventsToShow.map((event) => (
                <View key={event.id} style={styles.eventContainer}>
                  <EventCard
                     event={event}
                     onPress={() => handleRSVP(event.id, event.title)}
                        />


                  <TouchableOpacity
                    style={styles.rsvpButton}
                    onPress={() => handleRSVP(event.id, event.title)}
                  >
                    <Text style={styles.rsvpText}>RSVP</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {hasMore && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setShowAllEvents(!showAllEvents)}
                >
                  <Text style={styles.showMoreText}>
                    {showAllEvents
                      ? "Show Less"
                      : `Show ${events.length - 3} More`}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 50, // push down from the top of the screen (adjustable)
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  backButton: { flexDirection: "row", alignItems: "center" },
  backText: { marginLeft: 6, fontSize: 15, color: "#111827" },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#111" },
  scrollContent: { padding: 16, paddingBottom: 100 },
  banner: {
    height: 160,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  bannerImage: { width: "100%", height: "100%", borderRadius: 10 },
  bannerTextContainer: { alignItems: "center" },
  bannerTitle: { color: "white", fontSize: 22, fontWeight: "bold" },
  bannerCategory: { color: "white", opacity: 0.9, marginTop: 4 },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  description: { fontSize: 14, color: "#4B5563" },
  noEventsText: { fontSize: 14, color: "#9CA3AF", marginTop: 8 },
  showMoreButton: { paddingVertical: 8, alignItems: "center" },
  showMoreText: { color: "#3B82F6", fontWeight: "500" },
  eventContainer: {
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  rsvpButton: {
    marginTop: 8,
    backgroundColor: "#3B82F6",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  rsvpText: {
    color: "white",
    fontWeight: "600",
  },
});
