// Imports
import { db, auth } from "../FirebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";

// Event interface
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
  organizer?: string;
  fullDescription?: string;
}

// Main Component
export default function EventDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Event state
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch event details
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, "events", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setEvent({ ...(docSnap.data() as Event), id: docSnap.id });
        } else {
          console.log("No such event!");
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  // Track logged-in user
  const [currentUser, setCurrentUser] = useState<any>(null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  // Handle RSVP
  const handleRSVP = async (eventId: string, eventTitle: string) => {
    try {
      if (!currentUser) {
        alert("Please log in to RSVP.");
        return;
      }

      await setDoc(doc(db, "rsvps", `${currentUser.uid}_${eventId}`), {
        userId: currentUser.uid,
        eventId: eventId,
        timestamp: serverTimestamp(),
      });

      await addDoc(collection(db, "notifications"), {
        userId: currentUser.uid,
        message: `You RSVP’d for ${eventTitle}!`,
        timestamp: serverTimestamp(),
        read: false,
      });

      alert(`You have RSVP’d for “${eventTitle}” successfully!`);
    } catch (error) {
      console.error("Error RSVPing:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading event...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text>Event not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Helpers
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      Academic: "#3B82F6",
      Social: "#10B981",
      Sports: "#EF4444",
      Arts: "#A855F7",
      Career: "#F97316",
      Other: "#9CA3AF",
    };
    return colors[category] || colors["Other"];
  };

  const isEventFull =
    event.maxAttendees && event.attendees >= event.maxAttendees;
  const isEventPast = new Date(event.date) < new Date();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back-outline" size={20} color="#111" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.iconRow}>
          <TouchableOpacity onPress={() => console.log("Shared")} style={styles.iconButton}>
            <Ionicons name="share-outline" size={20} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => console.log("Favorited")} style={styles.iconButton}>
            <Ionicons name="heart-outline" size={20} color="#111" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Banner */}
      <View
        style={[
          styles.imageHeader,
          { backgroundColor: getCategoryColor(event.category) },
        ]}
      >
        {event.imageUrl ? (
          <Image
            source={{ uri: event.imageUrl }}
            style={styles.eventImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imageOverlay}>
            <Text style={styles.title}>{event.title}</Text>
            <View style={[styles.badge, { backgroundColor: "#FFF3" }]}>
              <Text style={styles.badgeText}>{event.category}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" style={styles.icon} />
            <View>
              <Text style={styles.infoTitle}>{formatDate(event.date)}</Text>
              <Text style={styles.infoSubtitle}>Date</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#6B7280" style={styles.icon} />
            <View>
              <Text style={styles.infoTitle}>{event.time}</Text>
              <Text style={styles.infoSubtitle}>Time</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#6B7280" style={styles.icon} />
            <View>
              <Text style={styles.infoTitle}>{event.location}</Text>
              <Text style={styles.infoSubtitle}>Location</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={20} color="#6B7280" style={styles.icon} />
            <View>
              <Text style={styles.infoTitle}>
                {event.attendees} attending
                {event.maxAttendees && ` / ${event.maxAttendees} max`}
              </Text>
              <Text style={styles.infoSubtitle}>Attendees</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About this event</Text>
          <Text style={styles.description}>
            {event.fullDescription || event.description}
          </Text>

          {event.organizer && (
            <View style={styles.organizerBlock}>
              <Text style={styles.sectionTitle}>Organizer</Text>
              <Text style={styles.organizerText}>{event.organizer}</Text>
            </View>
          )}
        </View>

        {/* RSVP */}
        <View style={styles.card}>
          {isEventPast ? (
            <TouchableOpacity style={[styles.button, styles.disabled]}>
              <Text style={styles.buttonText}>Event has ended</Text>
            </TouchableOpacity>
          ) : isEventFull && !event.isUserAttending ? (
            <TouchableOpacity style={[styles.button, styles.disabled]}>
              <Text style={styles.buttonText}>Event is full</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.button,
                  event.isUserAttending ? styles.cancelButton : styles.rsvpButton,
                ]}
                onPress={() => handleRSVP(event.id, event.title)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    event.isUserAttending && styles.cancelText,
                  ]}
                >
                  {event.isUserAttending ? "Cancel RSVP" : "RSVP to Event"}
                </Text>
              </TouchableOpacity>
              <Text style={styles.rsvpNote}>
                {event.isUserAttending
                  ? "You're attending this event"
                  : "Join other students at this event"}
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "white",
  },
  backButton: { flexDirection: "row", alignItems: "center" },
  backText: { marginLeft: 6, fontSize: 15, color: "#111827", fontWeight: "500" },
  iconRow: { flexDirection: "row" },
  iconButton: { marginLeft: 12 },
  imageHeader: { height: 160, justifyContent: "center", alignItems: "center" },
  imageOverlay: { alignItems: "center" },
  title: { color: "white", fontSize: 22, fontWeight: "bold", textAlign: "center" },
  badge: { marginTop: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: "white", fontWeight: "500", fontSize: 12 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  icon: { marginRight: 12 },
  infoTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  infoSubtitle: { fontSize: 12, color: "#6B7280" },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  description: { color: "#4B5563", fontSize: 14, lineHeight: 20 },
  organizerBlock: {
    marginTop: 14,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    paddingTop: 10,
  },
  organizerText: { color: "#6B7280", fontSize: 14 },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  rsvpButton: { backgroundColor: "#3B82F6" },
  cancelButton: { backgroundColor: "#E5E7EB" },
  buttonText: { color: "white", fontWeight: "600" },
  cancelText: { color: "#111827" },
  disabled: { backgroundColor: "#9CA3AF" },
  rsvpNote: {
    textAlign: "center",
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
  },
  eventImage: { width: "100%", height: "100%" },
});
