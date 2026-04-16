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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { deleteEvent, EventRow, getAllEvents } from "@/database/events";
import { useAuth } from "@/store/AuthContext";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";

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

export default function AdminIndex() {
  const insets = useSafeAreaInsets();
  const theme = Colors.light;
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

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onCreate = () => router.push("/(admin)/create");
  const onEdit = (id: string) => router.push({ pathname: "/(admin)/create", params: { id } });

  const onDelete = (id: string) => {
    Alert.alert("Supprimer ?", "Cette action est irréversible.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteEvent(id);
            await load();
          } catch (e) {
            Alert.alert("Erreur", "Suppression impossible.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Gestion Campus</Text>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onCreate} style={styles.createButton}>
            <Ionicons name="add" size={20} color="#FFF" />
            <Text style={styles.createButtonText}>Nouvel événement</Text>
          </TouchableOpacity>
        </View>
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
          <Ionicons name="calendar-outline" size={48} color={theme.border} />
          <Text style={styles.emptyText}>Aucun événement à gérer.</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing.lg }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.adminCard}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardCategory}>{item.category}</Text>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardMeta}>{formatDateTime(item.startDateTime)} • {item.locationName}</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => onEdit(item.id)} style={styles.actionButton}>
                  <Ionicons name="pencil-outline" size={18} color={theme.accent} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.actionButton}>
                  <Ionicons name="trash-outline" size={18} color={theme.error} />
                </TouchableOpacity>
              </View>
            </View>
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
    paddingBottom: Spacing.sm,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 52,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.light.primaryLight,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.error,
  },
  headerActions: {
    paddingBottom: Spacing.md,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.light.primary,
    height: 44,
    borderRadius: BorderRadius.sm,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  adminCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  cardCategory: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.textMuted,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 13,
    color: Colors.light.textMuted,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.light.primaryLight,
    alignItems: "center",
    justifyContent: "center",
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
  },
});
