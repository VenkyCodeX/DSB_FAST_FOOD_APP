import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/src/api/client";
import { makeStyles, useTheme } from "@/src/theme";

const tabs = [
  { href: "/admin/orders", label: "Orders", icon: "receipt-outline" },
  { href: "/admin/menu", label: "Menu", icon: "fast-food-outline" },
  { href: "/admin/updates", label: "Updates", icon: "megaphone-outline" },
] as const;

export function AdminShell({ title, subtitle, right, children }: { title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode }) {
  const router = useRouter(); const pathname = usePathname(); const insets = useSafeAreaInsets(); const styles = useStyles(); const { colors } = useTheme();
  const [checked, setChecked] = React.useState(false);
  React.useEffect(() => { void api.admin.hasSession().then((ok) => { if (!ok) router.replace("/admin"); else setChecked(true); }); }, [router]);
  const logout = async () => { await api.admin.logout(); router.replace("/admin"); };
  if (!checked) return <View style={[styles.root, { paddingTop: insets.top + 16 }]} />;
  return <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
    <View style={styles.header}><Image source={require("../../assets/images/logo.png")} style={styles.logo} resizeMode="contain" /><View style={{ flex: 1 }}><Text style={styles.eyebrow}>DSB ADMIN</Text><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>{right}<Pressable testID="admin-logout" accessibilityRole="button" accessibilityLabel="Log out of admin" onPress={() => void logout()} style={styles.iconButton}><Ionicons name="log-out-outline" size={21} color={colors.error} /></Pressable></View>
    <View style={styles.tabs}>{tabs.map((tab) => { const active = pathname === tab.href; return <Pressable key={tab.href} testID={`admin-tab-${tab.label.toLowerCase()}`} accessibilityRole="button" onPress={() => router.replace(tab.href)} style={[styles.tab, active && styles.tabActive]}><Ionicons name={tab.icon} size={16} color={active ? colors.onBrandPrimary : colors.muted} /><Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text></Pressable>; })}</View>
    <View style={styles.body}>{children}</View>
  </View>;
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 18 },
  logo: { width: 46, height: 46 },
  eyebrow: { color: colors.brandPrimary, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  title: { color: colors.onSurface, fontSize: 20, fontWeight: "900", marginTop: 2 },
  subtitle: { color: colors.muted, fontSize: 11, marginTop: 2 },
  iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 18, marginTop: 14 },
  tab: { flex: 1, minHeight: 44, borderRadius: 13, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  tabActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  tabText: { color: colors.muted, fontWeight: "800", fontSize: 12 },
  tabTextActive: { color: colors.onBrandPrimary },
  body: { flex: 1, marginTop: 14 },
}));
