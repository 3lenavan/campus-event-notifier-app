import { auth } from "@/src/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
} from "firebase/auth";
import { useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function UpdateEmail() {
  const user = auth.currentUser;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");

  const handleUpdateEmail = async () => {
    if (!user) return;

    if (!currentPassword || !newEmail || !confirmEmail) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (newEmail !== confirmEmail) {
      Alert.alert("Error", "Emails do not match.");
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(
        user.email!,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      await updateEmail(user, newEmail.trim());

      Alert.alert("Success", "Email updated!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update email.");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Update Email",
          headerTintColor: "#fff",
          headerBackTitle: "Back",
          headerStyle: { backgroundColor: "#000" },
        }}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* HEADER WITH SPACING */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Update Email</Text>
          <Text style={styles.subtitle}>Change your email address</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-outline" size={24} color="#2563eb" />
          </View>

          <Text style={styles.label}>Current Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: "#f3f4f6" }]}
            value={user?.email || ""}
            editable={false}
          />

          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your current password"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />

          <Text style={styles.label}>New Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter new email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={newEmail}
            onChangeText={setNewEmail}
          />

          <Text style={styles.label}>Confirm New Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm new email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={confirmEmail}
            onChangeText={setConfirmEmail}
          />

          <TouchableOpacity style={styles.button} onPress={handleUpdateEmail}>
            <Text style={styles.buttonText}>Update Email Address</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.note}>
          <Text style={{ fontWeight: "700" }}>Note:</Text> You may need to
          verify your current email before updating.
        </Text>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },

  /* 🔥 NEW header padding wrapper */
  headerContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },

  card: {
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    marginBottom: 20,
  },

  iconCircle: {
    alignSelf: "center",
    backgroundColor: "#e0ebff",
    padding: 14,
    borderRadius: 50,
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginTop: 10,
  },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },

  button: {
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 18,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  note: {
    paddingHorizontal: 20,
    marginTop: 8,
    color: "#6b7280",
    fontSize: 13,
  },
});
