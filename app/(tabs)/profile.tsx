import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthUser } from "../../src/hooks/useAuthUser";
import { auth } from "../../src/lib/firebase";
import { listClubs } from "../../src/services/clubsService";
import { Club, Event } from "../../src/types";
import { getUserLikedEvents, getUserFavoritedEvents } from "../../src/services/interactionsService";
import { getEventsByIds } from "../../src/services/eventsService";
import EventCard from "../event-card";
import { useFocusEffect } from "expo-router";

type ProfileEvent = {
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
};

const Profile = () => {
  const { user, profile, loading } = useAuthUser();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [likedEvents, setLikedEvents] = useState<ProfileEvent[]>([]);
  const [favoritedEvents, setFavoritedEvents] = useState<ProfileEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [activeTab, setActiveTab] = useState<'liked' | 'favorited'>('liked');

  useEffect(() => {
    const loadClubs = async () => {
      try {
        const clubsData = await listClubs();
        setClubs(clubsData);
      } catch (error) {
        console.error('Error loading clubs:', error);
      }
    };

    loadClubs();
  }, []);

  const loadUserEvents = useCallback(async () => {
    if (!user?.uid) {
      setLoadingEvents(false);
      return;
    }

    try {
      setLoadingEvents(true);
      
      // Fetch liked and favorited event IDs
      const [likedEventIds, favoritedEventIds] = await Promise.all([
        getUserLikedEvents(user.uid),
        getUserFavoritedEvents(user.uid),
      ]);

      // Fetch actual event data
      const [likedEventsData, favoritedEventsData] = await Promise.all([
        getEventsByIds(likedEventIds),
        getEventsByIds(favoritedEventIds),
      ]);

      // Convert to ProfileEvent format
      const clubsData = await listClubs();
      
      const convertToProfileEvent = (event: Event): ProfileEvent => {
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
        };
      };

      setLikedEvents(likedEventsData.map(convertToProfileEvent));
      setFavoritedEvents(favoritedEventsData.map(convertToProfileEvent));
    } catch (error) {
      console.error('Error loading user events:', error);
    } finally {
      setLoadingEvents(false);
    }
  }, [user?.uid]);

  // Load events when component mounts and when user changes
  useEffect(() => {
    loadUserEvents();
  }, [loadUserEvents]);

  // Reload events when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadUserEvents();
    }, [loadUserEvents])
  );

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      Alert.alert('Success', 'Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.header}>Profile</Text>
        <Text style={styles.subheader}>Manage your account and preferences</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileBox}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.name ? profile.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "?"}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{profile?.name || user?.displayName || "Unknown User"}</Text>
          <Text style={styles.email}>{profile?.email || user?.email}</Text>
          {profile && (
            <View style={styles.roleContainer}>
              <View style={[
                styles.roleBadge,
                { backgroundColor: profile.isAdmin ? '#2563EB' : (profile.role === 'member' ? '#10B981' : '#6B7280') }
              ]}>
                <Text style={styles.roleText}>
                  {profile.isAdmin ? 'Admin' : (profile.role === 'member' ? 'Club Member' : 'Student')}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* My Events Section */}
      {user && (
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>My Events</Text>
          
          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'liked' && styles.activeTab]}
              onPress={() => setActiveTab('liked')}
            >
              <Ionicons 
                name={activeTab === 'liked' ? "heart" : "heart-outline"} 
                size={18} 
                color={activeTab === 'liked' ? "#EF4444" : "#6B7280"} 
              />
              <Text style={[styles.tabText, activeTab === 'liked' && styles.activeTabText]}>
                Liked ({likedEvents.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'favorited' && styles.activeTab]}
              onPress={() => setActiveTab('favorited')}
            >
              <Ionicons 
                name={activeTab === 'favorited' ? "bookmark" : "bookmark-outline"} 
                size={18} 
                color={activeTab === 'favorited' ? "#3B82F6" : "#6B7280"} 
              />
              <Text style={[styles.tabText, activeTab === 'favorited' && styles.activeTabText]}>
                Favorited ({favoritedEvents.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Events List */}
          {loadingEvents ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Loading events...</Text>
            </View>
          ) : (
            <>
              {activeTab === 'liked' ? (
                likedEvents.length > 0 ? (
                  <View style={styles.eventsList}>
                    {likedEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onPress={() => router.push({ pathname: "/event-details-screen", params: { id: event.id } })}
                        compact={true}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="heart-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No liked events yet</Text>
                    <Text style={styles.emptySubtext}>Start liking events to see them here</Text>
                  </View>
                )
              ) : (
                favoritedEvents.length > 0 ? (
                  <View style={styles.eventsList}>
                    {favoritedEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onPress={() => router.push({ pathname: "/event-details-screen", params: { id: event.id } })}
                        compact={true}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="bookmark-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No favorited events yet</Text>
                    <Text style={styles.emptySubtext}>Start favoriting events to see them here</Text>
                  </View>
                )
              )}
            </>
          )}
        </View>
      )}

      {/* Settings Section */}
      <View style={styles.settingsBox}>
        {/* Notifications toggle */}
        <View style={styles.row}>
          <Text style={styles.rowTitle}>Push Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
        </View>

        {/* Verify Club Membership */}
        <TouchableOpacity 
          style={styles.row}
          onPress={() => router.push('/verify-club')}
        >
          <View style={styles.rowContent}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Verify Club Membership</Text>
              <Text style={styles.rowSubtitle}>Join clubs with verification codes</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* My Club Memberships */}
        {profile?.memberships && profile.memberships.length > 0 && (
          <View style={styles.membershipsSection}>
            <Text style={styles.sectionTitle}>My Club Memberships</Text>
            <View style={styles.clubTagsContainer}>
              {profile.memberships.map((clubSlug) => {
                const club = clubs.find(c => c.slug === clubSlug);
                return club ? (
                  <View key={clubSlug} style={styles.clubTag}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <Text style={styles.clubTagText}>{club.name}</Text>
                  </View>
                ) : null;
              })}
            </View>
          </View>
        )}

        {/* Settings */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/settings")}
        >
          <Text style={styles.rowTitle}>Settings</Text>
          <Text style={styles.rowSubtitle}>App preferences</Text>
        </TouchableOpacity>
      </View>

      {/* Log Out button */}
      <TouchableOpacity onPress={handleSignOut} style={styles.button}>
        <Ionicons name="log-out-outline" size={20} color="white" />
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  contentContainer: { padding: 20, paddingBottom: 120 },
  headerSection: { marginBottom: 24 },
  header: { 
    fontSize: 32, 
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subheader: { 
    fontSize: 16, 
    color: "#6B7280",
  },
  profileBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 24,
    borderWidth: 0.5,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatarText: { 
    fontSize: 28, 
    fontWeight: "700", 
    color: "#FFFFFF",
  },
  info: { flexDirection: "column", flex: 1 },
  name: { 
    fontSize: 22, 
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  email: { 
    fontSize: 15, 
    color: "#6B7280",
    marginBottom: 12,
  },
  eventsSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#F3F4F6",
    marginBottom: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  activeTab: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#111827",
    fontWeight: "600",
  },
  eventsList: {
    gap: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
  },
  settingsBox: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 0.5,
    borderColor: "#F3F4F6",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: "hidden",
  },
  row: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  rowTitle: { 
    fontSize: 16, 
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  rowSubtitle: { 
    fontSize: 14, 
    color: "#6B7280",
  },
  button: {
    backgroundColor: "#EF4444",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonText: { 
    color: "#FFFFFF", 
    fontSize: 16, 
    fontWeight: "600", 
    marginLeft: 8,
  },
  roleContainer: {
    marginTop: 8,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  roleText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowText: {
    marginLeft: 12,
    flex: 1,
  },
  membershipsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  clubTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  clubTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#10B981",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clubTagText: {
    fontSize: 12,
    color: "#065F46",
    fontWeight: "500",
    marginLeft: 4,
  },
});

export default Profile;
