import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getClubs, Club } from "../../data/dataLoader";

export default function Discover() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  // Load club data from Supabase when screen mounts
  useEffect(() => {
    async function loadClubs() {
      try {
        const data = await getClubs(); // fetch from Supabase
        setClubs(data || []);
      } catch (error) {
        console.error("Error loading clubs:", error);
      } finally {
        setLoading(false);
      }
    }
    loadClubs();
  }, []);

  // Filter clubs by search text
  const filteredClubs = clubs.filter((club) => {
    const name = club.name?.toLowerCase() ?? "";
    const category = club.category?.toLowerCase() ?? "";
    const description = club.description?.toLowerCase() ?? "";
    return (
      name.includes(searchQuery.toLowerCase()) ||
      category.includes(searchQuery.toLowerCase()) ||
      description.includes(searchQuery.toLowerCase())
    );
  });

  const getEventCount = (club: Club) => Array.isArray(club.events) ? club.events.length : 0;


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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#9CA3AF"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Search clubs, categories..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Club List */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredClubs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No clubs found</Text>
            <Text style={styles.emptySubText}>Try a different search term</Text>
          </View>
        ) : (
          filteredClubs.map((club) => (
            <TouchableOpacity
              key={club.id}
              activeOpacity={0.9}
              style={styles.clubCard}
              onPress={() =>
                router.push({
                  pathname: "/clubs/[id]" as any,
                  params: { id: club.id },
                })
              }
            >
              <View style={styles.imageContainer}>
                <Image
                  source={{
                    uri:
                      club.imageUrl && club.imageUrl.startsWith("http")
                        ? club.imageUrl
                        : "https://via.placeholder.com/400x200.png?text=Club+Image",
                  }}
                  style={styles.clubImage}
                  resizeMode="cover"
                />
                <View style={styles.imageOverlay}>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: getCategoryColor(club.category || "Other") },
                    ]}
                  >
                    <Text style={styles.categoryText}>{club.category}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.clubInfo}>
                <Text style={styles.clubName} numberOfLines={2}>
                  {club.name}
                </Text>
                <Text style={styles.clubDescription} numberOfLines={2}>
                  {club.description || "No description available"}
                </Text>

                <View style={styles.footerRow}>
                  <View style={styles.eventInfo}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.eventCount}>
                      {getEventCount(club)} event{getEventCount(club) !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
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
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderColor: "#F3F4F6",
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: "700", 
    color: "#111827",
    letterSpacing: -0.5,
  },
  headerSubtitle: { 
    fontSize: 14, 
    color: "#6B7280",
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingLeft: 8,
    paddingVertical: 0,
  },
  searchIcon: { marginRight: 8 },
  clearButton: {
    marginLeft: 8,
    padding: 2,
  },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingBottom: 120,
  },
  emptyState: { 
    alignItems: "center", 
    marginTop: 80,
    paddingVertical: 40,
  },
  emptyText: { 
    color: "#374151", 
    fontSize: 16,
    fontWeight: "500",
    marginTop: 16,
  },
  emptySubText: { 
    fontSize: 14, 
    color: "#9CA3AF", 
    marginTop: 8,
  },
  clubCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 0.5,
    borderColor: "#F3F4F6",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
  },
  clubImage: { 
    width: "100%", 
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  clubInfo: { 
    padding: 16,
  },
  clubName: { 
    fontWeight: "700", 
    fontSize: 20, 
    color: "#111827",
    lineHeight: 26,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  clubDescription: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  eventInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  categoryText: { 
    color: "#FFFFFF", 
    fontSize: 12, 
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  eventCount: { 
    fontSize: 13, 
    color: "#6B7280",
    fontWeight: "500",
  },
});
