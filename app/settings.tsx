import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        activeOpacity={0.8}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={22} color="#111827" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* Header */}
      <Text style={styles.header}>Settings</Text>

      {/* Dark Mode Toggle */}
      <View style={[styles.card, styles.cardSpacing]}>
        <View style={styles.row}>
          <Text style={styles.title}>Dark Mode</Text>
          <Switch value={darkMode} onValueChange={toggleDarkMode} />
        </View>
      </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingTop: 50,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 16,
    marginLeft: 16, // gives space from the edge
  },
  backText: {
    fontSize: 16,
    marginLeft: 6,
    color: "#111827",
    fontWeight: "500",
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
