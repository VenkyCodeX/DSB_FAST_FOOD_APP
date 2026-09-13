import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { api, type AdminItem } from "@/src/api/client";
import { AdminShell } from "@/src/components/admin-shell";
import { initialBranches } from "@/src/data/branches";
import { makeStyles, useTheme } from "@/src/theme";

export default function AdminMenuScreen() {
  const styles = useStyles(); const { colors } = useTheme();
  const [branchId, setBranchId] = React.useState(initialBranches[0].id); const [items, setItems] = React.useState<AdminItem[]>([]); const [loading, setLoading] = React.useState(true); const [error, setError] = React.useState<string | null>(null); const [busy, setBusy] = React.useState<string | null>(null);
  const load = React.useCallback(async () => { setLoading(true); try { setItems(await api.admin.items(branchId)); setError(null); } catch (value) { setError(value instanceof Error ? value.message : "Could not load menu."); } finally { setLoading(false); } }, [branchId]);
  React.useEffect(() => { void load(); }, [load]);
  const toggle = async (item: AdminItem, soldOut: boolean) => { setBusy(item._id); setItems((current) => current.map((entry) => entry._id === item._id ? { ...entry, soldOut } : entry)); try { await api.admin.setSoldOut(item._id, soldOut); } catch (value) { setItems((current) => current.map((entry) => entry._id === item._id ? { ...entry, soldOut: !soldOut } : entry)); Alert.alert("Update failed", value instanceof Error ? value.message : "Please try again."); } finally { setBusy(null); } };
  const grouped = React.useMemo(() => { const map = new Map<string, AdminItem[]>(); for (const item of items) { const list = map.get(item.category) ?? []; list.push(item); map.set(item.category, list); } return Array.from(map.entries()); }, [items]);
  const soldOutCount = items.filter((item) => item.soldOut).length;
  return <AdminShell title="Menu availability" subtitle={`${soldOutCount} item${soldOutCount === 1 ? "" : "s"} marked sold out`}>
    <View style={styles.branches}>{initialBranches.map((branch) => { const active = branch.id === branchId; return <Pressable key={branch.id} testID={`branch-${branch.id}`} onPress={() => setBranchId(branch.id)} style={[styles.branch, active && styles.branchActive]}><Text style={[styles.branchText, active && styles.branchTextActive]}>{branch.city}</Text></Pressable>; })}</View>
    {loading ? <View style={styles.center}><ActivityIndicator size="large" color={colors.brandPrimary} /></View> : error ? <View style={styles.center}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.link}>Retry</Text></Pressable></View> : <ScrollView contentContainerStyle={styles.list}>{grouped.map(([category, list]) => <View key={category}><Text style={styles.category}>{category.toUpperCase()}</Text>{list.map((item) => <View key={item._id} testID={`menu-item-${item._id}`} style={[styles.row, item.soldOut && styles.rowSoldOut]}><View style={{ flex: 1 }}><Text style={[styles.name, item.soldOut && { color: colors.muted }]}>{item.name}</Text><Text style={styles.price}>₹{item.price}{item.soldOut ? "  ·  SOLD OUT" : ""}</Text></View>{busy === item._id ? <ActivityIndicator color={colors.brandPrimary} /> : <Switch accessibilityLabel={`${item.name} available`} value={!item.soldOut} onValueChange={(available) => void toggle(item, !available)} trackColor={{ true: colors.success, false: colors.borderStrong }} thumbColor={colors.onSurface} />}</View>)}</View>)}<View style={styles.hint}><Ionicons name="information-circle-outline" size={16} color={colors.muted} /><Text style={styles.hintText}>Switch off to mark an item sold out. Customers see it greyed out instantly.</Text></View></ScrollView>}
  </AdminShell>;
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  branches: { flexDirection: "row", gap: 8, paddingHorizontal: 18 },
  branch: { flex: 1, minHeight: 40, borderRadius: 12, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  branchActive: { backgroundColor: colors.brandTertiary, borderColor: colors.brandPrimary },
  branchText: { color: colors.muted, fontWeight: "800", fontSize: 12 },
  branchTextActive: { color: colors.onBrandTertiary },
  list: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 10 },
  errorText: { color: colors.error, textAlign: "center" },
  link: { color: colors.brandPrimary, fontWeight: "800" },
  category: { color: colors.brandPrimary, fontSize: 10, fontWeight: "900", letterSpacing: 1, marginTop: 18, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surfaceSecondary, borderRadius: 14, padding: 13, marginBottom: 8, borderWidth: 1, borderColor: colors.border, minHeight: 60 },
  rowSoldOut: { borderColor: colors.onError },
  name: { color: colors.onSurface, fontWeight: "800", fontSize: 14 },
  price: { color: colors.muted, fontSize: 11, marginTop: 3, fontWeight: "700" },
  hint: { flexDirection: "row", gap: 8, alignItems: "flex-start", marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: colors.surfaceSecondary },
  hintText: { color: colors.muted, fontSize: 11, lineHeight: 16, flex: 1 },
}));
