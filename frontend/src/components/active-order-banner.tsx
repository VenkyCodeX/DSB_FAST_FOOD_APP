import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useApp } from "@/src/store/app-store";
import { makeStyles, useTheme } from "@/src/theme";

const readyChime = require("../../assets/sounds/ready-chime.wav");

export function ActiveOrderBanner() {
  const router = useRouter(); const styles = useStyles(); const { colors } = useTheme(); const { activeOrder } = useApp();
  const player = useAudioPlayer(readyChime);
  const pulse = useSharedValue(1);
  const previous = React.useRef<{ id: string; status: string } | null>(null);
  React.useEffect(() => { pulse.value = withRepeat(withSequence(withTiming(0.35, { duration: 700 }), withTiming(1, { duration: 700 })), -1, false); }, [pulse]);
  React.useEffect(() => {
    const id = activeOrder?.orderId ?? activeOrder?._id ?? activeOrder?.id ?? null;
    const status = activeOrder?.status ?? null;
    const flippedToReady = status === "Ready" && previous.current !== null && !(previous.current.id === id && previous.current.status === "Ready");
    if (flippedToReady) {
      try { player.seekTo(0); player.play(); } catch { /* audio unavailable */ }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    }
    previous.current = id && status ? { id, status } : { id: "", status: "" };
  }, [activeOrder, player]);
  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));
  if (!activeOrder) return null;
  const ready = activeOrder.status === "Ready";
  const id = activeOrder.orderId ?? activeOrder._id ?? activeOrder.id ?? "";
  const itemSummary = activeOrder.itemsOrdered?.slice(0, 2).map((item) => `${item.quantity} × ${item.name}`).join(", ");
  return <Pressable testID="active-order-banner" accessibilityRole="button" accessibilityLabel={`Order ${id} is ${activeOrder.status}`} onPress={() => router.push(`/order/${id}`)} style={({ pressed }) => [styles.banner, ready && styles.bannerReady, pressed && { opacity: 0.85 }]}>
    <View style={[styles.icon, ready && styles.iconReady]}><Ionicons name={ready ? "bag-check" : "flame"} size={22} color={colors.onBrandPrimary} /></View>
    <View style={styles.copy}><View style={styles.statusRow}><Animated.View style={[styles.dot, dotStyle, { backgroundColor: ready ? colors.success : colors.warning }]} /><Text style={[styles.status, { color: ready ? colors.success : colors.warning }]}>{ready ? "READY FOR PICKUP / DELIVERY" : "PREPARING NOW"}</Text></View><Text style={styles.title}>{ready ? "Your order is ready!" : "Your food is being cooked"}</Text><Text style={styles.meta} numberOfLines={1}>{id}{itemSummary ? ` · ${itemSummary}` : ""}</Text></View>
    <Ionicons name="chevron-forward" size={20} color={colors.muted} />
  </Pressable>;
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  banner: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.brandTertiary, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.brandPrimary, marginTop: 18 },
  bannerReady: { borderColor: colors.success },
  icon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" },
  iconReady: { backgroundColor: colors.success },
  copy: { flex: 1 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  status: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  title: { color: colors.onSurface, fontWeight: "900", fontSize: 15, marginTop: 4 },
  meta: { color: colors.onBrandTertiary, fontSize: 11, marginTop: 3 },
}));
