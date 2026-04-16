import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { EventRow, getAllEvents } from "@/database/events";
import { useAuth } from "@/store/AuthContext";

const CATEGORIES = [
  "Tous",
  "Talk",
  "Workshop",
  "Club",
  "Exam",
  "Other",
] as const;

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return d.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function StudentIndex() {
  const insets = useSafeAreaInsets();
  const theme = Colors.light;
  const { logout } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<(typeof CATEGORIES)[number]>("Tous");
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

  const filteredEvents = useMemo(() => {
    const searchTerm = search.trim().toLocaleLowerCase();

    return events.filter((event) => {
      const matchesCategory =
        selectedCategory === "Tous" || event.category === selectedCategory;

      const matchesTitle =
        searchTerm.length === 0 ||
        event.title.trim().toLocaleLowerCase().includes(searchTerm);

      return matchesCategory && matchesTitle;
    });
  }, [events, search, selectedCategory]);

  const onLogout = useCallback(() => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  }, [logout]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Événements</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconButton}>
              <Ionicons
                name="notifications-outline"
                size={22}
                color={theme.text}
              />
            </Pressable>
            <Pressable onPress={onLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={20} color={theme.error} />
            </Pressable>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={18}
            color={theme.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher..."
            placeholderTextColor={theme.textMuted}
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}>
          {CATEGORIES.map((category) => {
            const selected = selectedCategory === category;
            return (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.categoryChip,
                  selected && styles.categoryChipSelected,
                ]}>
                <Text
                  style={[
                    styles.categoryText,
                    selected && styles.categoryTextSelected,
                  ]}>
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
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
      ) : filteredEvents.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={48} color={theme.border} />
          <Text style={styles.emptyText}>Aucun événement trouvé.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + Spacing.lg },
          ]}
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
              <View style={styles.eventCardHeader}>
                <Text style={styles.eventCategory}>{item.category}</Text>
                <Text style={styles.eventDate}>
                  {formatDateTime(item.startDateTime)}
                </Text>
              </View>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.eventFooter}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={theme.textMuted}
                />
                <Text style={styles.eventLocation} numberOfLines={1}>
                  {item.locationName}
                </Text>
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
    paddingBottom: Spacing.sm,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 52,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primaryLight,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.primaryLight,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    height: 40,
    marginBottom: Spacing.sm,
  },
  searchIcon: {
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
  },
  categoriesRow: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  categoryChipSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.textMuted,
  },
  categoryTextSelected: {
    color: "#FFFFFF",
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
  eventCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  eventCategory: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
  eventFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventLocation: {
    fontSize: 13,
    color: Colors.light.textMuted,
    fontWeight: "400",
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
    textAlign: "center",
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
