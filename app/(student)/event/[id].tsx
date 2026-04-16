import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EventRow, getEventById } from "@/database/events";
import { checkIsFavorite, toggleFavorite } from "@/database/favorites";
import {
  cancelRegistration,
  checkIsRegisteredForEvent,
  registerForEvent,
} from "@/database/registrations";

const STUDENT_USER_ID = "etudiant@campus.ma";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return d.toLocaleString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function StudentEventDetails() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const idParam = params.id;
  const eventId = Array.isArray(idParam) ? idParam[0] : idParam;

  const [event, setEvent] = useState<EventRow | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!eventId) {
      setError("Événement introuvable.");
      setIsLoading(false);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const [eventRow, favoriteState, registeredState] = await Promise.all([
        getEventById(eventId),
        checkIsFavorite(eventId, STUDENT_USER_ID),
        checkIsRegisteredForEvent(eventId, STUDENT_USER_ID),
      ]);

      if (!eventRow) {
        setError("Événement introuvable.");
        setEvent(null);
      } else {
        setEvent(eventRow);
      }

      setIsFavorite(favoriteState);
      setIsRegistered(registeredState);
    } catch (e) {
      console.error("Failed to load event detail:", e);
      setError("Impossible de charger cet événement.");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const isPast = useMemo(() => {
    if (!event) return false;
    const startTs = new Date(event.startDateTime).getTime();
    if (Number.isNaN(startTs)) return false;
    return startTs < Date.now();
  }, [event]);

  const isFull = useMemo(() => {
    if (!event || event.capacity === null) return false;
    return event.registeredCount >= event.capacity;
  }, [event]);

  const canRegister =
    !!event && !isRegistered && !isPast && !isFull && !isMutating;

  const onToggleFavorite = async () => {
    if (!eventId || isMutating) return;
    setIsMutating(true);
    try {
      const next = await toggleFavorite(eventId, STUDENT_USER_ID);
      setIsFavorite(next);
    } catch (e) {
      console.error("Toggle favorite failed:", e);
      setError("Impossible de modifier le favori.");
    } finally {
      setIsMutating(false);
    }
  };

  const onToggleRegistration = async () => {
    if (!eventId || !event || isMutating) return;

    if (!isRegistered && !canRegister) return;

    setIsMutating(true);
    setError(null);

    try {
      if (isRegistered) {
        await cancelRegistration(eventId, STUDENT_USER_ID);
      } else {
        await registerForEvent(eventId, STUDENT_USER_ID);
      }

      await load();
    } catch (e) {
      console.error("Registration update failed:", e);
      const message = e instanceof Error ? e.message : "Action impossible.";
      setError(message);
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["bottom", "left", "right"]}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Chargement...</Text>
        </View>
      ) : error && !event ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity onPress={load} style={styles.retryButton}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : event ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.title}>{event.title}</Text>
            <Text style={styles.category}>{event.category}</Text>
            <Text style={styles.description}>{event.description}</Text>

            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>
                {formatDateTime(event.startDateTime)}
              </Text>
            </View>

            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Lieu</Text>
              <Text style={styles.metaValue}>{event.locationName}</Text>
              {event.locationAddress ? (
                <Text style={styles.metaSubValue}>{event.locationAddress}</Text>
              ) : null}
            </View>

            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Places</Text>
              <Text style={styles.metaValue}>
                {event.registeredCount}/{event.capacity ?? "Illimité"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onToggleFavorite}
              activeOpacity={0.85}
              style={styles.favoriteButton}>
              <View style={styles.actionContent}>
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={18}
                  color="#2563EB"
                />
                <Text style={styles.favoriteText}>
                  {isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onToggleRegistration}
              disabled={!isRegistered && !canRegister}
              activeOpacity={0.88}
              style={[
                styles.registerButton,
                !isRegistered && !canRegister && styles.registerButtonDisabled,
              ]}>
              <View style={styles.actionContent}>
                <Ionicons
                  name={
                    isRegistered
                      ? "close-circle-outline"
                      : "checkmark-circle-outline"
                  }
                  size={20}
                  color={!isRegistered && !canRegister ? "#64748B" : "#FFFFFF"}
                />
                <Text
                  style={[
                    styles.registerText,
                    !isRegistered &&
                      !canRegister &&
                      styles.registerTextDisabled,
                  ]}>
                  {isRegistered ? "Se désinscrire" : "S'inscrire"}
                </Text>
              </View>
            </TouchableOpacity>

            {error ? <Text style={styles.errorInline}>{error}</Text> : null}
            {!isRegistered && isPast ? (
              <Text style={styles.note}>
                Inscription fermée: événement passé.
              </Text>
            ) : null}
            {!isRegistered && isFull ? (
              <Text style={styles.note}>
                Inscription fermée: capacité atteinte.
              </Text>
            ) : null}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <Text style={styles.muted}>Aucun événement</Text>
        </View>
      )}
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
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    gap: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  category: {
    alignSelf: "flex-start",
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
    backgroundColor: "#DBEAFE",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  description: {
    fontSize: 15,
    color: "#334155",
    lineHeight: 22,
  },
  metaBlock: {
    gap: 4,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "600",
  },
  metaSubValue: {
    fontSize: 13,
    color: "#475569",
  },
  favoriteButton: {
    marginTop: 4,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563EB",
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  registerButton: {
    height: 52,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  registerButtonDisabled: {
    backgroundColor: "#CBD5E1",
  },
  registerText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
  },
  registerTextDisabled: {
    color: "#64748b",
  },
  note: {
    fontSize: 13,
    color: "#64748b",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 8,
  },
  muted: {
    fontSize: 14,
    color: "#64748b",
  },
  error: {
    fontSize: 14,
    color: "#EF4444",
    textAlign: "center",
  },
  errorInline: {
    fontSize: 13,
    color: "#EF4444",
  },
  retryButton: {
    marginTop: 8,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
});
