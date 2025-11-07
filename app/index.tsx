import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import { useState } from "react";
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from "react-native";
import type { AuthError } from "@supabase/supabase-js";
import { mapSupabaseAuthError } from "../src/lib/auth";
import { supabase } from "../src/lib/supabaseClient";

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
        alert("Please enter a valid email address");
        return;
      }
      if (passwordTrimmed.length < 6) {
        alert("Password must be at least 6 characters long");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password: passwordTrimmed,
      });

      if (error) {
        throw error;
      }

        alert("Signed in successfully!");
        router.replace("/(tabs)/home");
    } catch (error) {
      console.error(error);
      const message = mapSupabaseAuthError(error as AuthError, "signin");
      alert(message);
    }
  };

  const signUp = async () => {
    try {
      const emailTrimmed = email.trim();
      const passwordTrimmed = password.trim();
      if (!isValidEmail(emailTrimmed)) {
        alert("Please enter a valid email address");
        return;
      }
      if (passwordTrimmed.length < 6) {
        alert("Password must be at least 6 characters long");
        return;
      }
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const { data, error } = await supabase.auth.signUp({
        email: emailTrimmed,
        password: passwordTrimmed,
        options: {
          data: {
            full_name: fullName,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data?.session) {
        alert("Account created successfully!");
        router.replace("/(tabs)/home");
      } else {
        alert("Account created! Check your email to verify your address.");
      }
    } catch (error) {
      console.error(error);
      const message = mapSupabaseAuthError(error as AuthError, "signup");
      alert(message);
    }
  };
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: '#F0F7FF' }]}> 
      <View style={styles.container}>
        <View style={[styles.heroBubble]} />
        <View style={[styles.heroBubbleSmall]} />
        <View style={[styles.heroBubbleMid]} />
        <View style={[styles.card, styles.glassCard]}> 
          <Text style={[styles.appName, { color: theme.colors.primary }]}>🐝 BuzzUp</Text>
          <Text style={[styles.tagline, { color: "#F59E0B" }]}>Penmen Notifier!</Text>
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

          <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: '#FACC15', borderColor: 'transparent' }]} onPress={() => router.replace("/signup")}>
            <Text style={[styles.secondaryBtnText, { color: '#111827' }]}>Create Account</Text>
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
  heroBubble: {
    position: "absolute",
    top: 40,
    right: -30,
    width: 180,
    height: 180,
    backgroundColor: "#DBEAFE",
    borderRadius: 120,
  },
  heroBubbleSmall: {
    position: "absolute",
    bottom: 60,
    left: -20,
    width: 120,
    height: 120,
    backgroundColor: "#FEF9C3",
    borderRadius: 100,
  },
  // Extra bubble for vibrance
  heroBubbleMid: {
    position: "absolute",
    top: 140,
    left: -40,
    width: 160,
    height: 160,
    backgroundColor: "#BFDBFE",
    borderRadius: 120,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1.5,
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  appName: { fontSize: 32, fontWeight: "800" },
  tagline: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "400",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 999,
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
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    shadowColor: "#1D4ED8",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryBtn: {
    width: "100%",
    borderRadius: 999,
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
