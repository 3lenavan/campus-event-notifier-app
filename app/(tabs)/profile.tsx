import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { auth } from "@/FirebaseConfig";

const Profile = () => {
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const user = getAuth().currentUser;
    if (user) {
      setName(user.displayName ?? "Unknown User");
      setEmail(user.email);
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Header (now pinned to top) */}
      <View style={styles.headerSection}>
        <Text style={styles.header}>Profile</Text>
        <Text style={styles.subheader}>Manage your account and preferences</Text>
      </View>

      {/* Profile info card */}
      <View style={styles.profileBox}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name ? name.charAt(0) : "?"}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>
      </View>

      {/* Log Out button stays at bottom */}
      <TouchableOpacity onPress={() => auth.signOut()} style={styles.button}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "flex-start", // 👈 keeps content at the top
  },
  headerSection: {
    marginBottom: 20, // space between header and profile card
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
  },
  subheader: {
    fontSize: 14,
    color: "#666",
  },
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
  avatarText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#374151",
  },
  info: {
    flexDirection: "column",
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
  },
  email: {
    fontSize: 14,
    color: "#6b7280",
  },
  button: {
    marginTop: "auto", // 👈 pushes it to the bottom
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Profile;