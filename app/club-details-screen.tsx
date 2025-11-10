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
import { getClubByIdSupabase } from "../data/dataLoader";

export default function ClubDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const numericId = Number(id);
      const c = await getClubByIdSupabase(numericId);
      setClub(c);
      setLoading(false);
    };
    load();
  }, [id]);

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
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color="#111827" />
        <Text style={styles.backText}>Back to Discover</Text>
      </TouchableOpacity>

      {club.imageUrl && (
        <Image source={{ uri: club.imageUrl }} style={styles.bannerImage} />
      )}

      <Text style={styles.title}>{club.name}</Text>
      <Text style={styles.description}>{club.description}</Text>
      <Text style={styles.category}>Category: {club.category}</Text>

      <Text style={styles.sectionTitle}>Upcoming Events</Text>

      {club.events && club.events.length > 0 ? (
        club.events.map((event: any) => (
          <View key={event.id} style={styles.eventCard}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventDate}>📅 {event.date}</Text>
            <Text style={styles.eventLocation}>📍 {event.location}</Text>
            <Text style={styles.eventDescription}>{event.description}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.noEvents}>No upcoming events.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  backButton: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backText: { marginLeft: 6, fontSize: 15, color: "#111827" },
  bannerImage: { width: "100%", height: 160, borderRadius: 12, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  description: { color: "#4B5563", fontSize: 15, marginTop: 6 },
  category: { color: "#6B7280", marginTop: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  eventCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  eventTitle: { fontWeight: "700", fontSize: 16, color: "#111827" },
  eventDate: { fontSize: 14, color: "#4B5563", marginTop: 4 },
  eventLocation: { fontSize: 14, color: "#4B5563", marginTop: 2 },
  eventDescription: { fontSize: 13, color: "#6B7280", marginTop: 6 },
  noEvents: { color: "#9CA3AF", fontSize: 14 },
});
