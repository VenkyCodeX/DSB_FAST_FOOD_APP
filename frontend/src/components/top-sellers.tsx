import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { api, type TopItems } from "@/src/api/client";
import { makeStyles, useTheme } from "@/src/theme";

export function TopSellers() {
  const styles = useStyles(); const { colors } = useTheme();
  const [data, setData] = React.useState<TopItems | null>(null); const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => { void api.admin.topItems().then(setData).catch((value) => setError(value instanceof Error ? value.message : "Could not load top sellers.")); }, []);
  if (error) return <View style={styles.card}><Text style={styles.error}>{error}</Text></View>;
  if (!data) return <View style={[styles.card, styles.center]}><ActivityIndicator color={colors.brandPrimary} /></View>;
  const max = Math.max(1, ...data.items.map((item) => item.quantity));
  return <View style={styles.card} testID="top-sellers">
    <View style={styles.header}><View style={styles.icon}><Ionicons name="trophy" size={18} color={colors.warning} /></View><View style={{ flex: 1 }}><Text style={styles.title}>Top sellers</Text><Text style={styles.subtitle}>Most-ordered items in the last {data.days} days · stock up on these</Text></View></View>
    {data.items.length === 0 ? <Text style={styles.empty}>No orders yet this week.</Text> : data.items.map((item, index) => <View key={item.name} style={styles.row}><Text style={[styles.rank, index === 0 && { color: colors.warning }]}>#{index + 1}</Text><View style={{ flex: 1 }}><View style={styles.rowTop}><Text style={styles.name} numberOfLines={1}>{item.name}</Text><Text style={styles.qty}>{item.quantity} sold</Text></View><View style={styles.track}><View style={[styles.fill, { width: `${Math.max(4, Math.round((item.quantity / max) * 100))}%`, backgroundColor: index === 0 ? colors.warning : colors.brandPrimary }]} /></View><Text style={styles.meta}>{item.orders} order{item.orders === 1 ? "" : "s"} · ₹{Math.round(item.revenue)} revenue</Text></View></View>)}
  </View>;
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: 18, padding: 15, borderWidth: 1, borderColor: colors.border },
  center: { alignItems: "center", justifyContent: "center", minHeight: 100 },
  error: { color: colors.error, fontSize: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.onWarning, alignItems: "center", justifyContent: "center" },
  title: { color: colors.onSurface, fontWeight: "900", fontSize: 15 },
  subtitle: { color: colors.muted, fontSize: 11, marginTop: 2 },
  empty: { color: colors.muted, fontSize: 12, textAlign: "center", paddingVertical: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  rank: { color: colors.muted, fontWeight: "900", fontSize: 13, width: 28 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  name: { color: colors.onSurface, fontWeight: "800", fontSize: 13, flex: 1 },
  qty: { color: colors.brandPrimary, fontWeight: "900", fontSize: 12 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceTertiary, marginTop: 6, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
  meta: { color: colors.muted, fontSize: 10, marginTop: 4 },
}));
