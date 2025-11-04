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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

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

  // ✅ Fetch clubs + events
  useEffect(() => {
    const fetchData = async () => {
      try {
        const clubSnap = await getDocs(collection(db, "clubs"));
        const clubData = clubSnap.docs.map((doc) => {
          const data = doc.data() as Club;
          const { id: _, ...rest } = data; // remove any Firestore id field if exists
          return { id: doc.id, ...rest };
        });

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

  const filteredClubs = clubs.filter(
    (club) =>
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEventCount = (clubId: string) =>
    events.filter((event) => event.clubId === clubId).length;

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

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#6B7280" }}>Loading clubs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Discover</Text>
          <Text style={styles.headerSubtitle}>Find clubs and organizations</Text>
        </View>
      </View>

      {/* ✅ Search Bar with outlined border */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={18}
          color="#6B7280"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Search clubs..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Club List */}
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
              activeOpacity={0.85}
              style={styles.clubCard}
              onPress={() =>
                router.push({
                  pathname: "/club-details-screen",
                  params: { id: club.id },
                })
              }
            >
              {/* Club Image or Placeholder */}
              {club.imageUrl ? (
                <Image
                  source={{ uri: club.imageUrl }}
                  style={styles.clubImage}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.clubImagePlaceholder,
                    { backgroundColor: getCategoryColor(club.category) },
                  ]}
                >
                  <Text style={styles.clubIconText}>
                    {club.name[0].toUpperCase()}
                  </Text>
                </View>
              )}

              {/* Club Info */}
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
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ✅ Styles
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
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#111827" },
  headerSubtitle: { fontSize: 13, color: "#6B7280" },

  // ✅ Better Search Bar with even border
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: "#111827",
    paddingLeft: 8,
  },
  searchIcon: { marginRight: 4 },

  scrollContent: { padding: 16, paddingBottom: 120 },
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyText: { color: "#6B7280", fontSize: 15 },
  emptySubText: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },

  // ✅ Clean Card Styling
  clubCard: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  clubImage: { width: "100%", height: 140 },
  clubImagePlaceholder: {
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  clubInfo: { padding: 12 },
  clubName: { fontWeight: "700", fontSize: 17, color: "#111827" },
  clubDescription: {
    color: "#4B5563",
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  badgeRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  categoryBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: { color: "white", fontSize: 11, fontWeight: "600" },
  eventCount: { fontSize: 12, color: "#6B7280", marginLeft: 8 },
  clubIconText: { color: "white", fontSize: 32, fontWeight: "bold" },
});
