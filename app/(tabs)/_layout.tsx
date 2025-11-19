import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useAuthUser } from "../../src/hooks/useAuthUser";

export default function Layout() {
  const { profile } = useAuthUser();
  const hasMemberships = profile?.memberships && profile.memberships.length > 0;

  return (
    <Tabs>
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create-event"
        options={{
          title: "Create Event",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
          href: hasMemberships ? "/create-event" : null, // Hide tab if no memberships
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index" // this is your redirect file
        options={{
          href: null, //  hides it from the tab bar
        }}
      />
    </Tabs>
  );
}
