import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from "react-native";
import { auth } from "../FirebaseConfig";

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const theme = useTheme();
  const colorScheme = useColorScheme();
  
  const isValidEmail = (value: string) => /.+@.+\..+/.test(value);

  const signIn = async () => {
    try {
      const emailTrimmed = email.trim();
      const passwordTrimmed = password.trim();
      if (!isValidEmail(emailTrimmed)) {
        console.log("Invalid email format");
        return;
      }
      if (passwordTrimmed.length < 6) {
        console.log("Password must be at least 6 characters");
        return;
      }
      const user = await signInWithEmailAndPassword(auth, emailTrimmed, passwordTrimmed);
      if (user) {
        router.replace("/(tabs)/home");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const signUp = async () => {
    try {
      const emailTrimmed = email.trim();
      const passwordTrimmed = password.trim();
      if (!isValidEmail(emailTrimmed)) {
        console.log("Invalid email format");
        return;
      }
      if (passwordTrimmed.length < 6) {
        console.log("Password must be at least 6 characters");
        return;
      }
      const user = await createUserWithEmailAndPassword(auth, emailTrimmed, passwordTrimmed);
      if (user) {
        router.replace("/(tabs)/home");
      }
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.container}>
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}> 
          <Text style={[styles.title, { color: theme.colors.text }]}>Welcome</Text>
          <Text style={[styles.subtitle, { color: colorScheme === "dark" ? "#9aa0a6" : "#6b7280" }]}>Sign in or create an account</Text>

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

          <View style={styles.spacer} />

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]} onPress={signIn}>
            <Text style={styles.primaryBtnText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryBtn, { borderColor: theme.colors.border }]} onPress={() => router.replace("/signup")}>
            <Text style={[styles.secondaryBtnText, { color: theme.colors.text }]}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
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
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "400",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
    fontSize: 16,
  },
  spacer: {
    height: 8,
  },
  primaryBtn: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryBtn: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontWeight: "600",
    fontSize: 16,
  },
});
