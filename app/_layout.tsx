import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { seedClubsOnce } from "../src/bootstrap/seedClubs";

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#2563eb",
    background: "#f7f8fa",
    card: "#ffffff",
    text: "#0b0c0e",
    border: "#e6e8eb",
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
          name="login" 
          options={{ 
            title: "Sign In",
            headerShown: true,
            presentation: "modal"
          }} 
        />
        <Stack.Screen 
          name="verify-club" 
          options={{ 
            title: "Verify Club Membership",
            headerShown: true,
            presentation: "modal"
          }} 
        />
        <Stack.Screen 
          name="create-event" 
          options={{ 
            title: "Create Event",
            headerShown: true,
            presentation: "modal"
          }} 
        />
      </Stack>
    </ThemeProvider>
  );
}
