import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeMode = "light" | "dark";

export const LightThemeColors = {
  primary: "#1D4ED8", // SNHU blue
  background: "#F0F7FF", // soft sky blue
  card: "#FFFFFF",
  text: "#0B0C0E",
  border: "#D6E4FF", // light blue border
  safeArea: "#f9fafb",
  subtitle: "#6b7280",
  inputBackground: "#fff",
  placeholderText: "#9aa0b6",
};

export const DarkThemeColors = {
  primary: "#60a5fa",
  background: "#0b0c0e",
  card: "#111214",
  text: "#e5e7eb",
  border: "#1f2937",
  safeArea: "#0b0c0e",
  subtitle: "#9aa0a6",
  inputBackground: "#0f1113",
  placeholderText: "#6b7280",
};

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  colors: typeof LightThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  colors: LightThemeColors,
  isDark: false,
});

export function ThemeProviderCustom({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    AsyncStorage.getItem("app-theme").then((stored) => {
      if (stored === "dark" || stored === "light") setTheme(stored);
    });
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const newMode = prev === "light" ? "dark" : "light";
      AsyncStorage.setItem("app-theme", newMode);
      return newMode;
    });
  };

  const colors = theme === "dark" ? DarkThemeColors : LightThemeColors;
  const isDark = theme === "dark";

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  // Ensure we always return valid values, even if context is somehow undefined
  if (!context || !context.colors) {
    return {
      theme: "light" as ThemeMode,
      toggleTheme: () => {},
      colors: LightThemeColors,
      isDark: false,
    };
  }
  return context;
}
