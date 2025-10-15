import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface Notification {
  id: string;
  message: string;
  timestamp?: any;
  read: boolean;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Real-time notifications listener for the logged-in user
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    // Listen for real-time updates
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notificationsData = snapshot.docs.map((doc) => ({
  ...(doc.data() as Notification), // spread first
  id: doc.id, // then add id last so it's not overwritten
}));

        setNotifications(notificationsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back-outline" size={22} color="#111" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {/* Notification List */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {notifications.length === 0 ? (
          <Text style={styles.emptyText}>No notifications yet</Text>
        ) : (
          notifications.map((notif) => (
            <View key={notif.id} style={styles.card}>
              <Text style={styles.message}>{notif.message}</Text>
              {notif.timestamp && notif.timestamp.toDate && (
                <Text style={styles.time}>
                  {new Date(notif.timestamp.toDate()).toLocaleString()}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "white",
  },
  backButton: { flexDirection: "row", alignItems: "center", marginRight: 8 },
  backText: { marginLeft: 6, color: "#111", fontWeight: "500" },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  scrollContent: { padding: 16 },
  card: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  message: { fontSize: 15, color: "#111827", marginBottom: 4 },
  time: { fontSize: 12, color: "#6B7280" },
  emptyText: { textAlign: "center", color: "#9CA3AF", marginTop: 40 },
});
