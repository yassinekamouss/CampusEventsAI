import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EventRow } from "@/database/events";
import { getRegistrations } from "@/database/registrations";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";

const STUDENT_USER_ID = "etudiant@campus.ma";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RegistrationsScreen() {
  const insets = useSafeAreaInsets();
  const theme = Colors.light;
  const [events, setEvents] = useState<EventRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const rows = await getRegistrations(STUDENT_USER_ID);
      setEvents(rows);
    } catch (e) {
      console.error("Failed to load registrations:", e);
      setError("Impossible de charger les inscriptions.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Inscriptions</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={load} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </Pressable>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="ticket-outline" size={48} color={theme.border} />
          <Text style={styles.emptyText}>Aucune inscription active.</Text>
          <Pressable onPress={() => router.push("/(student)")} style={styles.exploreButton}>
            <Text style={styles.exploreButtonText}>Explorer le catalogue</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing.lg }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(student)/event/[id]",
                  params: { id: item.id },
                })
              }
              style={({ pressed }) => [
                styles.eventCard,
                pressed && styles.eventCardPressed,
              ]}>
              <View style={styles.cardHeader}>
                <View style={styles.statusRow}>
                  <Ionicons name="checkmark-circle" size={14} color={theme.success} />
                  <Text style={styles.statusText}>Inscrit</Text>
                </View>
                <Text style={styles.eventDate}>{formatDateTime(item.startDateTime)}</Text>
              </View>
              <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
              <View style={styles.cardFooter}>
                <Ionicons name="location-outline" size={14} color={theme.textMuted} />
                <Text style={styles.eventLocation} numberOfLines={1}>{item.locationName}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 52,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  eventCard: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  eventCardPressed: {
    backgroundColor: Colors.light.primaryLight,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.success,
    textTransform: "uppercase",
  },
  eventDate: {
    fontSize: 12,
    color: Colors.light.textMuted,
    fontWeight: "500",
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.text,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventLocation: {
    fontSize: 13,
    color: Colors.light.textMuted,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: 14,
    color: Colors.light.error,
    marginBottom: Spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 15,
    color: Colors.light.textMuted,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  exploreButton: {
    borderWidth: 1,
    borderColor: Colors.light.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  exploreButtonText: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
});
