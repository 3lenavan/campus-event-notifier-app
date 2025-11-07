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
import type { AuthError } from "@supabase/supabase-js";
import { mapSupabaseAuthError } from "../src/lib/auth";
import { supabase } from "../src/lib/supabaseClient";
import { useAuthUser } from "../src/hooks/useAuthUser";

export default function UpdatePassword() {
  const { user } = useAuthUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Handle password update
  const handleUpdatePassword = async () => {
      if (!user || !user.email) {
      Alert.alert("Error", "You must be logged in to update your password.");
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long.");
      return;
    }

    try {
      // 🔐 Reauthenticate user first
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

        if (verifyError) {
          const message = mapSupabaseAuthError(verifyError as AuthError, "signin");
          Alert.alert("Error", message);
          return;
        }

        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) {
          throw updateError;
        }

        Alert.alert(
          "Password Updated",
          "Your password has been successfully updated!",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } catch (error) {
        console.error(error);
        const message = mapSupabaseAuthError(error as AuthError, "update-password");
        Alert.alert("Error", message);
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
      <Text style={styles.title}>Update Password</Text>
      <Text style={styles.subtitle}>Change your account password</Text>

      {/* Card */}
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed-outline" size={28} color="#a855f7" />
        </View>

        {/* Current Password */}
        <Text style={styles.label}>Current Password</Text>
        <View style={styles.passwordField}>
          <TextInput
            style={styles.input}
            placeholder="Enter current password"
            secureTextEntry={!showPassword}
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#6b7280"
            />
          </TouchableOpacity>
        </View>

        {/* New Password */}
        <Text style={styles.label}>New Password</Text>
        <View style={styles.passwordField}>
          <TextInput
            style={styles.input}
            placeholder="Enter new password"
            secureTextEntry={!showPassword}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#6b7280"
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <Text style={styles.label}>Confirm New Password</Text>
        <View style={styles.passwordField}>
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#6b7280"
            />
          </TouchableOpacity>
        </View>

        {/* Button */}
        <TouchableOpacity style={styles.button} onPress={handleUpdatePassword}>
          <Text style={styles.buttonText}>Update Password</Text>
        </TouchableOpacity>
      </View>

      {/* Password Requirements */}
      <View style={styles.noteCard}>
        <Text style={styles.noteHeader}>Password requirements:</Text>
        <Text style={styles.noteItem}>• At least 6 characters long</Text>
        <Text style={styles.noteItem}>• Different from your current password</Text>
      </View>
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
    backgroundColor: "#f3e8ff",
    borderRadius: 50,
    padding: 16,
    marginBottom: 16,
  },
  label: { fontSize: 14, fontWeight: "600", marginTop: 10, color: "#111827" },
  passwordField: { flexDirection: "row", alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    backgroundColor: "#fff",
  },
  eyeIcon: { position: "absolute", right: 12 },
  button: {
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  noteCard: {
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    padding: 12,
    marginTop: 20,
  },
  noteHeader: { fontWeight: "700", marginBottom: 6, color: "#111827" },
  noteItem: { fontSize: 13, color: "#4b5563" },
});
