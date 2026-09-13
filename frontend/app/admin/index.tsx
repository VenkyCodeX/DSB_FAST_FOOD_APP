import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/src/api/client";
import { makeStyles, useTheme } from "@/src/theme";

export default function AdminLoginScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets(); const styles = useStyles(); const { colors } = useTheme();
  const [pin, setPin] = React.useState(""); const [loading, setLoading] = React.useState(false); const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => { void api.admin.hasSession().then((ok) => { if (ok) router.replace("/admin/orders"); }); }, [router]);
  const submit = async () => { if (pin.trim().length < 4) { setError("Enter the admin PIN."); return; } setLoading(true); setError(null); try { await api.admin.login(pin.trim()); router.replace("/admin/orders"); } catch (value) { setError(value instanceof Error ? value.message : "Could not sign in."); } finally { setLoading(false); } };
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.root}><View style={[styles.content, { paddingTop: insets.top + 18 }]}>
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/profile"))} style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.onSurface} /></Pressable>
    <Image source={require("../../assets/images/logo.png")} style={styles.logo} resizeMode="contain" />
    <Text style={styles.eyebrow}>RESTAURANT ADMIN</Text><Text style={styles.title}>Kitchen panel</Text><Text style={styles.subtitle}>Manage incoming orders, sold-out items and updates.</Text>
    <Text style={styles.label}>Admin PIN</Text>
    <TextInput testID="admin-pin-input" value={pin} onChangeText={setPin} secureTextEntry keyboardType="default" autoCapitalize="none" placeholder="Enter PIN" placeholderTextColor={colors.muted} style={styles.input} onSubmitEditing={() => void submit()} />
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Pressable testID="admin-login-button" onPress={() => void submit()} disabled={loading} style={[styles.primary, loading && { opacity: 0.6 }]}>{loading ? <ActivityIndicator color={colors.onBrandPrimary} /> : <><Ionicons name="lock-open-outline" size={18} color={colors.onBrandPrimary} /><Text style={styles.primaryText}>Open admin panel</Text></>}</Pressable>
  </View></KeyboardAvoidingView>;
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { flex: 1, paddingHorizontal: 22 },
  back: { width: 44, height: 44, justifyContent: "center" },
  logo: { width: 110, height: 110, marginTop: 20 },
  eyebrow: { color: colors.brandPrimary, fontWeight: "900", fontSize: 11, letterSpacing: 1, marginTop: 26 },
  title: { color: colors.onSurface, fontSize: 30, fontWeight: "900", marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 30 },
  label: { color: colors.onSurfaceSecondary, fontWeight: "800", fontSize: 12, marginBottom: 8 },
  input: { height: 54, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surfaceSecondary, paddingHorizontal: 15, color: colors.onSurface, fontSize: 18, letterSpacing: 4 },
  error: { color: colors.error, marginTop: 10, fontSize: 12 },
  primary: { marginTop: 22, minHeight: 54, borderRadius: 15, backgroundColor: colors.brandPrimary, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10 },
  primaryText: { color: colors.onBrandPrimary, fontWeight: "900", fontSize: 15 },
}));
