import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
}

interface EventCardProps {
  event: Event;
  onPress: (event: Event) => void;
  onRSVP?: (eventId: string) => void;
  compact?: boolean;
}

export function EventCard({
  event,
  onPress,
  onRSVP,
  compact = false,
}: EventCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Academic: "#BFDBFE",
      Social: "#BBF7D0",
      Sports: "#FECACA",
      Arts: "#E9D5FF",
      Career: "#FED7AA",
      Other: "#E5E7EB",
    };
    return colors[category] || colors["Other"];
  };

  // Compact card (for small event lists)
  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={() => onPress(event)}
        activeOpacity={0.8}
      >
        <View style={styles.rowBetween}>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {event.title}
          </Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: getCategoryColor(event.category) },
            ]}
          >
            <Text style={styles.badgeText}>{event.category}</Text>
          </View>
        </View>

        <View style={styles.iconRow}>
          <View style={styles.iconItem}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color="#6B7280"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.iconText}>{formatDate(event.date)}</Text>
          </View>
          <View style={styles.iconItem}>
            <Ionicons
              name="time-outline"
              size={14}
              color="#6B7280"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.iconText}>{event.time}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Full event card
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(event)}
      activeOpacity={0.8}
    >
      {event.imageUrl && (
        <Image
          source={{ uri: event.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      <View style={styles.cardContent}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={2}>
              {event.title}
            </Text>
            <Text style={styles.description} numberOfLines={2}>
              {event.description}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: getCategoryColor(event.category) },
            ]}
          >
            <Text style={styles.badgeText}>{event.category}</Text>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.iconItem}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color="#6B7280"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.detailText}>{formatDate(event.date)}</Text>
          </View>

          <View style={styles.iconItem}>
            <Ionicons
              name="time-outline"
              size={16}
              color="#6B7280"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.detailText}>{event.time}</Text>
          </View>

          <View style={styles.iconItem}>
            <Ionicons
              name="location-outline"
              size={16}
              color="#6B7280"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.detailText}>{event.location}</Text>
          </View>

          <View style={styles.iconItem}>
            <Ionicons
              name="people-outline"
              size={16}
              color="#6B7280"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.detailText}>
              {event.attendees} attending
              {event.maxAttendees && ` / ${event.maxAttendees} max`}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  image: { width: "100%", height: 140 },
  cardContent: { padding: 12 },
  title: { fontSize: 16, fontWeight: "600", color: "#111827" },
  description: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeText: { fontSize: 11, color: "#1F2937", fontWeight: "500" },
  details: { marginTop: 8 },
  iconItem: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  detailText: { fontSize: 13, color: "#4B5563" },
  rsvpButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  rsvpText: { color: "white", fontWeight: "600" },
  cancelButton: { backgroundColor: "#E5E7EB" },
  cancelText: { color: "#111827" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  compactCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  compactTitle: { fontSize: 14, fontWeight: "500", color: "#111827" },
  iconRow: {
    flexDirection: "row",
    marginTop: 4,
    alignItems: "center",
  },
  iconText: { fontSize: 12, color: "#6B7280" },
});

export default EventCard;
