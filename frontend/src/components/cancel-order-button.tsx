import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text } from "react-native";
import { api } from "@/src/api/client";
import { useApp } from "@/src/store/app-store";
import { makeStyles, useTheme } from "@/src/theme";
import type { Order } from "@/src/types";

/** "Cancel order" button that counts down the 2-minute window and disappears when it closes. */
export function CancelOrderButton({ orderId, initialSeconds, onCancelled }: { orderId: string; initialSeconds: number; onCancelled: (order: Order) => void }) {
  const styles = useStyles(); const { colors } = useTheme(); const { refreshOrders } = useApp();
  const [seconds, setSeconds] = React.useState(Math.max(0, Math.floor(initialSeconds))); const [busy, setBusy] = React.useState(false);
  React.useEffect(() => { setSeconds(Math.max(0, Math.floor(initialSeconds))); }, [initialSeconds]);
  React.useEffect(() => { if (seconds <= 0) return undefined; const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000); return () => clearInterval(timer); }, [seconds > 0]); // eslint-disable-line react-hooks/exhaustive-deps
  if (seconds <= 0) return null;
  const confirm = () => Alert.alert("Cancel this order?", "The kitchen hasn't started yet, so you can cancel for free.", [{ text: "Keep order", style: "cancel" }, { text: "Cancel order", style: "destructive", onPress: async () => { setBusy(true); try { const result = await api.cancelOrder(orderId); onCancelled(result.order); void refreshOrders(); } catch (value) { Alert.alert("Couldn't cancel", value instanceof Error ? value.message : "Please call the branch."); } finally { setBusy(false); } } }]);
  const mm = Math.floor(seconds / 60); const ss = String(seconds % 60).padStart(2, "0");
  return <Pressable testID="cancel-order" accessibilityRole="button" disabled={busy} onPress={confirm} style={[styles.button, busy && { opacity: 0.6 }]}>{busy ? <ActivityIndicator color={colors.error} /> : <><Ionicons name="close-circle-outline" size={18} color={colors.error} /><Text style={styles.text}>Cancel order</Text><Text style={styles.timer}>{mm}:{ss}</Text></>}</Pressable>;
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  button: { width: "100%", minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: colors.error, backgroundColor: colors.onError, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 10 },
  text: { color: colors.error, fontWeight: "900", fontSize: 13 },
  timer: { color: colors.error, fontWeight: "800", fontSize: 12, opacity: 0.8, fontVariant: ["tabular-nums"] },
}));
