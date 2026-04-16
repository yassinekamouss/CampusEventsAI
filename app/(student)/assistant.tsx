import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EventRow, getAllEvents } from "@/database/events";
import { useAiAssistant } from "@/hooks/useAiAssistant";
import { AiActionType } from "@/services/llm";

const ACTIONS: {
  key: AiActionType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "search", label: "Recherche NL", icon: "search-outline" },
  {
    key: "recommendation",
    label: "Recommandation",
    icon: "sparkles-outline",
  },
  { key: "planning", label: "Planning", icon: "calendar-outline" },
  { key: "qa", label: "Q/R", icon: "help-circle-outline" },
];

function parseEventTags(tags: string | null) {
  if (!tags) return [] as string[];
  try {
    const parsed = JSON.parse(tags) as unknown;
    if (!Array.isArray(parsed)) return [] as string[];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [] as string[];
  }
}

function formatDate(iso: string) {
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

function collectEventIds(payload: unknown): string[] {
  const ids = new Set<string>();

  const walk = (value: unknown) => {
    if (!value || typeof value !== "object") return;

    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }

    const record = value as Record<string, unknown>;

    if (typeof record.eventId === "string" && record.eventId.trim()) {
      ids.add(record.eventId);
    }

    if (Array.isArray(record.relatedEventIds)) {
      for (const candidate of record.relatedEventIds) {
        if (typeof candidate === "string" && candidate.trim())
          ids.add(candidate);
      }
    }

    Object.values(record).forEach(walk);
  };

  walk(payload);
  return Array.from(ids);
}

function isEmptyResult(payload: unknown) {
  if (payload === null || payload === undefined) return true;
  if (Array.isArray(payload)) return payload.length === 0;
  if (typeof payload === "object") {
    return Object.keys(payload as Record<string, unknown>).length === 0;
  }
  if (typeof payload === "string") return payload.trim().length === 0;
  return false;
}

export default function AssistantScreen() {
  const [actionType, setActionType] = useState<AiActionType>("search");
  const [query, setQuery] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [eventsById, setEventsById] = useState<Record<string, EventRow>>({});

  const { executeAction, isLoading, error, data } = useAiAssistant();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const events = await getAllEvents();
        if (cancelled) return;

        const nextMap: Record<string, EventRow> = {};
        for (const item of events) nextMap[item.id] = item;
        setEventsById(nextMap);
      } catch (e) {
        console.error("Failed to load events for assistant mapping:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const matchedEvents = useMemo(() => {
    const ids = collectEventIds(data);
    return ids
      .map((eventId) => eventsById[eventId])
      .filter((event): event is EventRow => !!event);
  }, [data, eventsById]);

  const showEmpty = hasSubmitted && !isLoading && !error && isEmptyResult(data);

  const onSubmit = async () => {
    setHasSubmitted(true);
    await executeAction(actionType, query);
  };

  const onRetry = async () => {
    await executeAction(actionType, query);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="sparkles" size={18} color="#2563EB" />
          </View>
          <Text style={styles.title}>Assistant IA</Text>
          <Text style={styles.subtitle}>
            Trouvez des événements via langage naturel, recommandations,
            planning et questions/réponses.
          </Text>

          <View style={styles.actionsWrap}>
            {ACTIONS.map((action) => {
              const selected = actionType === action.key;
              return (
                <Pressable
                  key={action.key}
                  onPress={() => setActionType(action.key)}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    styles.actionButton,
                    selected && styles.actionButtonSelected,
                    pressed && styles.actionButtonPressed,
                    isLoading && styles.actionButtonDisabled,
                  ]}>
                  <Ionicons
                    name={action.icon}
                    size={15}
                    color={selected ? "#1D4ED8" : "#475569"}
                  />
                  <Text
                    style={[
                      styles.actionText,
                      selected && styles.actionTextSelected,
                    ]}>
                    {action.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={query}
            onChangeText={setQuery}
            editable={!isLoading}
            placeholder="Ex: Je cherche un workshop mobile la semaine prochaine"
            placeholderTextColor="#94A3B8"
            style={styles.input}
            multiline
          />

          <Pressable
            onPress={onSubmit}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.submitButtonPressed,
              isLoading && styles.submitButtonDisabled,
            ]}>
            <Ionicons name="send-outline" size={16} color="#FFFFFF" />
            <Text style={styles.submitText}>Exécuter</Text>
          </Pressable>

          {isLoading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator />
              <Text style={styles.muted}>Analyse en cours...</Text>
            </View>
          ) : null}

          {!isLoading && error ? (
            <View style={styles.stateBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={onRetry} style={styles.retryButton}>
                <Text style={styles.retryText}>Réessayer</Text>
              </Pressable>
            </View>
          ) : null}

          {showEmpty ? (
            <View style={styles.stateBox}>
              <Text style={styles.muted}>Aucun résultat</Text>
            </View>
          ) : null}

          {!isLoading && !error && hasSubmitted && !showEmpty && data ? (
            <View style={styles.resultWrap}>
              {matchedEvents.length > 0 ? (
                <View style={styles.eventsWrap}>
                  <Text style={styles.sectionTitle}>Événements suggérés</Text>
                  {matchedEvents.map((event) => {
                    const tags = parseEventTags(event.tags);
                    return (
                      <View key={event.id} style={styles.eventCard}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <Text style={styles.eventMeta}>
                          {event.category} - {formatDate(event.startDateTime)}
                        </Text>
                        {tags.length > 0 ? (
                          <Text style={styles.eventTags}>
                            {tags
                              .slice(0, 4)
                              .map((tag) => `#${tag}`)
                              .join(" ")}
                          </Text>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ) : null}

              <View style={styles.jsonBox}>
                <Text style={styles.sectionTitle}>Réponse JSON</Text>
                <Text style={styles.jsonText}>
                  {JSON.stringify(data, null, 2)}
                </Text>
              </View>
            </View>
          ) : null}

          <Text style={styles.securityText}>
            ⚠️ Ne soumettez pas de données personnelles ou sensibles à
            l&apos;assistant IA.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    gap: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 3,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 21,
  },
  actionsWrap: {
    marginTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionButtonSelected: {
    borderColor: "#93C5FD",
    backgroundColor: "#DBEAFE",
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  actionTextSelected: {
    color: "#1D4ED8",
  },
  input: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
    fontSize: 14,
    color: "#0F172A",
    textAlignVertical: "top",
  },
  submitButton: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1D4ED8",
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  submitButtonPressed: {
    opacity: 0.9,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
  stateBox: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    padding: 12,
    gap: 8,
    alignItems: "flex-start",
  },
  muted: {
    fontSize: 13,
    color: "#64748B",
  },
  errorText: {
    fontSize: 13,
    color: "#DC2626",
    lineHeight: 18,
  },
  retryButton: {
    height: 34,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  retryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  resultWrap: {
    gap: 12,
  },
  eventsWrap: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    textTransform: "uppercase",
  },
  eventCard: {
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    padding: 12,
    gap: 5,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  eventMeta: {
    fontSize: 12,
    color: "#334155",
  },
  eventTags: {
    fontSize: 12,
    color: "#1D4ED8",
  },
  jsonBox: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    padding: 12,
    gap: 8,
  },
  jsonText: {
    fontSize: 12,
    color: "#0F172A",
    fontFamily: "monospace",
    lineHeight: 18,
  },
  securityText: {
    marginTop: 4,
    fontSize: 12,
    color: "#B45309",
    lineHeight: 18,
  },
});
