import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from "react-native";
import { auth } from "../FirebaseConfig";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const theme = useTheme();
  const colorScheme = useColorScheme();

  const isValidEmail = (value: string) => /.+@.+\..+/.test(value);

  const signUp = async () => {
    try {
      const emailTrimmed = email.trim();
      const passwordTrimmed = password.trim();
      if (!isValidEmail(emailTrimmed)) return;
      if (passwordTrimmed.length < 6) return;
      if (passwordTrimmed !== confirm.trim()) return;
      await createUserWithEmailAndPassword(auth, emailTrimmed, passwordTrimmed);
      router.replace("/");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.container}>
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}> 
          <Text style={[styles.title, { color: theme.colors.text }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: colorScheme === "dark" ? "#9aa0a6" : "#6b7280" }]}>Enter your details to sign up</Text>

          <View style={styles.spacer} />

          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: colorScheme === "dark" ? "#0f1113" : "#fff" }]}
            placeholder="Email"
            placeholderTextColor={colorScheme === "dark" ? "#6b7280" : "#9aa0a6"}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: colorScheme === "dark" ? "#0f1113" : "#fff" }]}
            placeholder="Password"
            placeholderTextColor={colorScheme === "dark" ? "#6b7280" : "#9aa0a6"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: colorScheme === "dark" ? "#0f1113" : "#fff" }]}
            placeholder="Confirm password"
            placeholderTextColor={colorScheme === "dark" ? "#6b7280" : "#9aa0a6"}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoCapitalize="none"
          />

          <View style={styles.spacer} />

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]} onPress={signUp}>
            <Text style={styles.primaryBtnText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryBtn, { borderColor: theme.colors.border }]} onPress={() => router.replace("/")}> 
            <Text style={[styles.secondaryBtnText, { color: theme.colors.text }]}>Back to sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { marginTop: 6, fontSize: 14, fontWeight: "400" },
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
    fontSize: 16,
  },
  spacer: { height: 8 },
  primaryBtn: { width: "100%", borderRadius: 12, paddingVertical: 12, alignItems: "center", justifyContent: "center", marginTop: 16 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondaryBtn: { width: "100%", borderRadius: 12, paddingVertical: 12, alignItems: "center", justifyContent: "center", marginTop: 10, borderWidth: 1 },
  secondaryBtnText: { fontWeight: "600", fontSize: 16 },
});


