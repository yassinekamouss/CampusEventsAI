import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
          <Pressable onPress={load} style={styles.retryButton}>
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
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

            <Pressable
              onPress={onToggleFavorite}
              style={({ pressed }) => [
                styles.favoriteButton,
                pressed && styles.favoriteButtonPressed,
              ]}>
              <Text style={styles.favoriteText}>
                {isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              </Text>
            </Pressable>

            <Pressable
              onPress={onToggleRegistration}
              disabled={!isRegistered && !canRegister}
              style={({ pressed }) => [
                styles.registerButton,
                !isRegistered && !canRegister && styles.registerButtonDisabled,
                pressed && styles.registerButtonPressed,
              ]}>
              <Text
                style={[
                  styles.registerText,
                  !isRegistered && !canRegister && styles.registerTextDisabled,
                ]}>
                {isRegistered ? "Se désinscrire" : "S'inscrire"}
              </Text>
            </Pressable>

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
    backgroundColor: "#f3f5f9",
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e6e9f0",
    padding: 16,
    gap: 12,
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
    color: "#0f766e",
    backgroundColor: "#e6fffa",
    borderWidth: 1,
    borderColor: "#99f6e4",
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbe2ee",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteButtonPressed: {
    opacity: 0.85,
  },
  favoriteText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  registerButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#0f766e",
    alignItems: "center",
    justifyContent: "center",
  },
  registerButtonDisabled: {
    backgroundColor: "#cbd5e1",
  },
  registerButtonPressed: {
    opacity: 0.9,
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
    color: "#b91c1c",
    textAlign: "center",
  },
  errorInline: {
    fontSize: 13,
    color: "#b91c1c",
  },
  retryButton: {
    marginTop: 8,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dbe2ee",
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
