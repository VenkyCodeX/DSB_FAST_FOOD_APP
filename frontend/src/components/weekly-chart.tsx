import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { api, type WeeklyStats } from "@/src/api/client";
import { makeStyles, useTheme } from "@/src/theme";

export function WeeklyChart() {
  const styles = useStyles(); const { colors } = useTheme();
  const [data, setData] = React.useState<WeeklyStats | null>(null); const [error, setError] = React.useState<string | null>(null); const [metric, setMetric] = React.useState<"count" | "revenue">("count");
  React.useEffect(() => { void api.admin.weekly().then(setData).catch((value) => setError(value instanceof Error ? value.message : "Could not load stats.")); }, []);
  if (error) return <View style={styles.card}><Text style={styles.error}>{error}</Text></View>;
  if (!data) return <View style={[styles.card, styles.center]}><ActivityIndicator color={colors.brandPrimary} /></View>;
  const max = Math.max(1, ...data.days.map((day) => day[metric]));
  const todayKey = data.days[data.days.length - 1]?.date;
  return <View style={styles.card} testID="weekly-chart">
    <View style={styles.header}><View><Text style={styles.title}>Last 7 days</Text><Text style={styles.subtitle}>{data.totalOrders} orders · ₹{Math.round(data.totalRevenue)} revenue</Text></View><View style={styles.toggle}>{(["count", "revenue"] as const).map((key) => <Pressable key={key} testID={`metric-${key}`} onPress={() => setMetric(key)} style={[styles.toggleButton, metric === key && styles.toggleActive]}><Text style={[styles.toggleText, metric === key && styles.toggleTextActive]}>{key === "count" ? "Orders" : "Revenue"}</Text></Pressable>)}</View></View>
    <View style={styles.bars}>{data.days.map((day) => { const value = day[metric]; const height = Math.max(value > 0 ? 6 : 2, Math.round((value / max) * 110)); const isToday = day.date === todayKey; return <View key={day.date} style={styles.barColumn}><Text style={[styles.barValue, isToday && { color: colors.brandPrimary }]}>{metric === "revenue" ? (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : Math.round(value)) : value}</Text><View style={styles.barTrack}><View style={[styles.bar, { height, backgroundColor: isToday ? colors.brandPrimary : colors.brandTertiary, borderColor: isToday ? colors.brandPrimary : colors.borderStrong }]} /></View><Text style={[styles.barLabel, isToday && { color: colors.onSurface, fontWeight: "900" }]}>{isToday ? "Today" : day.label}</Text></View>; })}</View>
  </View>;
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: 18, padding: 15, borderWidth: 1, borderColor: colors.border },
  center: { alignItems: "center", justifyContent: "center", minHeight: 120 },
  error: { color: colors.error, fontSize: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  title: { color: colors.onSurface, fontWeight: "900", fontSize: 15 },
  subtitle: { color: colors.muted, fontSize: 11, marginTop: 3 },
  toggle: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: colors.border },
  toggleButton: { minHeight: 30, paddingHorizontal: 10, borderRadius: 8, justifyContent: "center" },
  toggleActive: { backgroundColor: colors.brandPrimary },
  toggleText: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  toggleTextActive: { color: colors.onBrandPrimary },
  bars: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 18, gap: 6 },
  barColumn: { flex: 1, alignItems: "center" },
  barValue: { color: colors.muted, fontSize: 9, fontWeight: "800", marginBottom: 4 },
  barTrack: { height: 112, justifyContent: "flex-end", width: "100%" },
  bar: { width: "100%", borderRadius: 6, borderWidth: 1 },
  barLabel: { color: colors.muted, fontSize: 10, fontWeight: "700", marginTop: 6 },
}));
