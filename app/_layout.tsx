import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { seedClubsOnce } from "../src/bootstrap/seedClubs";
import { useAuthUser } from "../src/hooks/useAuthUser";
import { initializeNotifications } from "../src/lib/notifications";

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    // BuzzUp (SNHU) kawaii palette: blue + yellow accents
    primary: "#1D4ED8", // SNHU blue
    background: "#F0F7FF", // soft sky blue
    card: "#FFFFFF",
    text: "#0B0C0E",
    border: "#D6E4FF", // light blue border
  },
};

const DarkThemeCustom = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#60a5fa",
    background: "#0b0c0e",
    card: "#111214",
    text: "#e5e7eb",
    border: "#1f2937",
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? DarkThemeCustom : LightTheme;
  const { user } = useAuthUser();

  // Initialize app data on startup
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Seed clubs data from JSON file
        await seedClubsOnce();
        console.log('App initialization complete');
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);

  // Initialize notifications when user is available
  useEffect(() => {
    if (user?.uid) {
      initializeNotifications(user.uid);
    }
  }, [user?.uid]);

  return (
    <ThemeProvider value={theme}>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={isDark ? "#0b0c0e" : "#f7f8fa"} />
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          animation: "fade",
          contentStyle: { backgroundColor: theme.colors.background },
          headerStyle: { backgroundColor: theme.colors.card },
          headerTitleStyle: { fontWeight: "600" },
          headerTintColor: theme.colors.text,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="verify-club" 
          options={{ 
            title: "Verify Club Membership",
            headerShown: true,
            presentation: "modal"
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            title: "Settings",
            headerShown: true,
            presentation: "modal"
          }} 
        />
        <Stack.Screen 
          name="signup" 
          options={{ 
            headerShown: false,
            presentation: "modal"
          }} 
        />
        <Stack.Screen 
          name="update-email" 
          options={{ 
            title: "Update Email",
            headerShown: true,
            presentation: "modal"
          }} 
        />
        <Stack.Screen 
          name="update-password" 
          options={{ 
            title: "Update Password",
            headerShown: true,
            presentation: "modal"
          }} 
        />
      </Stack>
    </ThemeProvider>
  );
}
