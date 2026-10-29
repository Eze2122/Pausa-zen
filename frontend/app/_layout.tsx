import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, LogBox, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { QueryClientProvider } from "@tanstack/react-query";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";
import { GameProvider, useGame } from "@/src/core/state";
import { themes } from "@/src/theme";

const colors = themes.light;

LogBox.ignoreAllLogs(true);

function Gate() {
  const { loaded } = useGame();
  if (!loaded) return <View style={[styles.root, styles.center, { backgroundColor: colors.surface }]}><ActivityIndicator color={colors.brandPrimary} size="large" /></View>;
  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right", contentStyle: { backgroundColor: colors.surface } }} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Fredoka-Bold": require("../assets/fonts/Fredoka-Bold.ttf"),
    "Fredoka-SemiBold": require("../assets/fonts/Fredoka-SemiBold.ttf"),
    "Nunito-SemiBold": require("../assets/fonts/Nunito-SemiBold.ttf"),
    "Nunito-ExtraBold": require("../assets/fonts/Nunito-ExtraBold.ttf"),
  });
  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <KeyboardProvider>
            <StatusBar style="dark" />
            {fontsLoaded ? (
              <GameProvider><Gate /></GameProvider>
            ) : (
              <View style={[styles.root, { backgroundColor: colors.surface }]} />
            )}
          </KeyboardProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 }, center: { alignItems: "center", justifyContent: "center" } });
