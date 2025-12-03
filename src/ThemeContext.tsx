import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
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

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
