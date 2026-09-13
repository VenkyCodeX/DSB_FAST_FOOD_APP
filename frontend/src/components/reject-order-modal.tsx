import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { makeStyles, useTheme } from "@/src/theme";

const reasons = ["Item out of stock", "Kitchen too busy", "Outside delivery area", "Could not reach customer", "Closing soon"];

export function RejectOrderModal({ orderId, visible, onClose, onConfirm }: { orderId: string | null; visible: boolean; onClose: () => void; onConfirm: (reason: string) => Promise<void> }) {
  const styles = useStyles(); const { colors } = useTheme();
  const [reason, setReason] = React.useState(""); const [busy, setBusy] = React.useState(false); const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => { if (visible) { setReason(""); setError(null); } }, [visible]);
  const submit = async () => { if (reason.trim().length < 2) { setError("Please give the customer a short reason."); return; } setBusy(true); setError(null); try { await onConfirm(reason.trim()); onClose(); } catch (value) { setError(value instanceof Error ? value.message : "Could not reject the order."); } finally { setBusy(false); } };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.backdrop}><Pressable style={styles.dismiss} onPress={onClose} accessibilityLabel="Close" /><View style={styles.sheet} testID="reject-modal">
    <View style={styles.handle} /><Text style={styles.title}>Reject order {orderId}</Text><Text style={styles.subtitle}>The customer will see this reason on their order. Nothing is charged.</Text>
    <View style={styles.chips}>{reasons.map((item) => { const active = reason === item; return <Pressable key={item} testID={`reason-${item.replace(/\s+/g, "-").toLowerCase()}`} onPress={() => setReason(item)} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text></Pressable>; })}</View>
    <TextInput testID="reject-reason" value={reason} onChangeText={setReason} placeholder="Or type a reason…" placeholderTextColor={colors.muted} style={styles.input} maxLength={200} multiline />
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <View style={styles.row}><Pressable onPress={onClose} style={styles.secondary}><Text style={styles.secondaryText}>Keep order</Text></Pressable><Pressable testID="confirm-reject" disabled={busy} onPress={() => void submit()} style={[styles.danger, busy && { opacity: 0.6 }]}>{busy ? <ActivityIndicator color={colors.onBrandPrimary} /> : <><Ionicons name="close-circle" size={17} color={colors.onBrandPrimary} /><Text style={styles.dangerText}>Reject order</Text></>}</Pressable></View>
  </View></KeyboardAvoidingView></Modal>;
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.65)" },
  dismiss: { flex: 1 },
  sheet: { backgroundColor: colors.surfaceSecondary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32, borderTopWidth: 1, borderColor: colors.border },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: "center", marginBottom: 16 },
  title: { color: colors.onSurface, fontWeight: "900", fontSize: 18 },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 5, lineHeight: 17 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  chip: { minHeight: 36, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: "center" },
  chipActive: { backgroundColor: colors.onError, borderColor: colors.error },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  chipTextActive: { color: colors.error },
  input: { minHeight: 56, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, paddingHorizontal: 12, paddingTop: 12, color: colors.onSurface, fontSize: 14, marginTop: 12, textAlignVertical: "top" },
  error: { color: colors.error, fontSize: 12, marginTop: 8 },
  row: { flexDirection: "row", gap: 10, marginTop: 16 },
  secondary: { flex: 1, minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: colors.onSurface, fontWeight: "800" },
  danger: { flex: 1, minHeight: 48, borderRadius: 13, backgroundColor: colors.error, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  dangerText: { color: colors.onBrandPrimary, fontWeight: "900" },
}));
