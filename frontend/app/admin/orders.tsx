import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import React from "react";
import { ActivityIndicator, Alert, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { api, type OrderSummary } from "@/src/api/client";
import { AdminShell } from "@/src/components/admin-shell";
import { RejectOrderModal } from "@/src/components/reject-order-modal";
import { makeStyles, useTheme } from "@/src/theme";
import type { Order, OrderStatus } from "@/src/types";
import { formatSlot } from "@/src/utils/delivery-slots";
import { shareKitchenTicket } from "@/src/utils/kitchen-ticket";

const newOrderChime = require("../../assets/sounds/new-order.wav");

const statuses: OrderStatus[] = ["Order Received", "Preparing", "Ready", "Completed"];
const filters: { key: string; label: string }[] = [{ key: "active", label: "Active" }, { key: "Order Received", label: "New" }, { key: "Preparing", label: "Preparing" }, { key: "Ready", label: "Ready" }, { key: "Completed", label: "Completed" }, { key: "Cancelled", label: "Cancelled" }];

function nextStatus(status?: OrderStatus): OrderStatus | null { if (status === "Cancelled") return null; const index = statuses.indexOf(status ?? "Order Received"); return index >= 0 && index < statuses.length - 1 ? statuses[index + 1] : null; }

export default function AdminOrdersScreen() {
  const styles = useStyles(); const { colors } = useTheme();
  const [filter, setFilter] = React.useState("active"); const [orders, setOrders] = React.useState<Order[]>([]); const [summary, setSummary] = React.useState<OrderSummary | null>(null); const [loading, setLoading] = React.useState(true); const [refreshing, setRefreshing] = React.useState(false); const [error, setError] = React.useState<string | null>(null); const [busy, setBusy] = React.useState<string | null>(null); const [soundOn, setSoundOn] = React.useState(true); const [newCount, setNewCount] = React.useState(0); const [rejecting, setRejecting] = React.useState<string | null>(null);
  const player = useAudioPlayer(newOrderChime);
  const knownIds = React.useRef<Set<string> | null>(null);
  const soundRef = React.useRef(soundOn); soundRef.current = soundOn;
  const load = React.useCallback(async (silent = false) => { if (!silent) setLoading(true); try { const [list, counts, incoming] = await Promise.all([api.admin.orders(filter), api.admin.summary(), filter === "active" || filter === "Order Received" ? Promise.resolve(null) : api.admin.orders("Order Received")]); const newOrders = incoming ?? list.filter((order) => (order.status ?? "Order Received") === "Order Received"); const ids = new Set(newOrders.map((order) => order.orderId)); if (knownIds.current) { const fresh = newOrders.filter((order) => !knownIds.current?.has(order.orderId)); if (fresh.length > 0) { setNewCount((count) => count + fresh.length); if (soundRef.current) { try { player.seekTo(0); player.play(); } catch { /* audio unavailable */ } void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined); } } } knownIds.current = ids; setOrders(list); setSummary(counts); setError(null); } catch (value) { setError(value instanceof Error ? value.message : "Could not load orders."); } finally { setLoading(false); setRefreshing(false); } }, [filter, player]);
  React.useEffect(() => { void load(); const timer = setInterval(() => void load(true), 10000); return () => clearInterval(timer); }, [load]);
  const setStatus = async (order: Order, status: OrderStatus) => { setBusy(order.orderId); try { const updated = await api.admin.setStatus(order.orderId, status); setOrders((current) => current.map((item) => item.orderId === updated.orderId ? updated : item)); await load(true); } catch (value) { Alert.alert("Update failed", value instanceof Error ? value.message : "Please try again."); } finally { setBusy(null); } };
  return <AdminShell title="Incoming orders" subtitle={summary ? `${summary["Order Received"]} new · ${summary.Preparing} preparing · ${summary.Ready} ready` : undefined} right={<Pressable testID="sound-toggle" accessibilityRole="button" accessibilityLabel={soundOn ? "Mute new order alerts" : "Unmute new order alerts"} onPress={() => setSoundOn((value) => !value)} style={styles.iconButton}><Ionicons name={soundOn ? "notifications" : "notifications-off-outline"} size={21} color={soundOn ? colors.brandPrimary : colors.muted} /></Pressable>}>
    {summary ? <View style={styles.stats} testID="today-summary"><View style={styles.stat}><Text style={styles.statLabel}>TODAY’S ORDERS</Text><Text style={styles.statValue}>{summary.today.count}</Text><Text style={styles.statMeta}>{summary.today.completed} completed</Text></View><View style={[styles.stat, styles.statAccent]}><Text style={[styles.statLabel, { color: colors.onBrandTertiary }]}>TODAY’S REVENUE</Text><Text style={[styles.statValue, { color: colors.brandPrimary }]}>₹{Math.round(summary.today.revenue)}</Text><Text style={[styles.statMeta, { color: colors.onBrandTertiary }]}>{summary.today.count ? `avg ₹${Math.round(summary.today.revenue / summary.today.count)} / order` : "No orders yet"}</Text></View></View> : null}
    {newCount > 0 ? <Pressable testID="new-orders-toast" onPress={() => { setNewCount(0); setFilter("Order Received"); }} style={styles.toast}><Ionicons name="notifications" size={16} color={colors.onBrandPrimary} /><Text style={styles.toastText}>{newCount} new order{newCount === 1 ? "" : "s"} just came in · tap to view</Text><Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={() => setNewCount(0)} hitSlop={10}><Ionicons name="close" size={16} color={colors.onBrandPrimary} /></Pressable></Pressable> : null}
    <View style={styles.filterBar}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{filters.map((item) => { const active = item.key === filter; const count = summary && item.key !== "active" ? summary[item.key as OrderStatus] : summary ? summary["Order Received"] + summary.Preparing + summary.Ready : undefined; return <Pressable key={item.key} testID={`filter-${item.key}`} onPress={() => setFilter(item.key)} style={[styles.filter, active && styles.filterActive]}><Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}{count !== undefined ? ` · ${count}` : ""}</Text></Pressable>; })}</ScrollView></View>
    {loading ? <View style={styles.center}><ActivityIndicator size="large" color={colors.brandPrimary} /></View> : error ? <View style={styles.center}><Ionicons name="cloud-offline-outline" size={34} color={colors.error} /><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.link}>Retry</Text></Pressable></View> : <ScrollView contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(true); }} tintColor={colors.brandPrimary} />}>
      {orders.length === 0 ? <View style={styles.center}><Ionicons name="checkmark-done-circle-outline" size={40} color={colors.success} /><Text style={styles.muted}>No orders here right now.</Text></View> : orders.map((order) => { const status = order.status ?? "Order Received"; const next = nextStatus(status); const statusColor = status === "Ready" ? colors.success : status === "Preparing" ? colors.warning : status === "Completed" ? colors.muted : status === "Cancelled" ? colors.error : colors.brandPrimary; const scheduled = order.deliveryTime && order.deliveryTime !== "ASAP"; return <View key={order.orderId} testID={`admin-order-${order.orderId}`} style={[styles.card, status === "Cancelled" && styles.cardCancelled]}>
        <View style={styles.cardTop}><View style={{ flex: 1 }}><Text style={styles.orderId}>{order.orderId}</Text><Text style={styles.meta}>{order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}{order.branchName ? ` · ${order.branchName}` : ""}</Text></View><View style={[styles.statusPill, { borderColor: statusColor }]}><Text style={[styles.statusText, { color: statusColor }]}>{status.toUpperCase()}</Text></View></View>
        <View style={[styles.timeBadge, scheduled && styles.timeBadgeScheduled]} testID={`time-${order.orderId}`}><Ionicons name={scheduled ? "alarm" : "flash"} size={14} color={scheduled ? colors.warning : colors.brandPrimary} /><Text style={[styles.timeText, scheduled && { color: colors.warning }]}>{scheduled ? `Deliver at ${formatSlot(order.deliveryTime ?? "")}` : "ASAP"}</Text></View>
        {status === "Cancelled" ? <View style={styles.cancelledNote}><Ionicons name="close-circle" size={15} color={colors.error} /><Text style={styles.cancelledText}>{order.cancelledBy === "admin" ? `Rejected · ${order.cancelReason ?? ""}` : "Cancelled by customer"}</Text></View> : null}
        <View style={styles.customer}><Ionicons name="person-outline" size={15} color={colors.muted} /><Text style={styles.customerText}>{order.customerName}</Text>{order.phoneNumber ? <Pressable accessibilityRole="button" onPress={() => void Linking.openURL(`tel:${order.phoneNumber}`)} style={styles.call}><Ionicons name="call" size={14} color={colors.success} /><Text style={styles.callText}>{order.phoneNumber}</Text></Pressable> : null}</View>
        <Text style={styles.address} numberOfLines={2}>{order.address}</Text>
        {order.notes ? <View style={styles.notes} testID={`notes-${order.orderId}`}><Ionicons name="chatbox-ellipses" size={15} color={colors.warning} /><Text style={styles.notesText}>{order.notes}</Text></View> : null}
        <View style={styles.items}>{order.itemsOrdered?.map((item) => <View key={item.name} style={styles.line}><Text style={styles.item}>{item.quantity} × {item.name}</Text><Text style={styles.value}>₹{item.price * item.quantity}</Text></View>)}<View style={styles.totalLine}><Text style={styles.totalLabel}>Total · {order.paymentMethod?.toUpperCase() ?? "COD"}</Text><Text style={styles.totalValue}>₹{order.totalAmount}</Text></View></View>
        <View style={styles.actions}>{next ? <Pressable testID={`advance-${order.orderId}`} disabled={busy === order.orderId} onPress={() => void setStatus(order, next)} style={[styles.primary, next === "Ready" && { backgroundColor: colors.success }, busy === order.orderId && { opacity: 0.6 }]}>{busy === order.orderId ? <ActivityIndicator color={colors.onBrandPrimary} /> : <><Ionicons name={next === "Preparing" ? "flame" : next === "Ready" ? "bag-check" : "checkmark-done"} size={17} color={colors.onBrandPrimary} /><Text style={styles.primaryText}>Mark {next}</Text></>}</Pressable> : status === "Cancelled" ? <View style={styles.doneNote}><Ionicons name="close-circle" size={17} color={colors.error} /><Text style={[styles.doneText, { color: colors.error }]}>Cancelled</Text></View> : <View style={styles.doneNote}><Ionicons name="checkmark-circle" size={17} color={colors.success} /><Text style={styles.doneText}>Completed{order.rating ? ` · rated ${order.rating}★` : ""}</Text></View>}{status !== "Order Received" && status !== "Completed" && status !== "Cancelled" ? <Pressable accessibilityRole="button" accessibilityLabel="Move back one step" disabled={busy === order.orderId} onPress={() => void setStatus(order, statuses[statuses.indexOf(status) - 1])} style={styles.secondary}><Ionicons name="arrow-undo" size={16} color={colors.muted} /></Pressable> : null}<Pressable testID={`ticket-${order.orderId}`} accessibilityRole="button" accessibilityLabel="Share kitchen ticket" onPress={() => void shareKitchenTicket(order).catch(() => Alert.alert("Could not share", "Sharing is not available on this device."))} style={styles.secondary}><Ionicons name="print-outline" size={18} color={colors.onSurface} /></Pressable>{status !== "Completed" && status !== "Cancelled" ? <Pressable testID={`reject-${order.orderId}`} accessibilityRole="button" accessibilityLabel="Reject order" onPress={() => setRejecting(order.orderId)} style={[styles.secondary, { borderColor: colors.error }]}><Ionicons name="close" size={18} color={colors.error} /></Pressable> : null}</View>
      </View>; })}
    </ScrollView>}
    <RejectOrderModal orderId={rejecting} visible={rejecting !== null} onClose={() => setRejecting(null)} onConfirm={async (reason) => { if (!rejecting) return; const updated = await api.admin.reject(rejecting, reason); setOrders((current) => current.map((item) => item.orderId === updated.orderId ? updated : item)); await load(true); }} />
  </AdminShell>;
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  stats: { flexDirection: "row", gap: 10, paddingHorizontal: 18, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: colors.surfaceSecondary, borderRadius: 16, padding: 13, borderWidth: 1, borderColor: colors.border },
  statAccent: { backgroundColor: colors.brandTertiary, borderColor: colors.brandPrimary },
  statLabel: { color: colors.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  statValue: { color: colors.onSurface, fontSize: 24, fontWeight: "900", marginTop: 4 },
  statMeta: { color: colors.muted, fontSize: 10, marginTop: 3 },
  toast: { marginHorizontal: 18, marginBottom: 12, minHeight: 44, borderRadius: 13, backgroundColor: colors.success, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 },
  toastText: { color: colors.onBrandPrimary, fontWeight: "800", fontSize: 12, flex: 1 },
  filterBar: { height: 44 },
  filters: { paddingHorizontal: 18, gap: 8, alignItems: "center" },
  filter: { height: 38, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, justifyContent: "center" },
  filterActive: { backgroundColor: colors.brandTertiary, borderColor: colors.brandPrimary },
  filterText: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  filterTextActive: { color: colors.onBrandTertiary },
  list: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 40, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 10, minHeight: 200 },
  muted: { color: colors.muted, textAlign: "center" },
  errorText: { color: colors.error, textAlign: "center" },
  link: { color: colors.brandPrimary, fontWeight: "800" },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: 18, padding: 15, borderWidth: 1, borderColor: colors.border },
  cardCancelled: { opacity: 0.75, borderColor: colors.onError },
  timeBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, backgroundColor: colors.brandTertiary },
  timeBadgeScheduled: { backgroundColor: colors.onWarning },
  timeText: { color: colors.onBrandTertiary, fontSize: 11, fontWeight: "900" },
  cancelledNote: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, padding: 9, borderRadius: 10, backgroundColor: colors.onError },
  cancelledText: { color: colors.error, fontSize: 12, fontWeight: "800", flex: 1 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  orderId: { color: colors.onSurface, fontWeight: "900", fontSize: 16 },
  meta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  statusPill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  customer: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  customerText: { color: colors.onSurfaceSecondary, fontWeight: "800", fontSize: 13 },
  call: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: "auto", minHeight: 32, paddingHorizontal: 8, borderRadius: 10, backgroundColor: colors.onSuccess },
  callText: { color: colors.success, fontSize: 12, fontWeight: "800" },
  address: { color: colors.muted, fontSize: 12, marginTop: 6, lineHeight: 17 },
  notes: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 8, padding: 9, borderRadius: 10, backgroundColor: colors.onWarning, borderWidth: 1, borderColor: colors.warning },
  notesText: { color: colors.warning, fontSize: 12, fontWeight: "900", flex: 1 },
  items: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  line: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  item: { color: colors.onSurfaceSecondary, fontSize: 13 },
  value: { color: colors.onSurfaceSecondary, fontSize: 13, fontWeight: "700" },
  totalLine: { flexDirection: "row", justifyContent: "space-between", marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  totalLabel: { color: colors.onSurface, fontWeight: "900", fontSize: 13 },
  totalValue: { color: colors.brandPrimary, fontWeight: "900", fontSize: 16 },
  actions: { flexDirection: "row", gap: 8, marginTop: 14 },
  primary: { flex: 1, minHeight: 48, borderRadius: 13, backgroundColor: colors.brandPrimary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryText: { color: colors.onBrandPrimary, fontWeight: "900", fontSize: 14 },
  secondary: { width: 48, minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" },
  doneNote: { flex: 1, minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  doneText: { color: colors.success, fontWeight: "800", fontSize: 13 },
}));
