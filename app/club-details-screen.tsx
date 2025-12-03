import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Club, getClubByIdSupabase } from "../data/dataLoader";
import { useAuthUser } from "../src/hooks/useAuthUser";
import { listClubEvents } from "../src/services/eventsService";
import { getEventsInteractions } from "../src/services/interactionsService";

export default function ClubDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthUser();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const numericId = Number(id);
    const c = await getClubByIdSupabase(numericId);
    setClub(c);
    
    // Load events using the events service
    const clubEvents = await listClubEvents(id);
    
    // Transform events for display
    const transformedEvents = clubEvents
      .map((event) => {
        const date = new Date(event.dateISO);
        return {
          id: event.id,
          title: event.title,
          description: event.description,
          dateISO: event.dateISO,
          date: date,
          formattedDate: date.toLocaleDateString("en-US", { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          }),
          time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
          location: event.location,
          category: club?.category || "Club Event",
          imageUrl: event.imageUrl,
        };
      })
      .sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());

    // Load interactions if user is logged in
    if (user?.uid && transformedEvents.length > 0) {
      const eventIds = transformedEvents.map(e => e.id);
      const interactions = await getEventsInteractions(user.uid, eventIds);
      
      transformedEvents.forEach(event => {
        (event as any).liked = interactions.likedEvents.has(event.id);
        (event as any).favorited = interactions.favoritedEvents.has(event.id);
        (event as any).likes = interactions.likeCounts[event.id] || 0;
      });
    }

    setEvents(transformedEvents);
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

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

  const handleEventPress = (event: any) => {
    router.push({ pathname: "/event-details-screen", params: { id: event.id } });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading club...</Text>
      </View>
    );
  }

  if (!club) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
        <Text style={styles.notFound}>Club not found.</Text>
        <TouchableOpacity 
          style={styles.backButtonText} 
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonTextLabel}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: club.name, headerShown: false }} />

      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <ScrollView 
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Image with Overlay Navigation */}
          <View style={styles.heroContainer}>
            <Image
              source={{
                uri:
                  club.imageUrl && club.imageUrl.startsWith("http")
                    ? club.imageUrl
                    : "https://via.placeholder.com/800x400.png?text=Club+Image",
              }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            
            {/* Navigation Overlay */}
            <View style={styles.heroHeader}>
              <TouchableOpacity 
                style={styles.backButtonOverlay} 
                onPress={() => router.back()}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Category Badge Overlay */}
            <View style={styles.heroOverlay}>
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

          {/* Club Info Section */}
          <View style={styles.contentSection}>
            <Text style={styles.title}>{club.name}</Text>
            
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color="#10B981" />
              <Text style={styles.locationText}>Campus Organization</Text>
            </View>

            <View style={styles.ratingRow}>
              <Ionicons name="calendar" size={16} color="#3B82F6" />
              <Text style={styles.ratingText}>{events.length}</Text>
              <Text style={styles.reviewsText}>upcoming event{events.length !== 1 ? "s" : ""}</Text>
            </View>

            <Text style={styles.description}>{club.description || "No description available."}</Text>
          </View>

          {/* Events Section */}
          <View style={styles.eventsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
            </View>

            {events.length > 0 ? (
              <View style={styles.eventsList}>
                {events.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.eventCard}
                    onPress={() => handleEventPress(event)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.eventCardContent}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      
                      <View style={styles.eventDetails}>
                        <View style={styles.eventDetailRow}>
                          <Text style={styles.eventDetailLabel}>Date:</Text>
                          <Text style={styles.eventDetailValue}>{event.formattedDate}</Text>
                        </View>
                        
                        <View style={styles.eventDetailRow}>
                          <Text style={styles.eventDetailLabel}>Location:</Text>
                          <Text style={styles.eventDetailValue}>{event.location}</Text>
                        </View>
                        
                        {event.description && (
                          <Text style={styles.eventDescription} numberOfLines={2}>
                            {event.description}
                          </Text>
                        )}
                      </View>

                      <TouchableOpacity
                        style={styles.rsvpButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleEventPress(event);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.rsvpButtonText}>RSVP</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyEvents}>
                <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyEventsText}>No upcoming events</Text>
                <Text style={styles.emptyEventsSubtext}>Check back later for new events</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#FFFFFF",
  },
  center: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#6B7280",
  },
  notFound: { 
    fontSize: 18, 
    color: "#374151",
    fontWeight: "500",
    marginTop: 16,
  },
  heroContainer: {
    position: "relative",
    width: "100%",
    height: 320,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButtonOverlay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroOverlay: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingTop: 60,
  },
  backText: { 
    color: "#3B82F6", 
    fontSize: 15,
    fontWeight: "500",
    marginTop: 12,
  },
  categoryBadge: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  categoryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  contentSection: {
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  title: { 
    fontSize: 32, 
    fontWeight: "700", 
    color: "#111827",
    marginBottom: 12,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  ratingText: {
    fontSize: 15,
    color: "#3B82F6",
    fontWeight: "600",
  },
  reviewsText: {
    fontSize: 15,
    color: "#6B7280",
  },
  description: { 
    fontSize: 16, 
    color: "#6B7280", 
    lineHeight: 24,
    marginBottom: 8,
  },
  eventsSection: {
    padding: 20,
    paddingTop: 0,
    backgroundColor: "#FFFFFF",
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: { 
    fontSize: 22, 
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.3,
  },
  eventsList: {
    gap: 16,
  },
  eventCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  eventCardContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  eventDetails: {
    marginBottom: 16,
  },
  eventDetailRow: {
    flexDirection: "row",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  eventDetailLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    marginRight: 8,
  },
  eventDetailValue: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  eventDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginTop: 8,
  },
  rsvpButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  rsvpButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyEvents: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyEventsText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
    marginTop: 16,
  },
  emptyEventsSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
  },
  backButtonText: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#111827",
    borderRadius: 12,
    marginTop: 16,
  },
  backButtonTextLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
