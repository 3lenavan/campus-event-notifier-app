import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuthUser } from "../../src/hooks/useAuthUser";
import { getEventPolicy, isCreationEnabledForClub } from "../../src/lib/eventPolicy";
import { getLS, LS_KEYS } from "../../src/lib/localStorage";
import { listApprovedEvents } from "../../src/services/eventsService";
import { getEventsInteractions, toggleLike as toggleLikeService, toggleFavorite as toggleFavoriteService } from "../../src/services/interactionsService";
import { Club } from "../../src/types";
import { ClubModerationPanel } from "../../src/components";
import EventCard from "../event-card";

// Legacy event interface for compatibility with existing EventCard component
interface LegacyEvent {
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
  const { user, profile } = useAuthUser();

  // Search + expand state
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedClubs, setExpandedClubs] = useState<Set<string>>(new Set());

  // Load events from Local Storage
  const [events, setEvents] = useState<LegacyEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  
  // Event interactions state (likes/favorites)
  const [eventInteractions, setEventInteractions] = useState<{
    likedEvents: Set<string>;
    favoritedEvents: Set<string>;
    likeCounts: Record<string, number>;
  }>({
    likedEvents: new Set(),
    favoritedEvents: new Set(),
    likeCounts: {},
  });
  
  // Event policy state
  const [eventPolicy, setEventPolicy] = useState<any>(null);
  const [canCreateEvents, setCanCreateEvents] = useState<Record<string, boolean>>({});
  
  // Moderation panel state
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const [selectedClubForModeration, setSelectedClubForModeration] = useState<Club | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsData = await listApprovedEvents();
        // Convert new Event format to legacy format for EventCard compatibility
        const legacyEvents: LegacyEvent[] = eventsData.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          date: new Date(event.dateISO).toISOString().split('T')[0],
          time: new Date(event.dateISO).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          location: event.location,
          category: 'Club Event', // Default category
          attendees: 0, // Default attendees
          clubId: event.clubId,
          clubName: 'Unknown Club', // Will be resolved below
        }));
        setEvents(legacyEvents);

        // Load likes and favorites if user is logged in
        if (user?.uid && legacyEvents.length > 0) {
          const eventIds = legacyEvents.map(e => e.id);
          const interactions = await getEventsInteractions(user.uid, eventIds);
          setEventInteractions(interactions);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [user]);

  // Load clubs from Local Storage
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const clubsData = await getLS<Club[]>(LS_KEYS.CLUBS, []);
        setClubs(clubsData);
      } catch (error) {
        console.error("Error fetching clubs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  // Load event policy
  useEffect(() => {
    const loadEventPolicy = async () => {
      try {
        const policy = await getEventPolicy();
        setEventPolicy(policy);
      } catch (error) {
        console.error("Error loading event policy:", error);
      }
    };

    loadEventPolicy();
  }, []);

  // Check creation permissions for all clubs when profile or policy changes
  useEffect(() => {
    const checkCreationPermissions = async () => {
      if (!profile || !clubs.length) return;
      
      const permissions: Record<string, boolean> = {};
      
      for (const club of clubs) {
        try {
          const canCreate = await canCreateEvent(club.id);
          permissions[club.id] = canCreate;
        } catch (error) {
          console.error(`Error checking permissions for club ${club.id}:`, error);
          permissions[club.id] = false;
        }
      }
      
      setCanCreateEvents(permissions);
    };

    checkCreationPermissions();
  }, [profile, clubs, eventPolicy]);

  // Filters club list by search input
  const filteredClubs = clubs.filter(
    (club) =>
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Groups and sorts events by club
  const getClubEvents = (clubId: string) =>
    events
      .filter((event) => event.clubId === clubId)
      .filter((event) => new Date(event.date) >= new Date()) // only future events
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

  // Handle like toggle
  const handleToggleLike = useCallback(async (eventId: string) => {
    if (!user?.uid) {
      return;
    }

    try {
      await toggleLikeService(user.uid, eventId);
      
      // Reload interactions
      const eventIds = events.map(e => e.id);
      const interactions = await getEventsInteractions(user.uid, eventIds);
      setEventInteractions(interactions);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  }, [user, events]);

  // Handle favorite toggle
  const handleToggleFavorite = useCallback(async (eventId: string) => {
    if (!user?.uid) {
      return;
    }

    try {
      await toggleFavoriteService(user.uid, eventId);
      
      // Reload interactions
      const eventIds = events.map(e => e.id);
      const interactions = await getEventsInteractions(user.uid, eventIds);
      setEventInteractions(interactions);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  }, [user, events]);

  // Check if user can create events for a club
  const canCreateEvent = async (clubId: string) => {
    // Basic membership check
    if (!profile || profile.role !== 'member' || !profile.memberships.includes(clubId)) {
      return false;
    }
    
    // Check if event creation is enabled for this club
    try {
      const isEnabled = await isCreationEnabledForClub(clubId);
      return isEnabled;
    } catch (error) {
      console.error('Error checking event creation policy:', error);
      return false;
    }
  };

  // Toggles club expand/collapse
  const toggleClubExpansion = (clubId: string) => {
    const newExpanded = new Set(expandedClubs);
    newExpanded.has(clubId)
      ? newExpanded.delete(clubId)
      : newExpanded.add(clubId);
    setExpandedClubs(newExpanded);
  };

  const isClubExpanded = (clubId: string) => expandedClubs.has(clubId);

  // Handle moderation panel
  const openModerationPanel = (club: Club) => {
    setSelectedClubForModeration(club);
    setShowModerationPanel(true);
  };

  const closeModerationPanel = () => {
    setShowModerationPanel(false);
    setSelectedClubForModeration(null);
  };

  // Assigns colors to category tags
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

  // Loading placeholders while Firestore data loads
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

  // Main content
  return (
    <View style={styles.container}>
      {/* Moderation Panel */}
      {showModerationPanel && selectedClubForModeration && (
        <View style={styles.moderationPanelOverlay}>
          <View style={styles.moderationPanel}>
            <View style={styles.moderationPanelHeader}>
              <Text style={styles.moderationPanelTitle}>
                Moderate {selectedClubForModeration.name}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModerationPanel}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ClubModerationPanel
              clubId={selectedClubForModeration.id}
              clubName={selectedClubForModeration.name}
            />
          </View>
        </View>
      )}
      {/* Header section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Discover</Text>
          <Text style={styles.headerSubtitle}>Find clubs and events</Text>
        </View>
      </View>

      {/* Search bar */}
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

      {/* Club list */}
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
                      {club.category}
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
                      
                      {/* Membership indicator */}
                      {profile?.memberships.includes(club.id) && (
                        <View style={styles.membershipBadge}>
                          <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                          <Text style={styles.membershipText}>Member</Text>
                        </View>
                      )}
                      
                      <Text style={styles.eventCount}>
                        {clubEvents.length} upcoming event
                        {clubEvents.length !== 1 ? "s" : ""}
                      </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtonsContainer}>
                      {/* Create Event Button - only show if user can create events */}
                      {canCreateEvents[club.id] && (
                        <TouchableOpacity
                          style={styles.createEventButton}
                          onPress={() => router.push({
                            pathname: '/create-event',
                            params: { clubId: club.id }
                          })}
                        >
                          <Ionicons name="add-circle" size={16} color="#3B82F6" />
                          <Text style={styles.createEventButtonText}>
                            {eventPolicy?.moderationMode !== "off" 
                              ? "Submit Event (goes to review)" 
                              : "Create Event"}
                          </Text>
                        </TouchableOpacity>
                      )}
                      
                      {/* Moderation Button - only show if user is a member and moderation is enabled */}
                      {profile?.role === 'member' && 
                       profile?.memberships.includes(club.id) && 
                       eventPolicy?.moderationMode !== "off" && (
                        <TouchableOpacity
                          style={styles.moderationButton}
                          onPress={() => openModerationPanel(club)}
                        >
                          <Ionicons name="shield-checkmark" size={16} color="#8B5CF6" />
                          <Text style={styles.moderationButtonText}>Moderate</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>

                {/* Club events preview */}
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
                        onLike={user ? handleToggleLike : undefined}
                        onFavorite={user ? handleToggleFavorite : undefined}
                        liked={eventInteractions.likedEvents.has(event.id)}
                        favorited={eventInteractions.favoritedEvents.has(event.id)}
                        likesCount={eventInteractions.likeCounts[event.id] || 0}
                      />
                    ))}

                    {/* Show more / less */}
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
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    flexWrap: "wrap",
  },
  createEventButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF4FF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  createEventButtonText: {
    color: "#3B82F6",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  moderationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  moderationButtonText: {
    color: "#8B5CF6",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  membershipBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#10B981",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 6,
  },
  membershipText: {
    color: "#065F46",
    fontSize: 10,
    fontWeight: "500",
    marginLeft: 2,
  },
  moderationPanelOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  moderationPanel: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "90%",
    height: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  moderationPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  moderationPanelTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
});
