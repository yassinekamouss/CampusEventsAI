import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EventRow, getEventById } from "@/database/events";
import { checkIsFavorite, toggleFavorite } from "@/database/favorites";
import {
  cancelRegistration,
  checkIsRegisteredForEvent,
  registerForEvent,
} from "@/database/registrations";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: iso, time: "" };
  try {
    return {
      date: d.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long' }),
      time: d.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' }),
    };
  } catch {
    return { date: iso, time: "" };
  }
}

export default function StudentEventDetails() {
  const insets = useSafeAreaInsets();
  const theme = Colors.light;
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
      const STUDENT_USER_ID = "etudiant@campus.ma";
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

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const isPast = useMemo(() => {
    if (!event) return false;
    const startTs = new Date(event.startDateTime).getTime();
    return !Number.isNaN(startTs) && startTs < Date.now();
  }, [event]);

  const isFull = useMemo(() => {
    if (!event || event.capacity === null) return false;
    return event.registeredCount >= event.capacity;
  }, [event]);

  const canRegister = !!event && !isRegistered && !isPast && !isFull && !isMutating;

  const onToggleFavorite = async () => {
    if (!eventId || isMutating) return;
    setIsMutating(true);
    try {
      const STUDENT_USER_ID = "etudiant@campus.ma";
      const next = await toggleFavorite(eventId, STUDENT_USER_ID);
      setIsFavorite(next);
    } catch (e) {
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
      const STUDENT_USER_ID = "etudiant@campus.ma";
      if (isRegistered) {
        await cancelRegistration(eventId, STUDENT_USER_ID);
      } else {
        await registerForEvent(eventId, STUDENT_USER_ID);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action impossible.");
    } finally {
      setIsMutating(false);
    }
  };

  const dt = event ? formatDateTime(event.startDateTime) : { date: "", time: "" };

  return (
    <View style={styles.container}>
      <View style={[styles.navBar, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>Détails</Text>
        <TouchableOpacity onPress={onToggleFavorite} style={styles.navButton}>
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={24} color={isFavorite ? theme.error : theme.text} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : error && !event ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load} style={styles.retryButton}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : event ? (
        <>
          <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.category}>{event.category}</Text>
              <Text style={styles.title}>{event.title}</Text>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <View style={styles.iconBox}>
                  <Ionicons name="calendar-outline" size={20} color={theme.text} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Date et heure</Text>
                  <Text style={styles.infoValue}>{dt.date} à {dt.time}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.iconBox}>
                  <Ionicons name="location-outline" size={20} color={theme.text} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Lieu</Text>
                  <Text style={styles.infoValue}>{event.locationName}</Text>
                  {event.locationAddress && <Text style={styles.infoSubValue}>{event.locationAddress}</Text>}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.iconBox}>
                  <Ionicons name="people-outline" size={20} color={theme.text} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Capacité</Text>
                  <Text style={styles.infoValue}>{event.registeredCount} / {event.capacity ?? "Illimité"} places</Text>
                </View>
              </View>
            </View>

            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>À propos</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
            <TouchableOpacity
              onPress={onToggleRegistration}
              disabled={!isRegistered && !canRegister}
              activeOpacity={0.8}
              style={[
                styles.actionButton,
                isRegistered ? styles.cancelButton : styles.registerButton,
                (!isRegistered && !canRegister) && styles.disabledButton,
              ]}>
              {isMutating ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.actionButtonText}>
                  {isRegistered ? "Annuler ma place" : "S'inscrire à l'événement"}
                </Text>
              )}
            </TouchableOpacity>
            {error && <Text style={styles.footerError}>{error}</Text>}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    minHeight: 52,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.text,
    flex: 1,
    textAlign: "center",
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  category: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.light.text,
    lineHeight: 32,
  },
  infoSection: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
    paddingTop: 2,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textMuted,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  infoSubValue: {
    fontSize: 14,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  descriptionSection: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 24,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  actionButton: {
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  registerButton: {
    backgroundColor: Colors.light.primary,
  },
  cancelButton: {
    backgroundColor: Colors.light.error,
  },
  disabledButton: {
    backgroundColor: Colors.light.border,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  footerError: {
    fontSize: 12,
    color: Colors.light.error,
    textAlign: "center",
    marginTop: 8,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: 15,
    color: Colors.light.error,
    textAlign: "center",
  },
  retryButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.sm,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
