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
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EventRow, getAllEvents } from "@/database/events";
import { useAiAssistant } from "@/hooks/useAiAssistant";
import { AiActionType } from "@/services/llm";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";

const ACTIONS: {
  key: AiActionType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "search", label: "Recherche", icon: "search-outline" },
  { key: "recommendation", label: "Conseil", icon: "sparkles-outline" },
  { key: "planning", label: "Planning", icon: "calendar-outline" },
  { key: "qa", label: "Aide", icon: "help-circle-outline" },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
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
    if (typeof record.eventId === "string" && record.eventId.trim()) ids.add(record.eventId);
    if (Array.isArray(record.relatedEventIds)) {
      for (const candidate of record.relatedEventIds) {
        if (typeof candidate === "string" && candidate.trim()) ids.add(candidate);
      }
    }
    Object.values(record).forEach(walk);
  };
  walk(payload);
  return Array.from(ids);
}

export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const theme = Colors.light;
  const [actionType, setActionType] = useState<AiActionType>("search");
  const [query, setQuery] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [eventsById, setEventsById] = useState<Record<string, EventRow>>({});

  const { executeAction, isLoading, error, data } = useAiAssistant();

  useEffect(() => {
    (async () => {
      try {
        const events = await getAllEvents();
        const nextMap: Record<string, EventRow> = {};
        for (const item of events) nextMap[item.id] = item;
        setEventsById(nextMap);
      } catch (e) {
        console.error("Failed to load events for assistant mapping:", e);
      }
    })();
  }, []);

  const matchedEvents = useMemo(() => {
    const ids = collectEventIds(data);
    return ids.map((id) => eventsById[id]).filter((e): e is EventRow => !!e);
  }, [data, eventsById]);

  const onSubmit = async () => {
    if (!query.trim()) return;
    setHasSubmitted(true);
    await executeAction(actionType, query);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Assistant IA</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.intro}>
            <Text style={styles.introTitle}>Comment puis-je vous aider ?</Text>
            <Text style={styles.introSubtitle}>Utilisez le langage naturel pour trouver des événements.</Text>
          </View>

          <View style={styles.modesRow}>
            {ACTIONS.map((action) => {
              const selected = actionType === action.key;
              return (
                <Pressable
                  key={action.key}
                  onPress={() => setActionType(action.key)}
                  style={[styles.modeChip, selected && styles.modeChipSelected]}
                >
                  <Ionicons name={action.icon} size={16} color={selected ? "#FFF" : theme.text} />
                  <Text style={[styles.modeText, selected && styles.modeTextSelected]}>{action.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {isLoading && (
            <View style={styles.stateBox}>
              <ActivityIndicator color={theme.primary} />
              <Text style={styles.stateText}>Traitement en cours...</Text>
            </View>
          )}

          {!isLoading && error && (
            <View style={[styles.stateBox, styles.errorBox]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!isLoading && hasSubmitted && matchedEvents.length > 0 && (
            <View style={styles.results}>
              <Text style={styles.sectionTitle}>Suggestions</Text>
              {matchedEvents.map((event) => (
                <View key={event.id} style={styles.eventResult}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventMeta}>{event.category} • {formatDate(event.startDateTime)}</Text>
                </View>
              ))}
            </View>
          )}

          {!isLoading && hasSubmitted && matchedEvents.length === 0 && !error && (
            <View style={styles.stateBox}>
              <Text style={styles.stateText}>Aucun événement trouvé pour cette demande.</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + Spacing.md }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Décrivez votre besoin..."
              placeholderTextColor={theme.textMuted}
              style={styles.input}
              multiline
              maxLength={200}
            />
            <TouchableOpacity 
              onPress={onSubmit} 
              disabled={isLoading || !query.trim()}
              style={[styles.sendButton, (!query.trim() || isLoading) && styles.sendButtonDisabled]}
            >
              <Ionicons name="arrow-up" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  scrollContent: {
    padding: Spacing.md,
  },
  intro: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.light.text,
  },
  introSubtitle: {
    fontSize: 15,
    color: Colors.light.textMuted,
    marginTop: 4,
  },
  modesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  modeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  modeChipSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  modeText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.text,
  },
  modeTextSelected: {
    color: "#FFFFFF",
  },
  stateBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.primaryLight,
  },
  stateText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: "500",
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
  },
  errorText: {
    fontSize: 14,
    color: Colors.light.error,
    fontWeight: "500",
  },
  results: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  eventResult: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  eventMeta: {
    fontSize: 13,
    color: Colors.light.textMuted,
    marginTop: 4,
  },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: Colors.light.primaryLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 15,
    color: Colors.light.text,
    paddingHorizontal: Spacing.xs,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.xs,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    opacity: 0.3,
  },
});
