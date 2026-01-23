import { Appearance } from "react-native";

export function setTheme(theme: "light" | "dark") {
  Appearance.setColorScheme(theme);
}

export function getCurrentTheme(): "light" | "dark" {
  const colorScheme = Appearance.getColorScheme();
  return colorScheme === "dark" ? "dark" : "light";
}