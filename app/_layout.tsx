import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { initDatabase, seedDatabaseIfEmpty } from "@/database/init";
import { AuthProvider } from "@/store/AuthContext";

export default function RootLayout() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await initDatabase();
        await seedDatabaseIfEmpty();
        if (!cancelled) setIsDbReady(true);
      } catch (err) {
        console.error("Database init/seed failed:", err);
        if (!cancelled)
          setDbError("Initialisation de la base de données impossible.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        {!isDbReady ? (
          <View style={styles.container}>
            <Text style={styles.text}>
              {dbError ?? "CampusEvents AI - Chargement..."}
            </Text>
          </View>
        ) : (
          <Stack screenOptions={{ headerShown: false }} />
        )}
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
