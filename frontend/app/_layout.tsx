import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { LogBox } from "react-native";
import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";
import { AppProvider } from "@/src/store/app-store";

LogBox.ignoreAllLogs(true);

export default function RootLayout() {
  return <ErrorBoundary><QueryClientProvider client={queryClient}><AppProvider><Stack screenOptions={{ headerShown: false }} /></AppProvider></QueryClientProvider></ErrorBoundary>;
}