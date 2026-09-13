import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { makeStyles } from "@/src/theme";

const logo = require("../../assets/images/logo.png");

export function AnimatedSplash({ children }: { children: React.ReactNode }) {
  const styles = useStyles();
  const [done, setDone] = React.useState(false);
  const scale = useSharedValue(0.6);
  const glow = useSharedValue(0);
  const fade = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.back(1.4)) });
    glow.value = withDelay(300, withRepeat(withSequence(withTiming(1, { duration: 550 }), withTiming(0.35, { duration: 550 })), 2, false));
    fade.value = withDelay(2100, withTiming(0, { duration: 400 }, (finished) => { if (finished) runOnJS(setDone)(true); }));
  }, [fade, glow, scale]);

  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.18 + glow.value * 0.32, transform: [{ scale: 0.9 + glow.value * 0.3 }] }));
  const glowOuterStyle = useAnimatedStyle(() => ({ opacity: 0.08 + glow.value * 0.14, transform: [{ scale: 1 + glow.value * 0.45 }] }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  return <View style={styles.fill}>{children}{done ? null : <Animated.View pointerEvents="none" style={[styles.overlay, overlayStyle]}><Animated.View style={[styles.glowOuter, glowOuterStyle]} /><Animated.View style={[styles.glow, glowStyle]} /><Animated.Image source={logo} resizeMode="contain" style={[styles.logo, logoStyle]} /></Animated.View>}</View>;
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  fill: { flex: 1 },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", zIndex: 999 },
  glow: { position: "absolute", width: 250, height: 250, borderRadius: 125, backgroundColor: colors.brandPrimary },
  glowOuter: { position: "absolute", width: 320, height: 320, borderRadius: 160, backgroundColor: colors.brandPrimary },
  logo: { width: 230, height: 230 },
}));
