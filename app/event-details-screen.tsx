// Imports
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { EncodingType } from "expo-file-system/legacy";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../src/lib/firebase";
import { notifyRSVPConfirmation } from "../src/lib/notifications";
import { listApprovedEvents } from "../src/services/eventsService";
import {
  getEventLikeCount,
  getEventsInteractions,
  toggleFavorite as toggleFavoriteService,
  toggleLike as toggleLikeService
} from "../src/services/interactionsService";

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
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Track logged-in user
  const [currentUser, setCurrentUser] = useState<any>(null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  // Fetch event details
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        // Try to get event from local storage first (since eventsService uses local storage)
        const approvedEvents = await listApprovedEvents();
        const foundEvent = approvedEvents.find(e => e.id === id);
        
        if (foundEvent) {
          const date = new Date(foundEvent.dateISO);
          const eventData: Event = {
            id: foundEvent.id,
            title: foundEvent.title,
            description: foundEvent.description,
            date: date.toISOString().split('T')[0],
            time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
            location: foundEvent.location,
            category: "Club Event",
            attendees: 0,
            maxAttendees: undefined,
            imageUrl: foundEvent.imageUrl,
            isUserAttending: false,
            organizer: undefined,
            fullDescription: foundEvent.description,
          };
          setEvent(eventData);
        } else {
          // Fallback to Firestore if not found in local storage
          const docRef = doc(db, "events", id as string);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setEvent({ ...(docSnap.data() as Event), id: docSnap.id });
          } else {
            console.log("No such event!");
          }
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  // Load like/favorite status when event or user changes
  useEffect(() => {
    const loadInteractions = async () => {
      if (!event?.id) return;

      try {
        if (currentUser?.uid) {
          const interactions = await getEventsInteractions(currentUser.uid, [event.id]);
          setLiked(interactions.likedEvents.has(event.id));
          setFavorited(interactions.favoritedEvents.has(event.id));
          setLikeCount(interactions.likeCounts[event.id] || 0);
        } else {
          // Still get like count even if not logged in
          const count = await getEventLikeCount(event.id);
          setLikeCount(count);
          setLiked(false);
          setFavorited(false);
        }
      } catch (error) {
        console.error("Error loading interactions:", error);
      }
    };

    loadInteractions();
  }, [event?.id, currentUser?.uid]);

  // Handle like toggle
  const handleToggleLike = async () => {
    if (!currentUser) {
      alert("Please log in to like events.");
      return;
    }

    try {
      const newLikedState = await toggleLikeService(currentUser.uid, event!.id);
      setLiked(newLikedState);
      
      // Reload like count
      const count = await getEventLikeCount(event!.id);
      setLikeCount(count);
    } catch (error) {
      console.error("Error toggling like:", error);
      alert("Failed to update like. Please try again.");
    }
  };

  // Handle favorite toggle
  const handleToggleFavorite = async () => {
    if (!currentUser) {
      alert("Please log in to favorite events.");
      return;
    }

    try {
      const newFavoritedState = await toggleFavoriteService(currentUser.uid, event!.id);
      setFavorited(newFavoritedState);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Failed to update favorite. Please try again.");
    }
  };

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
        message: `You RSVP'd for ${eventTitle}!`,
        timestamp: serverTimestamp(),
        read: false,
      });

      alert(`You have RSVP'd for "${eventTitle}" successfully!`);
      try { await notifyRSVPConfirmation(eventTitle); } catch {}
    } catch (error) {
      console.error("Error RSVPing:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  // Handle Add to Calendar
  const handleAddToCalendar = async (event: Event) => {
    try {
      // Parse event date/time - handle both ISO format and separate date/time
      let eventDateTime: Date;
      
      if (event.date && event.time) {
        // Try parsing as separate date and time strings
        // event.date might be ISO string or YYYY-MM-DD format
        const dateStr = event.date.includes('T') ? event.date.split('T')[0] : event.date;
        eventDateTime = new Date(`${dateStr}T${event.time}`);
      } else if (event.date) {
        // Fallback to just date (assume noon)
        eventDateTime = new Date(event.date);
        eventDateTime.setHours(12, 0, 0, 0);
      } else {
        throw new Error('Event date is missing');
      }

      // Validate date
      if (isNaN(eventDateTime.getTime())) {
        throw new Error('Invalid event date/time');
      }

      // Format dates for ICS (YYYYMMDDTHHMMSSZ)
      const formatICSDate = (date: Date): string => {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
      };

      const startTime = formatICSDate(eventDateTime);
      const endTime = formatICSDate(new Date(eventDateTime.getTime() + 2 * 60 * 60 * 1000)); // Add 2 hours
      
      // Generate unique ID
      const uid = `event-${event.id}-${Date.now()}@campuseventnotifier.app`;
      
      // Escape special characters for ICS format
      const escapeICS = (text: string): string => {
        return text
          .replace(/\\/g, '\\\\')
          .replace(/;/g, '\\;')
          .replace(/,/g, '\\,')
          .replace(/\n/g, '\\n');
      };
      
      // Create ICS content
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Campus Event Notifier//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTART:${startTime}`,
        `DTEND:${endTime}`,
        `DTSTAMP:${formatICSDate(new Date())}`,
        `SUMMARY:${escapeICS(event.title)}`,
        `DESCRIPTION:${escapeICS(event.description || '')}\\n\\nLocation: ${escapeICS(event.location)}`,
        `LOCATION:${escapeICS(event.location)}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      // Handle web vs mobile differently
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        // Web: Use browser download
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        alert('Calendar file downloaded successfully!');
      } else {
        // Mobile: Try file system first, fallback to data URI
        const fileName = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
        
        // Check if file system is available
        const cacheDir = FileSystem.cacheDirectory;
        const docDir = FileSystem.documentDirectory;
        const directory = cacheDir || docDir;
        
        if (directory) {
          // File system is available - use it
          try {
            const fileUri = `${directory}${directory.endsWith('/') ? '' : '/'}${fileName}`;
            console.log('Writing calendar file to:', fileUri);

            // Write file to device
            await FileSystem.writeAsStringAsync(fileUri, icsContent, {
              encoding: EncodingType.UTF8,
            });
            console.log('File written successfully');

            // Verify file exists
            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            if (!fileInfo.exists) {
              throw new Error('File was not created successfully');
            }

            console.log('File info:', fileInfo);

            // Check if sharing is available
            const isAvailable = await Sharing.isAvailableAsync();
            console.log('Sharing available:', isAvailable);
            
            if (isAvailable) {
              try {
                // Share the file (opens share dialog)
                await Sharing.shareAsync(fileUri, {
                  mimeType: 'text/calendar',
                  dialogTitle: Platform.OS === 'ios' 
                    ? 'Add to Calendar' 
                    : 'Add to Calendar',
                  UTI: Platform.OS === 'ios' ? 'com.apple.ical.ics' : undefined,
                });
                console.log('File shared successfully');
                
                // Show helpful instructions after sharing
                setTimeout(() => {
                  if (Platform.OS === 'ios') {
                    Alert.alert(
                      'How to Add to Calendar',
                      'In the share menu:\n\n' +
                      '• Tap "Add to Calendar" to open directly\n' +
                      '• Or tap "Save to Files" then open Files app\n' +
                      '• Or email it to yourself and open on a computer',
                      [{ text: 'OK' }]
                    );
                  } else {
                    Alert.alert(
                      'How to Add to Calendar',
                      'In the share menu:\n\n' +
                      '• Tap "Google Calendar" if available\n' +
                      '• Or tap "Save" to download the file\n' +
                      '• Then open it with your calendar app',
                      [{ text: 'OK' }]
                    );
                  }
                }, 500);
                
                return; // Success, exit early
              } catch (shareError: any) {
                console.error('Error sharing file:', shareError);
                // Fall through to data URI fallback
              }
            }
          } catch (fileError: any) {
            console.error('Error with file system approach:', fileError);
            // Fall through to data URI fallback
          }
        }
        
        // Fallback: Use data URI approach (works without file system)
        try {
          console.log('Using data URI fallback');
          
          // Create a data URI with the ICS content
          // For mobile, we'll try to open it directly or copy to clipboard
          const dataUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
          
          // Try to open with Linking (some apps support data URIs)
          const canOpen = await Linking.canOpenURL(dataUri);
          if (canOpen) {
            await Linking.openURL(dataUri);
            return;
          }
          
          // If that doesn't work, try to copy content and show instructions
          // Note: Clipboard API would require expo-clipboard, so we'll show the content
          alert(
            `Calendar file ready!\n\n` +
            `Since file system access is limited, please:\n` +
            `1. Copy this link and open it in your browser\n` +
            `2. Or use the share button to copy the calendar data\n\n` +
            `Alternatively, try opening this app in a development build instead of Expo Go.`
          );
          
          // Try to share the data URI as text
          if (await Sharing.isAvailableAsync()) {
            // Create a temporary text file with instructions
            const tempContent = `To add this event to your calendar, copy the following link and open it:\n\n${dataUri}\n\nOr use a calendar app that supports importing .ics files.`;
            const tempFileUri = `${FileSystem.cacheDirectory || FileSystem.documentDirectory || ''}calendar_instructions.txt`;
            
            try {
              if (FileSystem.cacheDirectory || FileSystem.documentDirectory) {
                await FileSystem.writeAsStringAsync(tempFileUri, tempContent, {
                  encoding: EncodingType.UTF8,
                });
                await Sharing.shareAsync(tempFileUri, {
                  dialogTitle: 'Calendar Event Instructions',
                });
              }
            } catch (e) {
              // If even that fails, just show the data URI
              console.log('Data URI:', dataUri);
            }
          }
        } catch (fallbackError: any) {
          console.error('Error with data URI fallback:', fallbackError);
          alert(`Unable to create calendar file. This may be a limitation of Expo Go. Try using a development build or web version. Error: ${fallbackError?.message || fallbackError}`);
        }
      }
    } catch (error: any) {
      console.error('Error creating calendar file:', error);
      alert(`Failed to create calendar file: ${error.message || 'Please try again.'}`);
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
          <TouchableOpacity 
            onPress={handleToggleFavorite} 
            style={styles.iconButton}
            disabled={!currentUser}
          >
            <Ionicons 
              name={favorited ? "bookmark" : "bookmark-outline"} 
              size={20} 
              color={favorited ? "#3B82F6" : "#111"} 
            />
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

        {/* Like Section */}
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.likeSection}
            onPress={handleToggleLike}
            disabled={!currentUser}
          >
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={24}
              color={liked ? "#EF4444" : "#6B7280"}
              style={styles.likeIcon}
            />
            <View style={styles.likeInfo}>
              <Text style={styles.likeCount}>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</Text>
              <Text style={styles.likeSubtext}>
                {liked ? "You like this event" : currentUser ? "Tap to like" : "Log in to like"}
              </Text>
            </View>
          </TouchableOpacity>
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

        {/* Add to Calendar */}
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.button, styles.calendarButton]}
            onPress={() => handleAddToCalendar(event)}
          >
            <Ionicons name="calendar-outline" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Add to Calendar</Text>
          </TouchableOpacity>
          <Text style={styles.calendarNote}>
            {Platform.OS === 'web' 
              ? 'Download an .ics file to add this event to your calendar'
              : Platform.OS === 'ios'
              ? 'Tap to open in Calendar app or save to Files'
              : 'Tap to share and add to your calendar app'}
          </Text>
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
  eventImage: { width: "100%", height: "100%" },
  likeSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  likeIcon: {
    marginRight: 12,
  },
  likeInfo: {
    flex: 1,
  },
  likeCount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  likeSubtext: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
});
