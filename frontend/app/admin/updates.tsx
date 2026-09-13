import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { api } from "@/src/api/client";
import { AdminShell } from "@/src/components/admin-shell";
import { initialBranches } from "@/src/data/branches";
import { makeStyles, useTheme } from "@/src/theme";
import type { RestaurantUpdate } from "@/src/types";

export default function AdminUpdatesScreen() {
  const styles = useStyles(); const { colors } = useTheme();
  const [updates, setUpdates] = React.useState<RestaurantUpdate[]>([]); const [loading, setLoading] = React.useState(true); const [error, setError] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState(""); const [description, setDescription] = React.useState(""); const [branchId, setBranchId] = React.useState<string | null>(null); const [saving, setSaving] = React.useState(false); const [formError, setFormError] = React.useState<string | null>(null);
  const load = React.useCallback(async () => { setLoading(true); try { setUpdates(await api.admin.updates()); setError(null); } catch (value) { setError(value instanceof Error ? value.message : "Could not load updates."); } finally { setLoading(false); } }, []);
  React.useEffect(() => { void load(); }, [load]);
  const create = async () => { if (!title.trim() || !description.trim()) { setFormError("Add a title and a short message."); return; } setSaving(true); setFormError(null); try { const created = await api.admin.createUpdate({ title: title.trim(), description: description.trim(), branchId }); setUpdates((current) => [created, ...current]); setTitle(""); setDescription(""); } catch (value) { setFormError(value instanceof Error ? value.message : "Could not post the update."); } finally { setSaving(false); } };
  const toggle = async (update: RestaurantUpdate) => { try { const changed = await api.admin.toggleUpdate(update.id, !update.active); setUpdates((current) => current.map((item) => item.id === changed.id ? changed : item)); } catch (value) { Alert.alert("Update failed", value instanceof Error ? value.message : "Please try again."); } };
  const remove = (update: RestaurantUpdate) => { Alert.alert("Delete update", `Remove "${update.title}" permanently?`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => { try { await api.admin.deleteUpdate(update.id); setUpdates((current) => current.filter((item) => item.id !== update.id)); } catch (value) { Alert.alert("Delete failed", value instanceof Error ? value.message : "Please try again."); } } }]); };
  return <AdminShell title="Restaurant updates" subtitle={`${updates.filter((item) => item.active).length} live on the Home screen`}>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}><ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
      <View style={styles.form}><Text style={styles.formTitle}>Post a new update</Text><TextInput testID="update-title" value={title} onChangeText={setTitle} placeholder="Title · e.g. Diwali special combo" placeholderTextColor={colors.muted} style={styles.input} maxLength={60} /><TextInput testID="update-description" value={description} onChangeText={setDescription} placeholder="Message customers will see on Home" placeholderTextColor={colors.muted} style={[styles.input, styles.textarea]} multiline maxLength={200} /><View style={styles.branches}>{[{ id: null, label: "All branches" }, ...initialBranches.map((branch) => ({ id: branch.id, label: branch.city }))].map((option) => { const active = option.id === branchId; return <Pressable key={option.label} onPress={() => setBranchId(option.id)} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text></Pressable>; })}</View>{formError ? <Text style={styles.errorText}>{formError}</Text> : null}<Pressable testID="post-update" onPress={() => void create()} disabled={saving} style={[styles.primary, saving && { opacity: 0.6 }]}>{saving ? <ActivityIndicator color={colors.onBrandPrimary} /> : <><Ionicons name="megaphone" size={17} color={colors.onBrandPrimary} /><Text style={styles.primaryText}>Publish update</Text></>}</Pressable></View>
      <Text style={styles.section}>ALL UPDATES</Text>
      {loading ? <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: 20 }} /> : error ? <View style={styles.center}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.link}>Retry</Text></Pressable></View> : updates.length === 0 ? <Text style={styles.muted}>No updates posted yet.</Text> : updates.map((update) => <View key={update.id} testID={`update-${update.id}`} style={[styles.card, !update.active && styles.cardInactive]}><View style={{ flex: 1 }}><View style={styles.cardTop}><Text style={styles.cardTitle}>{update.title}</Text><View style={[styles.pill, { backgroundColor: update.active ? colors.onSuccess : colors.surfaceTertiary }]}><Text style={[styles.pillText, { color: update.active ? colors.success : colors.muted }]}>{update.active ? "LIVE" : "HIDDEN"}</Text></View></View><Text style={styles.cardText}>{update.description}</Text><Text style={styles.cardMeta}>{update.branchId ? initialBranches.find((branch) => branch.id === update.branchId)?.city ?? update.branchId : "All branches"}{update.date ? ` · ${new Date(update.date).toLocaleDateString()}` : ""}</Text></View><View style={styles.cardActions}><Pressable accessibilityRole="button" accessibilityLabel={update.active ? "Hide update" : "Show update"} onPress={() => void toggle(update)} style={styles.iconButton}><Ionicons name={update.active ? "eye-off-outline" : "eye-outline"} size={20} color={colors.brandPrimary} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Delete update" onPress={() => remove(update)} style={styles.iconButton}><Ionicons name="trash-outline" size={19} color={colors.error} /></Pressable></View></View>)}
    </ScrollView></KeyboardAvoidingView>
  </AdminShell>;
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  list: { paddingHorizontal: 18, paddingBottom: 40 },
  form: { backgroundColor: colors.surfaceSecondary, borderRadius: 18, padding: 15, borderWidth: 1, borderColor: colors.border },
  formTitle: { color: colors.onSurface, fontWeight: "900", fontSize: 15, marginBottom: 10 },
  input: { minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, paddingHorizontal: 12, color: colors.onSurface, fontSize: 14, marginBottom: 10 },
  textarea: { minHeight: 80, paddingTop: 12, textAlignVertical: "top" },
  branches: { flexDirection: "row", gap: 8, marginBottom: 6 },
  chip: { minHeight: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, justifyContent: "center" },
  chipActive: { backgroundColor: colors.brandTertiary, borderColor: colors.brandPrimary },
  chipText: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  chipTextActive: { color: colors.onBrandTertiary },
  primary: { marginTop: 10, minHeight: 48, borderRadius: 13, backgroundColor: colors.brandPrimary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryText: { color: colors.onBrandPrimary, fontWeight: "900", fontSize: 14 },
  errorText: { color: colors.error, fontSize: 12, marginTop: 6 },
  section: { color: colors.muted, fontSize: 11, fontWeight: "900", letterSpacing: 1, marginTop: 24, marginBottom: 10 },
  center: { alignItems: "center", padding: 20, gap: 8 },
  link: { color: colors.brandPrimary, fontWeight: "800" },
  muted: { color: colors.muted, textAlign: "center", marginTop: 16 },
  card: { flexDirection: "row", backgroundColor: colors.surfaceSecondary, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border, gap: 8 },
  cardInactive: { opacity: 0.6 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { color: colors.onSurface, fontWeight: "900", fontSize: 14, flex: 1 },
  pill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { fontSize: 9, fontWeight: "900" },
  cardText: { color: colors.onSurfaceSecondary, fontSize: 12, lineHeight: 17, marginTop: 5 },
  cardMeta: { color: colors.muted, fontSize: 10, marginTop: 6 },
  cardActions: { justifyContent: "center" },
  iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
}));
