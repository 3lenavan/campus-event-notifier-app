import { Stack } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

// Component that decides which screens to show based on auth state
function RootNavigator() {
  const { user, loading } = useAuth();

  // Debug logging
  console.log('RootNavigator - loading:', loading, 'user:', user?.email || 'No user');

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16, fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  // If user is signed in, show the main app (tabs)
  // If user is not signed in, show the auth stack
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {user ? (
        // User is signed in - show the main app with tabs
        <Stack.Screen name="(tabs)" />
      ) : (
        // User is not signed in - show auth screens
        <>
          <Stack.Screen name="signin" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="debug" />
        </>
      )}
    </Stack>
  );
}

// Main app component that provides auth context to all children
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
