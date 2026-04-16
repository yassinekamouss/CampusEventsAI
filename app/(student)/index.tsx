import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EventRow, getAllEvents } from "@/database/events";

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

export default function StudentIndex() {
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
        event.title.trim().toLocaleLowerCase() === searchTerm;

      return matchesCategory && matchesTitle;
    });
  }, [events, search, selectedCategory]);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>Catalogue des événements</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Recherche exacte du titre"
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}>
          {CATEGORIES.map((category) => {
            const selected = selectedCategory === category;
            return (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={({ pressed }) => [
                  styles.chip,
                  selected && styles.chipSelected,
                  pressed && styles.chipPressed,
                ]}>
                <Text
                  style={[
                    styles.chipLabel,
                    selected && styles.chipLabelSelected,
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
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      ) : filteredEvents.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Aucun événement</Text>
          <Text style={styles.muted}>Aucun résultat pour ce filtre.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const badge = categoryColors(item.category);
            return (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(student)/event/[id]",
                    params: { id: item.id },
                  })
                }
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed,
                ]}>
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

                <Text style={styles.linkLabel}>Voir les détails</Text>
              </Pressable>
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
  headerBlock: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: "#F1F5F9",
    fontSize: 14,
    color: "#0F172A",
  },
  chipsRow: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#DBEAFE",
  },
  chipPressed: {
    opacity: 0.8,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  chipLabelSelected: {
    color: "#2563EB",
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
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.9,
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
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  meta: {
    fontSize: 13,
    color: "#64748B",
    flex: 1,
  },
  linkLabel: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
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
  retryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
});
