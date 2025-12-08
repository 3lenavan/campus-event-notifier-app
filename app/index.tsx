import { router } from "expo-router";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth } from "../src/lib/firebase";
import { useAppTheme, LightThemeColors } from "../src/ThemeContext";

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const themeContext = useAppTheme();
  const colors = themeContext?.colors || LightThemeColors;
  const isDark = themeContext?.isDark || false;
  
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
      const user = await signInWithEmailAndPassword(auth, emailTrimmed, passwordTrimmed);
      if (user) {
        alert("Signed in successfully!");
        router.replace("/(tabs)/home");
      }
    } catch (error: any) {
      console.error(error);
      
      // Handle specific Firebase auth errors
      let errorMessage = 'Sign in failed';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email. Please sign up first.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password. Please try again.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your internet connection.';
            break;
          default:
            errorMessage = error.message || 'Sign in failed';
        }
      }
      
      alert(errorMessage);
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
      const user = await createUserWithEmailAndPassword(auth, emailTrimmed, passwordTrimmed);
      if (user) {
        alert("Account created successfully!");
        router.replace("/(tabs)/home");
      }
    } catch (error: any) {
      console.error(error);
      
      // Handle specific Firebase auth errors
      let errorMessage = 'Account creation failed';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered. Please sign in instead.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters long.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your internet connection.';
            break;
          default:
            errorMessage = error.message || 'Account creation failed';
        }
      }
      
      alert(errorMessage);
    }
  };
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}> 
      <View style={styles.container}>
        {!isDark && (
          <>
            <View style={[styles.heroBubble]} />
            <View style={[styles.heroBubbleSmall]} />
            <View style={[styles.heroBubbleMid]} />
          </>
        )}
        <View style={[styles.card, styles.glassCard, { backgroundColor: isDark ? colors.card : 'rgba(255, 255, 255, 0.85)', borderColor: isDark ? colors.border : 'rgba(255, 255, 255, 0.6)' }]}> 
          <Text style={[styles.appName, { color: colors.primary }]}>🐝 BuzzUp</Text>
          <Text style={[styles.tagline, { color: "#F59E0B" }]}>Penmen Notifier!</Text>
          <Text style={[styles.subtitle, { color: colors.subtitle }]}>Sign in or create an account</Text>

          <View style={styles.spacer} />

          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
            placeholder="Email"
            placeholderTextColor={colors.placeholderText}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
            placeholder="Password"
            placeholderTextColor={colors.placeholderText}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <View style={styles.spacer} />

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={signIn}>
            <Text style={styles.primaryBtnText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: isDark ? colors.border : '#FACC15', borderColor: 'transparent' }]} onPress={() => router.replace("/signup")}>
            <Text style={[styles.secondaryBtnText, { color: isDark ? colors.text : '#111827' }]}>Create Account</Text>
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
