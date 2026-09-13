import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "@/src/store/app-store";
import { makeStyles, useTheme } from "@/src/theme";
import { translate } from "@/src/i18n";
import type { MenuItem } from "@/src/types";

export function QuantityStepper({ quantity, onChange }: { quantity: number; onChange: (value: number) => void }) {
  const { colors } = useTheme();
  return <View style={[styles.stepper, { borderColor: colors.borderStrong }]}>
    <Pressable accessibilityRole="button" accessibilityLabel="Decrease quantity" onPress={() => onChange(quantity - 1)} style={styles.stepButton}><Ionicons name="remove" size={17} color={colors.brandPrimary} /></Pressable>
    <Text style={[styles.stepText, { color: colors.onSurface }]}>{quantity}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Increase quantity" onPress={() => onChange(quantity + 1)} style={styles.stepButton}><Ionicons name="add" size={17} color={colors.brandPrimary} /></Pressable>
  </View>;
}

export function FoodCard({ item, compact = false }: { item: MenuItem; compact?: boolean }) {
  const router = useRouter();
  const { addToCart, language, selectedBranch } = useApp();
  const { colors } = useTheme();
  const styles = useStyles();
  const unavailable = Boolean(item.soldOut || !selectedBranch?.isActive || selectedBranch.isComingSoon);
  return <View style={[styles.card, compact && styles.compactCard]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${item.name}, ₹${item.price}`} onPress={() => router.push(`/product/${item.id}`)} style={({ pressed }) => [pressed && styles.pressed]}>
      <Image source={{ uri: item.image }} style={styles.foodImage} accessibilityIgnoresInvertColors />
      <View style={styles.cardBody}><Text style={styles.itemName} numberOfLines={1}>{item.name}</Text><Text style={styles.itemDescription} numberOfLines={1}>{item.description}</Text></View>
    </Pressable>
    <View style={styles.cardFooter}><Text style={styles.price}>₹{item.price}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Add ${item.name}`} disabled={unavailable} onPress={() => addToCart(item)} style={[styles.addButton, unavailable && styles.soldButton]}><Text style={[styles.addText, unavailable && { color: colors.muted }]}>{item.soldOut ? translate(language, "soldOut") : unavailable ? "Coming soon" : `+ ${translate(language, "add")}`}</Text></Pressable></View>
  </View>;
}

export function ScreenTitle({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: React.ReactNode }) {
  const styles = useStyles();
  return <View style={styles.titleRow}><View>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}<Text style={styles.title}>{title}</Text></View>{right}</View>;
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: 20, overflow: "hidden", width: "48.2%", marginBottom: 14, borderWidth: 1, borderColor: colors.border, paddingBottom: 10 },
  compactCard: { width: 180 }, pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] }, foodImage: { width: "100%", height: 122, backgroundColor: colors.brandTertiary }, cardBody: { padding: 12 }, itemName: { color: colors.onSurface, fontSize: 15, fontWeight: "800" }, itemDescription: { color: colors.muted, fontSize: 11, marginTop: 4 }, cardFooter: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 3, paddingHorizontal: 12 }, price: { color: colors.brandPrimary, fontSize: 16, fontWeight: "800" }, addButton: { minHeight: 34, paddingHorizontal: 10, borderRadius: 9, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" }, soldButton: { backgroundColor: colors.surfaceTertiary }, addText: { color: colors.onBrandPrimary, fontSize: 11, fontWeight: "800" }, soldText: { color: colors.muted }, titleRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }, eyebrow: { color: colors.brandPrimary, fontSize: 12, fontWeight: "800", letterSpacing: 1 }, title: { color: colors.onSurface, fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
}));

const styles = StyleSheet.create({ stepper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, minHeight: 40 }, stepButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" }, stepText: { minWidth: 22, textAlign: "center", fontSize: 15, fontWeight: "800" } });