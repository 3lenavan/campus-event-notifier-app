import { Ionicons } from "@expo/vector-icons";
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

/**
 * THIS type matches EXACTLY what Home screen sends to EventCard.
 */
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;       // ISO string
  time: string;       // formatted string
  location: string;
  category: string;
  attendees: number;
  maxAttendees?: number;
  imageUrl?: string;
  isUserAttending?: boolean;
  liked?: boolean;
  favorited?: boolean;
  likes?: number;
  club?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

interface Props {
  event: Event;
  onPress: (event: Event) => void;
  onRSVP?: (id: string) => void;
  onLike?: (id: string) => void;
  onFavorite?: (id: string) => void;
  liked?: boolean;
  favorited?: boolean;
  likesCount?: number;
}

export default function EventCard({
  event,
  onPress,
  onRSVP,
  onLike,
  onFavorite,
  liked,
  favorited,
  likesCount,
}: Props) {

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(event)}>
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri:
              event.imageUrl ||
              "https://via.placeholder.com/400x300.png?text=Event+Image",
          }}
          style={styles.image}
          resizeMode="cover"
          onError={(error) => {
            console.log("Image load error:", error.nativeEvent.error);
            console.log("Image URL:", event.imageUrl);
          }}
        />
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.title}>{event.title}</Text>
        
        {event.club && (
          <View style={styles.clubRow}>
            <Ionicons name="people" size={14} color="#3B82F6" />
            <Text style={styles.clubText}>{event.club.name}</Text>
          </View>
        )}
        
        <Text style={styles.locationText}>{event.location}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{event.date}</Text>
          <Text style={styles.metaText}>{event.time}</Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {event.description}
        </Text>

        <TouchableOpacity style={styles.seeMoreButton} onPress={() => onPress(event)}>
          <Text style={styles.seeMoreText}>See more</Text>
          <Ionicons name="chevron-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    marginBottom: 24,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "#F3F4F6",
    width: "100%",
    alignSelf: "stretch",
  },
  imageContainer: {
    width: "100%",
    height: 240,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  cardContent: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  clubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  clubText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "600",
  },
  locationText: {
    fontSize: 14,
    color: "#6B7280",
    marginVertical: 4,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 8,
  },
  metaText: {
    fontSize: 14,
    color: "#374151",
  },
  description: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 16,
  },
  seeMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderRadius: 12,
  },
  seeMoreText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 6,
  }
});
