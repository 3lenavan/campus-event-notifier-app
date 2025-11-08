import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getClubById } from "../../data/dataLoader";

export default function ClubDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const club = id ? getClubById(id) : undefined;

  if (!club) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Club not found.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: club.name,
          headerShown: false, // hide default header
        }}
      />
      {/* SafeAreaView ensures content doesn’t overlap with status bar/notch */}
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
        <ScrollView style={styles.container}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#111827" />
            <Text style={styles.backText}>Back to Discover</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{club.name}</Text>
          <Text style={styles.description}>{club.description}</Text>
          <Text style={styles.category}>Category: {club.category}</Text>

          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {club.events && club.events.length > 0 ? (
            club.events.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDate}>📅 {event.date}</Text>
                {event.location && (
                  <Text style={styles.eventLocation}>📍 {event.location}</Text>
                )}
                {event.description && (
                  <Text style={styles.eventDescription}>
                    {event.description}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noEvents}>No upcoming events</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFound: {
    fontSize: 16,
    color: "#6B7280",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 4, // added space below status bar
  },
  backText: {
    color: "#111827",
    fontSize: 15,
    marginLeft: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: "#374151",
    marginBottom: 12,
  },
  category: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
  },
  eventCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  eventDate: {
    color: "#6B7280",
    marginTop: 4,
  },
  eventLocation: {
    color: "#6B7280",
    marginTop: 2,
  },
  eventDescription: {
    color: "#374151",
    marginTop: 6,
  },
  noEvents: {
    color: "#9CA3AF",
    marginTop: 4,
  },
});
