import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";

export default function TabsLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colorScheme === "dark" ? DarkTheme.colors.primary : DefaultTheme.colors.primary,
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: "Two",
        }}
      />
    </Tabs>
  );
}


