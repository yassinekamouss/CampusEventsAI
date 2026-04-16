import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { deleteEvent, EventRow, getAllEvents } from "@/database/events";
import { useAuth } from "@/store/AuthContext";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return d.toLocaleString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function categoryColors(category: string) {
  switch (category) {
    case "Workshop":
      return { bg: "#DBEAFE", fg: "#2563EB", border: "#BFDBFE" };
    case "Talk":
      return { bg: "#DBEAFE", fg: "#2563EB", border: "#BFDBFE" };
    case "Club":
      return { bg: "#DBEAFE", fg: "#2563EB", border: "#BFDBFE" };
    default:
      return { bg: "#EFF6FF", fg: "#2563EB", border: "#DBEAFE" };
  }
}

export default function AdminIndex() {
  const { logout } = useAuth();

  const [events, setEvents] = useState<EventRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const rows = await getAllEvents();
      setEvents(rows);
    } catch (e) {
      console.error("Failed to load events:", e);
      setError("Impossible de charger les événements.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onCreate = () => {
    router.push("/(admin)/create");
  };

  const onEdit = (id: string) => {
    router.push({ pathname: "/(admin)/create", params: { id } });
  };

  const onDelete = (id: string) => {
    Alert.alert("Supprimer l'événement ?", "Cette action est irréversible.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteEvent(id);
            await load();
          } catch (e) {
            console.error("Delete failed:", e);
            Alert.alert("Erreur", "Suppression impossible.");
          }
        },
      },
    ]);
  };

  const onLogout = async () => {
    await logout();
  };

  const headerRight = (
    <View style={styles.headerActions}>
      <TouchableOpacity
        onPress={onCreate}
        activeOpacity={0.85}
        style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>+ Créer</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onLogout}
        activeOpacity={0.85}
        style={styles.ghostButton}>
        <Text style={styles.ghostButtonText}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Admin</Text>
          <Text style={styles.subtitle}>Gestion des événements</Text>
        </View>
        {headerRight}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Chargement…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable
            onPress={load}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.retryButtonPressed,
            ]}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </Pressable>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Aucun événement</Text>
          <Text style={styles.muted}>
            Créez votre premier événement pour le rendre visible aux étudiants.
          </Text>
          <Pressable
            onPress={onCreate}
            style={({ pressed }) => [
              styles.primaryButtonLarge,
              pressed && styles.primaryButtonPressed,
            ]}>
            <Text style={styles.primaryButtonText}>+ Créer un événement</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const badge = categoryColors(item.category);
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>

                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: badge.bg,
                        borderColor: badge.border,
                      },
                    ]}>
                    <Text style={[styles.badgeText, { color: badge.fg }]}>
                      {item.category}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={15} color="#64748B" />
                  <Text style={styles.meta} numberOfLines={1}>
                    {formatDateTime(item.startDateTime)}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={15} color="#64748B" />
                  <Text style={styles.meta} numberOfLines={1}>
                    {item.locationName}
                  </Text>
                </View>

                <View style={styles.rowActions}>
                  <TouchableOpacity
                    onPress={() => onEdit(item.id)}
                    activeOpacity={0.85}
                    style={styles.smallButton}>
                    <Ionicons name="create-outline" size={22} color="#2563EB" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => onDelete(item.id)}
                    activeOpacity={0.85}
                    style={[styles.smallButton, styles.dangerButton]}>
                    <Ionicons name="trash-outline" size={22} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerLeft: {
    gap: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
  },
  listContent: {
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  metaRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  meta: {
    fontSize: 13,
    color: "#64748B",
    flex: 1,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  rowActions: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },
  smallButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButton: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  primaryButton: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonLarge: {
    marginTop: 14,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonPressed: {
    opacity: 0.92,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  ghostButton: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  ghostButtonText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  muted: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },
  error: {
    fontSize: 13,
    color: "#EF4444",
    textAlign: "center",
  },
  retryButton: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonPressed: {
    opacity: 0.9,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
});
