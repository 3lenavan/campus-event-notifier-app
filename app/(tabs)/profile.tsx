import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import React, { useEffect, useState } from "react";
import { auth } from "@/FirebaseConfig";
import { router } from "expo-router"; // ✅ added import

const Profile = () => {
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setName(user.displayName ?? "Unknown User");
      setEmail(user.email);
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.header}>Profile</Text>
        <Text style={styles.subheader}>Manage your account and preferences</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileBox}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name ? name.charAt(0) : "?"}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>
      </View>

      {/* Settings Section */}
      <View style={styles.settingsBox}>
        {/* Notifications toggle */}
        <View style={styles.row}>
          <Text style={styles.rowTitle}>Push Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
        </View>

        {/* My Events */}
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowTitle}>My Events</Text>
          <Text style={styles.rowSubtitle}>View events you’re attending</Text>
        </TouchableOpacity>

        {/* Favorites */}
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowTitle}>Favorites</Text>
          <Text style={styles.rowSubtitle}>Your saved events</Text>
        </TouchableOpacity>

        {/* Settings */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/settings")}
        >
          <Text style={styles.rowTitle}>Settings</Text>
          <Text style={styles.rowSubtitle}>App preferences</Text>
        </TouchableOpacity>
      </View>

      {/* Log Out button */}
      <TouchableOpacity onPress={() => auth.signOut()} style={styles.button}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  headerSection: { marginBottom: 20 },
  header: { fontSize: 22, fontWeight: "700" },
  subheader: { fontSize: 14, color: "#666" },
  profileBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: { fontSize: 22, fontWeight: "600", color: "#374151" },
  info: { flexDirection: "column" },
  name: { fontSize: 18, fontWeight: "600" },
  email: { fontSize: 14, color: "#6b7280" },
  settingsBox: {
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 20,
  },
  row: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  rowTitle: { fontSize: 16, fontWeight: "500" },
  rowSubtitle: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  button: {
    marginTop: "auto",
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

export default Profile;
