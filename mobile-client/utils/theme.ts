import { Appearance } from "react-native";
import * as SecureStore from "expo-secure-store";

const THEME_KEY = "app_theme";
export type AppTheme = "light" | "dark";

export function setTheme(theme: AppTheme) {
  Appearance.setColorScheme(theme);
}

export function getCurrentTheme(): AppTheme {
  const colorScheme = Appearance.getColorScheme();
  return colorScheme === "dark" ? "dark" : "light";
}

export async function saveThemePreference(theme: AppTheme) {
  await SecureStore.setItemAsync(THEME_KEY, theme);
}

export async function getSavedThemePreference(): Promise<AppTheme | null> {
  const savedTheme = await SecureStore.getItemAsync(THEME_KEY);
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }
  return null;
}