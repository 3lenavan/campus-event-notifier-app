import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { auth } from "@/FirebaseConfig";
import {
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";

export default function UpdateEmail() {
  const user = auth.currentUser;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");

  const handleUpdateEmail = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to update your email.");
      return;
    }

    if (!currentPassword || !newEmail || !confirmEmail) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (newEmail !== confirmEmail) {
      Alert.alert("Error", "Emails do not match.");
      return;
    }

    try {
      // 🔐 Step 1: Re-authenticate the user
      const credential = EmailAuthProvider.credential(
        user.email!,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // ✉️ Step 2: Update the email
      await updateEmail(user, newEmail.trim());

      Alert.alert(
        "Email Updated",
        "Your email has been successfully updated!",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/wrong-password") {
        Alert.alert(
          "Incorrect Password",
          "The password you entered is incorrect. Please try again."
        );
      } else if (error.code === "auth/invalid-email") {
        Alert.alert("Invalid Email", "Please enter a valid email address.");
      } else if (error.code === "auth/requires-recent-login") {
        Alert.alert(
          "Session Expired",
          "Please log out and log in again before updating your email."
        );
      } else {
        Alert.alert("Error", error.message || "Failed to update email.");
      }
    }
  };

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

      {/* Title */}
      <Text style={styles.title}>Update Email</Text>
      <Text style={styles.subtitle}>Change your email address</Text>

      {/* Card */}
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail-outline" size={28} color="#2563eb" />
        </View>

        {/* Current Email */}
        <Text style={styles.label}>Current Email</Text>
        <TextInput
          style={[styles.input, { backgroundColor: "#f3f4f6" }]}
          value={user?.email || ""}
          editable={false}
        />

        {/* Password Field */}
        <Text style={styles.label}>Current Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your current password"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />

        {/* New Email */}
        <Text style={styles.label}>New Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter new email"
          value={newEmail}
          onChangeText={setNewEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Confirm Email */}
        <Text style={styles.label}>Confirm New Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm new email"
          value={confirmEmail}
          onChangeText={setConfirmEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Update Button */}
        <TouchableOpacity style={styles.button} onPress={handleUpdateEmail}>
          <Text style={styles.buttonText}>Update Email Address</Text>
        </TouchableOpacity>
      </View>

      {/* Note Section */}
      <Text style={styles.note}>
        <Text style={{ fontWeight: "700" }}>Note:</Text> You may need to verify
        your current email before updating your address.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 50, // adds space below the notch
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
  },
  backText: {
    fontSize: 16,
    marginLeft: 6,
    color: "#111827",
    fontWeight: "500",
  },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6b7280", marginBottom: 20 },
  card: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  iconCircle: {
    alignSelf: "center",
    backgroundColor: "#e0ebff",
    borderRadius: 50,
    padding: 16,
    marginBottom: 16,
  },
  label: { fontSize: 14, fontWeight: "600", marginTop: 10, color: "#111827" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  note: {
    marginTop: 20,
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 20,
  },
});
