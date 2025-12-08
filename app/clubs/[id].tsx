console.log("LOADED CLUB DETAILS SCREEN (ID ROUTE)");

import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getClubByIdSupabase,
  getEventsByClub,
  Club,
} from "../../data/dataLoader";
import { supabase } from "../../data/supabaseClient";
import { auth } from "../../src/lib/firebase";
import { useAppTheme, LightThemeColors } from "../../src/ThemeContext";

export default function ClubDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const themeContext = useAppTheme();
  const colors = themeContext?.colors || LightThemeColors;
  const isDark = themeContext?.isDark || false;

  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  // Stores event IDs that the user RSVP’d for
  const [userRsvps, setUserRsvps] = useState<number[]>([]);
  const [rsvpLoadingEventId, setRsvpLoadingEventId] = useState<number | null>(
    null
  );

  // Load club data, events, and RSVP list
  useEffect(() => {
    const load = async () => {
      if (!id) return;

      const numericId = Number(id);

      const c = await getClubByIdSupabase(numericId);
      const e = await getEventsByClub(numericId);

      if (c) c.events = e;
      setClub(c);

      await loadUserRsvps();

      setLoading(false);
    };

    load();
  }, [id]);

  // Load all RSVP event IDs for the current user
  const loadUserRsvps = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const { data, error } = await supabase
      .from("event_rsvp")
      .select("event_id")
      .eq("firebase_uid", user.uid);

    if (!error && data) {
      setUserRsvps(data.map((row) => row.event_id));
    }
  };

  // RSVP handler
  const handleRSVP = async (eventId: number) => {
    setRsvpLoadingEventId(eventId);

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Login required", "Please log in before RSVP.");
      setRsvpLoadingEventId(null);
      return;
    }

    const { error } = await supabase.from("event_rsvp").insert({
      event_id: eventId,
      firebase_uid: user.uid,
    });

    if (error) {
      console.log("RSVP insert error:", error);
      Alert.alert("Error", "Could not save RSVP.");
    } else {
      Alert.alert("Success", "RSVP recorded");
      setUserRsvps((prev) => [...prev, eventId]);
    }

    setRsvpLoadingEventId(null);
  };

  // Cancel RSVP handler
  const handleCancelRSVP = async (eventId: number) => {
    setRsvpLoadingEventId(eventId);

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Login required", "Please log in before canceling.");
      setRsvpLoadingEventId(null);
      return;
    }

    const { error } = await supabase
      .from("event_rsvp")
      .delete()
      .eq("event_id", eventId)
      .eq("firebase_uid", user.uid);

    if (error) {
      console.log("Cancel error:", error);
      Alert.alert("Error", "Could not cancel RSVP.");
    } else {
      Alert.alert("Canceled", "Your RSVP has been removed.");
      setUserRsvps((prev) => prev.filter((id) => id !== eventId));
    }

    setRsvpLoadingEventId(null);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.text }]}>Loading club...</Text>
      </View>
    );
  }

  if (!club) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.text }]}>Club not found.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: club.name, headerShown: false }} />

      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>Back to Discover</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text }]}>{club.name}</Text>
          <Text style={[styles.description, { color: colors.subtitle }]}>{club.description}</Text>
          <Text style={[styles.category, { color: colors.subtitle }]}>Category: {club.category}</Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Events</Text>

          {club.events && club.events.length > 0 ? (
            club.events.map((event: any) => {
              const isRsvped = userRsvps.includes(event.id);

              return (
                <View key={event.id} style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
                  <Text style={[styles.eventDate, { color: colors.subtitle }]}>Date: {event.date}</Text>
                  <Text style={[styles.eventLocation, { color: colors.subtitle }]}>
                    Location: {event.location}
                  </Text>
                  <Text style={[styles.eventDescription, { color: colors.subtitle }]}>
                    {event.description}
                  </Text>

                  {isRsvped ? (
                    <TouchableOpacity
                      style={[styles.rsvpButton, { backgroundColor: "#D14343" }]}
                      onPress={() => handleCancelRSVP(event.id)}
                      disabled={rsvpLoadingEventId === event.id}
                    >
                      <Text style={styles.rsvpText}>
                        {rsvpLoadingEventId === event.id
                          ? "Processing..."
                          : "Cancel RSVP"}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.rsvpButton, { backgroundColor: colors.primary }]}
                      onPress={() => handleRSVP(event.id)}
                      disabled={rsvpLoadingEventId === event.id}
                    >
                      <Text style={styles.rsvpText}>
                        {rsvpLoadingEventId === event.id
                          ? "Saving..."
                          : "RSVP"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          ) : (
            <Text style={[styles.noEvents, { color: colors.subtitle }]}>No upcoming events.</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFound: { fontSize: 16 },
  backButton: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  backText: { fontSize: 15, marginLeft: 6 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  description: { fontSize: 15, marginBottom: 12 },
  category: { fontSize: 13, marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: "600", marginBottom: 10 },
  eventCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  eventTitle: { fontSize: 16, fontWeight: "600" },
  eventDate: { marginTop: 4 },
  eventLocation: { marginTop: 2 },
  eventDescription: { marginTop: 6 },
  noEvents: { marginTop: 4 },
  rsvpButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  rsvpText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
});
