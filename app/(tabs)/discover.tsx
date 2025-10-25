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

// Firestore data structure
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
  clubId: string;
  date: string;
}

export default function Discover() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch clubs and events from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch clubs
        const clubSnap = await getDocs(collection(db, "clubs"));
        const clubData = clubSnap.docs.map((doc) => {
          const data = doc.data() as Club;
          const { id: _, ...rest } = data; // remove Firestore id if stored in doc
          return { id: doc.id, ...rest };
        });

        // Fetch events
        const eventSnap = await getDocs(collection(db, "events"));
        const eventData = eventSnap.docs.map((doc) => {
          const data = doc.data() as Event;
          const { id: _, ...rest } = data;
          return { id: doc.id, ...rest };
        });

        setClubs(clubData);
        setEvents(eventData);
      } catch (error) {
        console.error("Error loading clubs/events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter clubs by search
  const filteredClubs = clubs.filter(
    (club) =>
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Count upcoming events per club
  const getEventCount = (clubId: string) =>
    events.filter((event) => event.clubId === clubId).length;

  // Category color helper
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

  // Loading state
  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#6B7280" }}>Loading clubs...</Text>
      </View>
    );
  }

  // Main UI
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Discover</Text>
          <Text style={styles.headerSubtitle}>Find clubs and organizations</Text>
        </View>
      </View>

      {/* Search Bar */}
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

      {/* Clubs List */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredClubs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No clubs found</Text>
            <Text style={styles.emptySubText}>Try a different search term</Text>
          </View>
        ) : (
          filteredClubs.map((club) => (
            <TouchableOpacity
              key={club.id}
              style={styles.clubCard}
              onPress={() =>
                router.push({
                  pathname: "/club-details-screen",
                  params: { id: club.id },
                })
              }
            >
              <View style={styles.clubHeader}>
                <View
                  style={[
                    styles.clubIcon,
                    { backgroundColor: getCategoryColor(club.category) },
                  ]}
                >
                  <Text style={styles.clubIconText}>
                    {club.name[0].toUpperCase()}
                  </Text>
                </View>

                <View style={styles.clubInfo}>
                  <Text style={styles.clubName}>{club.name}</Text>
                  <Text style={styles.clubDescription}>
                    {club.description.length > 80
                      ? club.description.substring(0, 80) + "..."
                      : club.description}
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
                      {getEventCount(club.id)} upcoming event
                      {getEventCount(club.id) !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// Styles
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
  emptyText: { color: "#6B7280", fontSize: 15 },
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
});
