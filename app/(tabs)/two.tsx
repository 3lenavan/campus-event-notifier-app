import { db } from "@/FirebaseConfig";
import { getAuth } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, getDocs, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, Button, FlatList, StyleSheet, Text, TextInput, View } from "react-native";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  createdBy: string;
  createdAt: Date;
  maxAttendees?: number;
  currentAttendees: number;
}

export default function TwoScreen() {
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventCategory, setEventCategory] = useState("General");
  const [events, setEvents] = useState<Event[]>([]);
  const auth = getAuth();
  const user = auth.currentUser;
  const eventsCollection = collection(db, "events");

  const categories = ["General", "Academic", "Sports", "Social", "Cultural", "Career", "Other"];


  useEffect(() => {
    fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    if (user) {
      // Fetch all events (not just user's events for campus-wide visibility)
      const q = query(eventsCollection);
      const data = await getDocs(q);
      setEvents(data.docs.map((doc) => ({ 
        ...doc.data(), 
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Event[]);
    }
  };

  const addEvent = async () => {
    if (!user) {
      Alert.alert("Error", "Please log in to create events");
      return;
    }

    if (!eventTitle.trim() || !eventDate.trim() || !eventTime.trim()) {
      Alert.alert("Error", "Please fill in all required fields (Title, Date, Time)");
      return;
    }

    try {
      await addDoc(eventsCollection, { 
        title: eventTitle.trim(),
        description: eventDescription.trim(),
        date: eventDate,
        time: eventTime,
        location: eventLocation.trim(),
        category: eventCategory,
        createdBy: user.uid,
        createdAt: new Date(),
        currentAttendees: 0
      });
      
      // Clear form
      setEventTitle("");
      setEventDescription("");
      setEventDate("");
      setEventTime("");
      setEventLocation("");
      setEventCategory("General");
      
      fetchEvents();
      Alert.alert("Success", "Event created successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to create event");
      console.error("Error creating event:", error);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!user) {
      Alert.alert("Error", "Please log in to delete events");
      return;
    }

    Alert.alert(
      "Delete Event",
      "Are you sure you want to delete this event?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(eventsCollection, id));
              fetchEvents();
              Alert.alert("Success", "Event deleted successfully!");
            } catch (error) {
              Alert.alert("Error", "Failed to delete event");
              console.error("Error deleting event:", error);
            }
          }
        }
      ]
    );
  };



  return (
    <View style={styles.container}>
      <Text style={styles.title}>Campus Events</Text>
      <Text style={styles.subtitle}>Create and manage campus events</Text>
      
      {/* Event Creation Form */}
      <View style={styles.formContainer}>
        <TextInput 
          style={styles.input} 
          placeholder="Event Title *" 
          value={eventTitle} 
          onChangeText={setEventTitle} 
        />
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="Event Description" 
          value={eventDescription} 
          onChangeText={setEventDescription}
          multiline
          numberOfLines={3}
        />
        <View style={styles.row}>
          <TextInput 
            style={[styles.input, styles.halfWidth]} 
            placeholder="Date (MM/DD/YYYY) *" 
            value={eventDate} 
            onChangeText={setEventDate} 
          />
          <TextInput 
            style={[styles.input, styles.halfWidth]} 
            placeholder="Time (HH:MM) *" 
            value={eventTime} 
            onChangeText={setEventTime} 
          />
        </View>
        <TextInput 
          style={styles.input} 
          placeholder="Location" 
          value={eventLocation} 
          onChangeText={setEventLocation} 
        />
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryLabel}>Category:</Text>
          <View style={styles.categoryButtons}>
            {categories.map((category) => (
              <Button
                key={category}
                title={category}
                onPress={() => setEventCategory(category)}
                color={eventCategory === category ? "#007AFF" : "#CCCCCC"}
              />
            ))}
          </View>
        </View>
        <Button title="Create Event" onPress={addEvent} color="#007AFF" />
      </View>

      {/* Events List */}
      <FlatList 
        data={events} 
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            </View>
            {item.description && (
              <Text style={styles.eventDescription}>{item.description}</Text>
            )}
            <View style={styles.eventDetails}>
              <Text style={styles.eventDetail}>📅 {item.date} at {item.time}</Text>
              {item.location && <Text style={styles.eventDetail}>📍 {item.location}</Text>}
              <Text style={styles.eventDetail}>👥 {item.currentAttendees} attendees</Text>
            </View>
            <View style={styles.eventActions}>
              <Button title="Delete" onPress={() => deleteEvent(item.id)} color="#FF3B30" />
            </View>
          </View>
        )} 
      />
    </View>
  );

  function getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      "General": "#8E8E93",
      "Academic": "#007AFF", 
      "Sports": "#34C759",
      "Social": "#FF9500",
      "Cultural": "#AF52DE",
      "Career": "#FF2D92",
      "Other": "#FFCC00"
    };
    return colors[category] || "#8E8E93";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F5F5F5",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    color: "#1C1C1E",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    height: 44,
    borderColor: "#D1D1D6",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1C1C1E",
  },
  categoryButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  eventDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },
  eventDetails: {
    marginBottom: 12,
  },
  eventDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  eventActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});


