import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  surface: "#0A0A0A",
  onSurface: "#FAFAFA",
  surfaceSecondary: "#141010",
  onSurfaceSecondary: "#FAFAFA",
  surfaceTertiary: "#1F1414",
  onSurfaceTertiary: "#FCA5A5",
  surfaceInverse: "#FAFAFA",
  onSurfaceInverse: "#0A0A0A",
  brand: "#DC2626",
  onBrand: "#FFFFFF",
  brandPrimary: "#DC2626",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#FF4136",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#3A0A0A",
  onBrandTertiary: "#FCA5A5",
  success: "#22C55E",
  onSuccess: "#062E14",
  warning: "#F59E0B",
  onWarning: "#422006",
  error: "#EF4444",
  onError: "#450A0A",
  info: "#38BDF8",
  onInfo: "#082F49",
  border: "#241818",
  borderStrong: "#3A1010",
  divider: "#241818",
  muted: "#A1A1AA",
};

export type ThemeColors = typeof light;
export const defaultScheme = "light" satisfies ColorScheme;
export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "light");
}

setColorScheme(defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system === "dark" && themes.dark ? "dark" : "light";
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
