import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  surface: "#FDFBF7",
  onSurface: "#1C1917",
  surfaceSecondary: "#F5F2EB",
  onSurfaceSecondary: "#292524",
  surfaceTertiary: "#EAE5D9",
  onSurfaceTertiary: "#44403C",
  surfaceInverse: "#1C1917",
  onSurfaceInverse: "#FAFAF9",
  brand: "#C2410C",
  onBrand: "#FAFAF9",
  brandPrimary: "#C2410C",
  onBrandPrimary: "#FAFAF9",
  brandSecondary: "#EA580C",
  onBrandSecondary: "#FAFAF9",
  brandTertiary: "#FFEDD5",
  onBrandTertiary: "#9A3412",
  success: "#15803D",
  onSuccess: "#F0FDF4",
  warning: "#B45309",
  onWarning: "#FEF3C7",
  error: "#B91C1C",
  onError: "#FEF2F2",
  info: "#0369A1",
  onInfo: "#E0F2FE",
  border: "#E7E5E4",
  borderStrong: "#D6D3D1",
  divider: "#E7E5E4",
  muted: "#78716C",
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