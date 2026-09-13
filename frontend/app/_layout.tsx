import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox } from "react-native";
import { AnimatedSplash } from "@/src/components/animated-splash";
import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";
import { AppProvider } from "@/src/store/app-store";

LogBox.ignoreAllLogs(true);

export default function RootLayout() {
  return <ErrorBoundary><QueryClientProvider client={queryClient}><AppProvider><StatusBar style="light" /><AnimatedSplash><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0A0A0A" } }} /></AnimatedSplash></AppProvider></QueryClientProvider></ErrorBoundary>;
}
