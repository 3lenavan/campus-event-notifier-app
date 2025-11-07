import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuthUser } from "../src/hooks/useAuthUser";
import { notifyRSVPConfirmation } from "../src/lib/notifications";
import { getLS, LS_KEYS } from "../src/lib/localStorage";
import { listEvents } from "../src/services/eventsService";
import type { Club, Event as EventModel } from "../src/types";

export default function EventDetails() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { user } = useAuthUser();

  const [event, setEvent] = useState<EventModel | null>(null);
  const [clubName, setClubName] = useState("Unknown Club");
  const [loading, setLoading] = useState(true);
  const [isAttending, setIsAttending] = useState(false);

  const eventId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        setLoading(false);
        return;
      }

      try {
        const events = await listEvents();
        const found = events.find(evt => evt.id === eventId) ?? null;
        setEvent(found);

        if (found) {
          const clubs = (await getLS<Club[]>(LS_KEYS.CLUBS, [])) ?? [];
          const matchedClub = clubs.find(club => club.id === found.clubId);
          setClubName(matchedClub?.name ?? "Unknown Club");
        } else {
          setClubName("Unknown Club");
        }
      } catch (error) {
        console.error("Error fetching event:", error);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const eventDate = useMemo(() => {
    if (!event) return null;
    return new Date(event.dateISO);
  }, [event]);

  const formattedDate = eventDate
    ? eventDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const formattedTime = eventDate
    ? eventDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  const isEventPast = eventDate ? eventDate < new Date() : false;

  const handleRSVP = async () => {
    if (!event) {
      return;
    }

    if (!user) {
      Alert.alert("Login Required", "Please sign in to RSVP for this event.");
      return;
    }

    const attendingNext = !isAttending;

    if (attendingNext) {
      try {
        await notifyRSVPConfirmation(event.title);
      } catch (error) {
        console.error("Error sending RSVP notification:", error);
      }
      Alert.alert("RSVP Confirmed", `You RSVP'd for ${event.title}`);
    } else {
      Alert.alert("RSVP Cancelled", `Your RSVP for ${event.title} has been cancelled.`);
    }

    setIsAttending(attendingNext);
  };

  const handleAddToCalendar = (eventDetails: EventModel) => {
    try {
      if (typeof window === "undefined") {
        Alert.alert("Not Supported", "Add to calendar is only available on web.");
        return;
      }

      const eventDateTime = new Date(eventDetails.dateISO);
      const endDateTime = new Date(eventDateTime.getTime() + 2 * 60 * 60 * 1000);

      const startTime = eventDateTime.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const endTime = endDateTime.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

      const uid = `event-${eventDetails.id}-${Date.now()}`;
      const description = (eventDetails.description ?? "").replace(/\r?\n/g, "\\n");

      const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Campus Event Notifier//EN",
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTART:${startTime}`,
        `DTEND:${endTime}`,
        `SUMMARY:${eventDetails.title}`,
        `DESCRIPTION:${description}\\n\\nLocation: ${eventDetails.location}`,
        `LOCATION:${eventDetails.location}`,
        "STATUS:CONFIRMED",
        "TRANSP:OPAQUE",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n");

      const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${eventDetails.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      Alert.alert("Calendar Event", "Calendar file downloaded successfully!");
    } catch (error) {
      console.error("Error creating calendar file:", error);
      Alert.alert("Error", "Failed to create calendar file. Please try again.");
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

  return (
    <View style={styles.container}>
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

      <View style={[styles.imageHeader, { backgroundColor: "#3B82F6" }]}>
        <View style={styles.imageOverlay}>
          <Text style={styles.title}>{event.title}</Text>
          <View style={[styles.badge, { backgroundColor: "#FFF3" }]}>
            <Text style={styles.badgeText}>{clubName}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" style={styles.icon} />
            <View>
              <Text style={styles.infoTitle}>{formattedDate}</Text>
              <Text style={styles.infoSubtitle}>Date</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#6B7280" style={styles.icon} />
            <View>
              <Text style={styles.infoTitle}>{formattedTime}</Text>
              <Text style={styles.infoSubtitle}>Time</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#6B7280" style={styles.icon} />
            <View>
              <Text style={styles.infoTitle}>{event.location || "Location TBD"}</Text>
              <Text style={styles.infoSubtitle}>Location</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={20} color="#6B7280" style={styles.icon} />
            <View>
              <Text style={styles.infoTitle}>{clubName}</Text>
              <Text style={styles.infoSubtitle}>Club</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About this event</Text>
          <Text style={styles.description}>
            {event.description || "No additional details provided."}
          </Text>
        </View>

        <View style={styles.card}>
          {isEventPast ? (
            <TouchableOpacity style={[styles.button, styles.disabled]}>
              <Text style={styles.buttonText}>Event has ended</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.button,
                  isAttending ? styles.cancelButton : styles.rsvpButton,
                ]}
                onPress={handleRSVP}
              >
                <Text
                  style={[
                    styles.buttonText,
                    isAttending && styles.cancelText,
                  ]}
                >
                  {isAttending ? "Cancel RSVP" : "RSVP to Event"}
                </Text>
              </TouchableOpacity>
              <Text style={styles.rsvpNote}>
                {isAttending
                  ? "You're attending this event"
                  : "Join other students at this event"}
              </Text>
            </>
          )}
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.button, styles.calendarButton]}
            onPress={() => handleAddToCalendar(event)}
          >
            <Ionicons name="calendar-outline" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Add to Calendar</Text>
          </TouchableOpacity>
          <Text style={styles.calendarNote}>
            Download an .ics file to add this event to your calendar
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

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
  calendarButton: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  calendarNote: {
    textAlign: "center",
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
  },
});
