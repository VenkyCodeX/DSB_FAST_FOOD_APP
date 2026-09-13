import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { api } from "@/src/api/client";
import { AdminShell } from "@/src/components/admin-shell";
import { initialBranches } from "@/src/data/branches";
import { makeStyles, useTheme } from "@/src/theme";

export default function AdminSettingsScreen() {
  const router = useRouter(); const styles = useStyles(); const { colors } = useTheme();
  const [newPin, setNewPin] = React.useState(""); const [confirmPin, setConfirmPin] = React.useState(""); const [saving, setSaving] = React.useState(false); const [error, setError] = React.useState<string | null>(null); const [done, setDone] = React.useState(false);
  const save = async () => {
    setError(null); setDone(false);
    if (newPin.trim().length < 4) { setError("PIN must be at least 4 characters."); return; }
    if (/\s/.test(newPin)) { setError("PIN cannot contain spaces."); return; }
    if (newPin !== confirmPin) { setError("The two PINs don't match."); return; }
    setSaving(true);
    try { await api.admin.changePin(newPin.trim()); setDone(true); setNewPin(""); setConfirmPin(""); }
    catch (value) { setError(value instanceof Error ? value.message : "Could not update the PIN."); }
    finally { setSaving(false); }
  };
  return <AdminShell title="Settings" subtitle="Security & branch info">
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}><ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
      <View style={styles.card}><View style={styles.cardHeader}><View style={styles.cardIcon}><Ionicons name="key-outline" size={20} color={colors.brandPrimary} /></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>Change admin PIN</Text><Text style={styles.cardText}>The new PIN takes effect on the next admin login. Anyone with the current PIN will be logged out when they next sign in.</Text></View></View>
        <Text style={styles.label}>New PIN</Text><TextInput testID="new-pin" value={newPin} onChangeText={setNewPin} secureTextEntry autoCapitalize="none" placeholder="At least 4 characters" placeholderTextColor={colors.muted} style={styles.input} />
        <Text style={styles.label}>Confirm new PIN</Text><TextInput testID="confirm-pin" value={confirmPin} onChangeText={setConfirmPin} secureTextEntry autoCapitalize="none" placeholder="Repeat the new PIN" placeholderTextColor={colors.muted} style={styles.input} onSubmitEditing={() => void save()} />
        {error ? <Text style={styles.error}>{error}</Text> : null}{done ? <View style={styles.success}><Ionicons name="checkmark-circle" size={16} color={colors.success} /><Text style={styles.successText}>PIN updated. Use it the next time you log in.</Text></View> : null}
        <Pressable testID="save-pin" onPress={() => void save()} disabled={saving} style={[styles.primary, saving && { opacity: 0.6 }]}>{saving ? <ActivityIndicator color={colors.onBrandPrimary} /> : <><Ionicons name="lock-closed-outline" size={17} color={colors.onBrandPrimary} /><Text style={styles.primaryText}>Update PIN</Text></>}</Pressable>
      </View>
      <Text style={styles.section}>BRANCHES</Text>
      {initialBranches.map((branch) => <View key={branch.id} style={styles.branch}><Ionicons name={branch.isComingSoon ? "time-outline" : "location"} size={19} color={branch.isComingSoon ? colors.warning : colors.brandPrimary} /><View style={{ flex: 1, marginLeft: 10 }}><Text style={styles.branchName}>{branch.name}</Text><Text style={styles.cardText}>{branch.address}{branch.openingTime ? ` · ${branch.openingTime}–${branch.closingTime}` : ` · Opening ${branch.openingDate}`}</Text>{branch.whatsapp ? <Text style={styles.cardText}>WhatsApp +{branch.whatsapp}</Text> : null}</View><Text style={[styles.badge, { color: branch.isComingSoon ? colors.warning : colors.success }]}>{branch.isComingSoon ? "COMING SOON" : "ACTIVE"}</Text></View>)}
      <Text style={styles.section}>OTP DELIVERY</Text>
      <View style={styles.branch}><Ionicons name="flask-outline" size={19} color={colors.warning} /><View style={{ flex: 1, marginLeft: 10 }}><Text style={styles.branchName}>Test mode</Text><Text style={styles.cardText}>OTP codes are shown inside the app instead of sent by SMS. Connect MSG91 or Twilio to send real texts.</Text></View></View>
      <Pressable onPress={() => router.replace("/(tabs)/profile")} style={styles.exit}><Ionicons name="phone-portrait-outline" size={16} color={colors.muted} /><Text style={styles.exitText}>Back to customer app</Text></Pressable>
    </ScrollView></KeyboardAvoidingView>
  </AdminShell>;
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  list: { paddingHorizontal: 18, paddingBottom: 40 },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: 18, padding: 15, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 14 },
  cardIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  cardTitle: { color: colors.onSurface, fontWeight: "900", fontSize: 15 },
  cardText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  label: { color: colors.onSurfaceSecondary, fontWeight: "800", fontSize: 12, marginBottom: 6, marginTop: 6 },
  input: { height: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, paddingHorizontal: 13, color: colors.onSurface, fontSize: 16, letterSpacing: 3, marginBottom: 6 },
  error: { color: colors.error, fontSize: 12, marginTop: 6 },
  success: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  successText: { color: colors.success, fontSize: 12, fontWeight: "700" },
  primary: { marginTop: 14, minHeight: 48, borderRadius: 13, backgroundColor: colors.brandPrimary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryText: { color: colors.onBrandPrimary, fontWeight: "900", fontSize: 14 },
  section: { color: colors.muted, fontSize: 11, fontWeight: "900", letterSpacing: 1, marginTop: 24, marginBottom: 10 },
  branch: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 14, padding: 13, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  branchName: { color: colors.onSurface, fontWeight: "800", fontSize: 13 },
  badge: { fontSize: 9, fontWeight: "900", marginLeft: 8 },
  exit: { marginTop: 24, minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  exitText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
}));
