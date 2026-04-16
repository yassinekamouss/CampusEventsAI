import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
      return { bg: "#e8fff2", fg: "#0f7a3d", border: "#bff1d2" };
    case "Talk":
      return { bg: "#f1e9ff", fg: "#5b21b6", border: "#dccbff" };
    case "Club":
      return { bg: "#e8f4ff", fg: "#075985", border: "#cbe6ff" };
    default:
      return { bg: "#f3f4f6", fg: "#374151", border: "#e5e7eb" };
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
    router.replace("/");
  };

  const headerRight = useMemo(() => {
    return (
      <View style={styles.headerActions}>
        <Pressable
          onPress={onCreate}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}>
          <Text style={styles.primaryButtonText}>+ Créer</Text>
        </Pressable>
        <Pressable
          onPress={onLogout}
          style={({ pressed }) => [
            styles.ghostButton,
            pressed && styles.ghostButtonPressed,
          ]}>
          <Text style={styles.ghostButtonText}>Déconnexion</Text>
        </Pressable>
      </View>
    );
  }, [onCreate, onLogout]);

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

                <Text style={styles.meta} numberOfLines={2}>
                  {formatDateTime(item.startDateTime)}
                  {"  •  "}
                  {item.locationName}
                </Text>

                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() => onEdit(item.id)}
                    style={({ pressed }) => [
                      styles.smallButton,
                      pressed && styles.smallButtonPressed,
                    ]}>
                    <Text style={styles.smallButtonText}>Modifier</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => onDelete(item.id)}
                    style={({ pressed }) => [
                      styles.smallButton,
                      styles.dangerButton,
                      pressed && styles.smallButtonPressed,
                    ]}>
                    <Text style={[styles.smallButtonText, styles.dangerText]}>
                      Supprimer
                    </Text>
                  </Pressable>
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
    backgroundColor: "#f3f5f9",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#f3f5f9",
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
    color: "#0b1220",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    color: "#4b5563",
  },
  listContent: {
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e6e9f0",
    shadowColor: "#0b1220",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
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
    fontWeight: "800",
    color: "#0b1220",
  },
  meta: {
    marginTop: 8,
    fontSize: 13,
    color: "#374151",
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dbe2ee",
    backgroundColor: "#f6f7fb",
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButton: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
  },
  smallButtonPressed: {
    opacity: 0.9,
  },
  smallButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0b1220",
  },
  dangerText: {
    color: "#b91c1c",
  },
  primaryButton: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#0056b3",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonLarge: {
    marginTop: 14,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#0056b3",
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbe2ee",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  ghostButtonPressed: {
    opacity: 0.9,
  },
  ghostButtonText: {
    color: "#111827",
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
    color: "#0b1220",
    textAlign: "center",
  },
  muted: {
    fontSize: 13,
    color: "#4b5563",
    textAlign: "center",
  },
  error: {
    fontSize: 13,
    color: "#b91c1c",
    textAlign: "center",
  },
  retryButton: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbe2ee",
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
