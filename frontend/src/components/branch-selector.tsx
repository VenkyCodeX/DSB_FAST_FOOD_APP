import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import React from "react";
import { isBranchOpen } from "@/src/data/branches";
import { useApp } from "@/src/store/app-store";
import { makeStyles, useTheme } from "@/src/theme";
import type { Branch } from "@/src/types";

export function BranchSelector({ required = false }: { required?: boolean }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { branches, selectedBranch, selectedBranchId, cart, changeBranch } = useApp();
  const [expanded, setExpanded] = React.useState(required || !selectedBranch);

  const select = (branch: Branch) => {
    if (branch.id === selectedBranchId) { setExpanded(false); return; }
    const commit = () => {
      if (!changeBranch(branch.id, true)) return;
      setExpanded(false);
      if (branch.isComingSoon) Alert.alert("Deglur is coming soon! 🎉", "We'll be opening this branch on Diwali 2026.");
    };
    if (cart.length > 0) Alert.alert("Change branch?", "Your current cart may contain items from the previous branch.", [{ text: "Cancel", style: "cancel" }, { text: "Change branch", style: "destructive", onPress: commit }]);
    else commit();
  };

  if (selectedBranch && !expanded) return <Pressable accessibilityRole="button" accessibilityLabel="Change branch" onPress={() => setExpanded(true)} style={({ pressed }) => [styles.selected, pressed && styles.pressed]}><View style={styles.pin}><Ionicons name="location" size={18} color={colors.brandPrimary} /></View><View style={styles.selectedCopy}><Text style={styles.selectedLabel}>ORDERING FROM</Text><Text style={styles.selectedName}>{selectedBranch.name}</Text><Text style={styles.selectedAddress}>{selectedBranch.address}</Text></View><View style={styles.change}><Text style={styles.changeText}>Change</Text><Ionicons name="chevron-forward" size={16} color={colors.brandPrimary} /></View></Pressable>;

  return <View><View style={styles.headingRow}><View><Text style={styles.eyebrow}>{required ? "WELCOME TO DSB" : "YOUR LOCATION"}</Text><Text style={styles.title}>Choose your branch</Text></View>{selectedBranch ? <Pressable onPress={() => setExpanded(false)} style={styles.close}><Ionicons name="close" size={20} color={colors.muted} /></Pressable> : null}</View><View style={styles.list}>{branches.map((branch) => { const comingSoon = branch.isComingSoon; const open = isBranchOpen(branch); return <Pressable key={branch.id} accessibilityRole="button" accessibilityLabel={`Select ${branch.name}`} onPress={() => select(branch)} style={({ pressed }) => [styles.branchCard, branch.id === selectedBranchId && styles.activeCard, pressed && styles.pressed]}><View style={[styles.branchIcon, { backgroundColor: comingSoon ? colors.surfaceTertiary : colors.brandTertiary }]}><Ionicons name={comingSoon ? "time-outline" : "location"} size={21} color={comingSoon ? colors.muted : colors.brandPrimary} /></View><View style={styles.branchCopy}><Text style={styles.branchName}>{branch.name}</Text><Text style={styles.branchAddress}>{branch.address}</Text><View style={styles.statusRow}><View style={[styles.statusDot, { backgroundColor: comingSoon ? colors.warning : open ? colors.success : colors.error }]} /><Text style={[styles.statusText, { color: comingSoon ? colors.warning : open ? colors.success : colors.error }]}>{comingSoon ? "COMING SOON" : open ? "OPEN NOW" : "CLOSED NOW"}</Text>{comingSoon ? <Text style={styles.opening}> · Opening on {branch.openingDate}</Text> : null}</View></View><Ionicons name={branch.id === selectedBranchId ? "checkmark-circle" : "chevron-forward"} size={20} color={branch.id === selectedBranchId ? colors.success : colors.muted} /></Pressable>; })}</View></View>;
}

const useStyles = makeStyles((colors) => StyleSheet.create({ selected: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 17, padding: 12, borderWidth: 1, borderColor: colors.border }, pin: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }, selectedCopy: { flex: 1, marginLeft: 10 }, selectedLabel: { color: colors.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }, selectedName: { color: colors.onSurface, fontWeight: "900", fontSize: 13, marginTop: 3 }, selectedAddress: { color: colors.muted, fontSize: 11, marginTop: 3 }, change: { flexDirection: "row", alignItems: "center", gap: 3 }, changeText: { color: colors.brandPrimary, fontSize: 11, fontWeight: "900" }, headingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 }, eyebrow: { color: colors.brandPrimary, fontSize: 11, fontWeight: "900", letterSpacing: 1 }, title: { color: colors.onSurface, fontSize: 27, fontWeight: "900", marginTop: 6 }, close: { width: 40, height: 40, alignItems: "center", justifyContent: "center" }, list: { gap: 12 }, branchCard: { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: colors.surfaceSecondary, borderRadius: 18, borderWidth: 1, borderColor: colors.border }, activeCard: { borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary }, branchIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" }, branchCopy: { flex: 1, marginLeft: 11 }, branchName: { color: colors.onSurface, fontWeight: "900", fontSize: 14 }, branchAddress: { color: colors.muted, fontSize: 12, marginTop: 4 }, statusRow: { flexDirection: "row", alignItems: "center", marginTop: 8, flexWrap: "wrap" }, statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 }, statusText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }, opening: { color: colors.warning, fontSize: 10, fontWeight: "700" }, pressed: { opacity: 0.78 } }));