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
import { useAuthUser } from "../src/hooks/useAuthUser";
import { getLS, LS_KEYS } from "../src/lib/localStorage";
import { listClubEvents } from "../src/services/eventsService";
import { notifyRSVPConfirmation } from "../src/lib/notifications";
import EventCard, { Event as EventCardEvent } from "./event-card";

type ClubDetails = {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl?: string;
};

type ClubEventCard = EventCardEvent & { dateISO: string };

export default function ClubDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { user } = useAuthUser();
  const [club, setClub] = useState<ClubDetails | null>(null);
  const [events, setEvents] = useState<ClubEventCard[]>([]);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubAndEvents = async () => {
      try {
        if (!id) {
          setLoading(false);
          return;
        }

        const clubsStored = (await getLS<any[]>(LS_KEYS.CLUBS, [])) ?? [];
        const matchedClub = clubsStored.find((clubItem) => clubItem.id === id);

        if (matchedClub) {
          setClub({
            id: matchedClub.id,
            name: matchedClub.name,
            description: matchedClub.description ?? "No description available.",
            category: matchedClub.category ?? "Other",
            imageUrl: matchedClub.imageUrl,
          });
        }

        const clubEvents = await listClubEvents(id);
        const approvedEvents = clubEvents
          .filter((evt) => evt.status === "approved")
          .map<ClubEventCard>((evt) => {
            const date = new Date(evt.dateISO);
            return {
              id: evt.id,
              title: evt.title,
              description: evt.description,
              date: evt.dateISO,
              time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              location: evt.location,
              category: "Club Event",
              attendees: 0,
              maxAttendees: undefined,
              imageUrl: undefined,
              isUserAttending: false,
              dateISO: evt.dateISO,
            };
          })
          .sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());

        setEvents(approvedEvents);
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

  const handleRSVP = async (eventId: string, eventTitle: string) => {
    try {
      if (!user) {
        alert("Please log in to RSVP.");
        return;
      }

      try {
        await notifyRSVPConfirmation(eventTitle);
      } catch (error) {
        console.error("Error sending RSVP notification:", error);
      }

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
