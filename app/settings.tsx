import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Stack } from "expo-router";
import {
    SafeAreaView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuthUser } from "../src/hooks/useAuthUser";

export default function Settings() {
  const { profile } = useAuthUser();

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* Header */}
      <Text style={styles.header}>Settings</Text>

      {/* Update Email */}
      <TouchableOpacity
        style={[styles.card, styles.cardSpacing]}
        onPress={() => router.push("/update-email")}
      >
        <Text style={styles.title}>Update Email</Text>
        <Text style={styles.subtitle}>Change your account email</Text>
      </TouchableOpacity>

      {/* Update Password */}
      <TouchableOpacity
        style={[styles.card, styles.cardSpacing]}
        onPress={() => router.push("/update-password")}
      >
        <Text style={styles.title}>Update Password</Text>
        <Text style={styles.subtitle}>Change your account password</Text>
      </TouchableOpacity>

      {profile?.isAdmin && (
        <TouchableOpacity
          style={[styles.card, styles.cardSpacing]}
          onPress={() => router.push("/admin-settings")}
        >
          <Text style={styles.title}>Admin Settings</Text>
          <Text style={styles.subtitle}>Approve/Reject events and rotate club codes</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingTop: 15,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    marginLeft: 20, // header aligned with cards
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardSpacing: {
    marginHorizontal: 16, // adds margin on both left and right
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 16, fontWeight: "600" },
  subtitle: { fontSize: 13, color: "#6b7280", marginTop: 4 },
});
