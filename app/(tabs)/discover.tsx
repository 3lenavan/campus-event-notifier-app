import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../FirebaseConfig";

import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import EventCard from "../event-card"; // ✅ make sure this path is correct

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
  isUserAttending?: boolean;
  clubId: string;
  clubName: string;
}

export default function Discover() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedClubs, setExpandedClubs] = useState<Set<string>>(new Set());
  const [userNotifications, setUserNotifications] = useState(2);

  // ✅ Load real events from Firestore
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "events"));
        const eventData = querySnapshot.docs.map((doc) => ({
          ...(doc.data() as Event),
          id: doc.id, // ✅ Correctly placed inside map
        }));
        setEvents(eventData);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch clubs from Firestore once when the screen loads
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "clubs"));
        const clubData = querySnapshot.docs.map((doc) => ({
          ...(doc.data() as Club),
          id: doc.id,
        })) as Club[];
        setClubs(clubData);
      } catch (error) {
        console.error("Error fetching clubs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  // ✅ Filter clubs by search query
  const filteredClubs = clubs.filter(
    (club) =>
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ✅ Get events for each club
  const getClubEvents = (clubId: string) =>
    events
      .filter((event) => event.clubId === clubId)
      .filter((event) => new Date(event.date) >= new Date())
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

  const toggleClubExpansion = (clubId: string) => {
    const newExpanded = new Set(expandedClubs);
    newExpanded.has(clubId)
      ? newExpanded.delete(clubId)
      : newExpanded.add(clubId);
    setExpandedClubs(newExpanded);
  };

  const isClubExpanded = (clubId: string) => expandedClubs.has(clubId);

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

  // ✅ Loading state while fetching Firestore
  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#6B7280" }}>Loading clubs...</Text>
      </View>
    );
  }

  if (loadingEvents) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#6B7280" }}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Discover</Text>
          <Text style={styles.headerSubtitle}>Find clubs and events</Text>
        </View>

        {/* Notifications */}
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={22} color="#333" />
          {userNotifications > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{userNotifications}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={18}
          color="#9CA3AF"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Search clubs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Clubs list */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredClubs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No clubs found</Text>
            <Text style={styles.emptySubText}>Try a different search term</Text>
          </View>
        ) : (
          filteredClubs.map((club) => {
            const clubEvents = getClubEvents(club.id);
            const expanded = isClubExpanded(club.id);
            const eventsToShow = expanded ? clubEvents : clubEvents.slice(0, 3);
            const hasMore = clubEvents.length > 3;

            return (
              <View key={club.id} style={styles.clubCard}>
                <View style={styles.clubHeader}>
                  <View
                    style={[
                      styles.clubIcon,
                      { backgroundColor: getCategoryColor(club.category) },
                    ]}
                  >
                    <Text style={styles.clubIconText}>{club.name[0]}</Text>
                  </View>
                  <View style={styles.clubInfo}>
                    <Text style={styles.clubName}>{club.name}</Text>
                    <Text style={styles.clubDescription}>
                      {club.description}
                    </Text>
                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.categoryBadge,
                          { backgroundColor: getCategoryColor(club.category) },
                        ]}
                      >
                        <Text style={styles.categoryText}>{club.category}</Text>
                      </View>
                      <Text style={styles.eventCount}>
                        {clubEvents.length} upcoming event
                        {clubEvents.length !== 1 ? "s" : ""}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Events list */}
                {clubEvents.length > 0 ? (
                  <View style={styles.eventList}>
                    {eventsToShow.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onPress={() =>
                          router.push({
                            pathname: "/event-details-screen",
                            params: { id: event.id },
                          })
                        }
                        onRSVP={() => console.log("RSVP:", event.id)}
                      />
                    ))}
                    {hasMore && (
                      <TouchableOpacity
                        style={styles.showMoreButton}
                        onPress={() => toggleClubExpansion(club.id)}
                      >
                        <Text style={styles.showMoreText}>
                          {expanded
                            ? "Show Less"
                            : `Show ${clubEvents.length - 3} More`}
                        </Text>
                        <Ionicons
                          name={
                            expanded
                              ? "chevron-up-outline"
                              : "chevron-down-outline"
                          }
                          size={16}
                          color="#555"
                          style={{ marginLeft: 4 }}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <Text style={styles.noEventsText}>No upcoming events</Text>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  headerSubtitle: { fontSize: 13, color: "#6B7280" },
  notificationButton: { position: "relative" },
  badge: {
    position: "absolute",
    right: -5,
    top: -5,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  badgeText: { color: "white", fontSize: 10 },
  searchContainer: { marginHorizontal: 16, marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: "white",
    borderRadius: 8,
    paddingVertical: 8,
    paddingLeft: 32,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchIcon: { position: "absolute", left: 10, top: 10 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyText: { color: "#6B7280" },
  emptySubText: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  clubCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  clubHeader: { flexDirection: "row", alignItems: "flex-start" },
  clubIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  clubIconText: { color: "white", fontWeight: "bold", fontSize: 18 },
  clubInfo: { flex: 1, marginLeft: 10 },
  clubName: { fontWeight: "bold", fontSize: 16 },
  clubDescription: { color: "#6B7280", fontSize: 13, marginTop: 2 },
  badgeRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  categoryBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryText: { color: "white", fontSize: 11 },
  eventCount: { fontSize: 12, color: "#6B7280", marginLeft: 6 },
  eventList: { marginTop: 10 },
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  showMoreText: { color: "#3B82F6", fontSize: 13 },
  noEventsText: {
    textAlign: "center",
    color: "#9CA3AF",
    marginTop: 8,
    fontSize: 13,
  },
});
