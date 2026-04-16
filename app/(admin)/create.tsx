import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { addEvent, getEventById, updateEvent } from "@/database/events";

type Category = "Workshop" | "Talk" | "Club";

function isPositiveInt(value: string) {
  if (value.trim().length === 0) return true;
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

function parseDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function categoryColors(category: Category) {
  switch (category) {
    case "Workshop":
      return { bg: "#e8fff2", fg: "#0f7a3d", border: "#bff1d2" };
    case "Talk":
      return { bg: "#f1e9ff", fg: "#5b21b6", border: "#dccbff" };
    case "Club":
      return { bg: "#e8f4ff", fg: "#075985", border: "#cbe6ff" };
  }
}

export default function CreateOrEditEvent() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const eventId = Array.isArray(rawId) ? rawId[0] : rawId;
  const isEdit = typeof eventId === "string" && eventId.length > 0;

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const touch = (key: string) => {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("Workshop");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (!isEdit || typeof eventId !== "string") return;

    let cancelled = false;
    (async () => {
      setLoadError(null);
      setIsLoading(true);
      try {
        const row = await getEventById(eventId);
        if (!row) throw new Error("Event not found");

        if (cancelled) return;
        setTitle(row.title);
        setDescription(row.description);
        setCategory((row.category as Category) ?? "Workshop");
        setStartDateTime(row.startDateTime);
        setEndDateTime(row.endDateTime ?? "");
        setLocationName(row.locationName);
        setLocationAddress(row.locationAddress ?? "");
        setOrganizerName(row.organizerName);
        setCapacity(row.capacity == null ? "" : String(row.capacity));

        try {
          const parsed = row.tags ? (JSON.parse(row.tags) as unknown) : [];
          const list = Array.isArray(parsed)
            ? parsed.filter((t) => typeof t === "string")
            : [];
          setTags(list.join(", "));
        } catch {
          setTags("");
        }
      } catch (e) {
        console.error("Failed to load event:", e);
        if (!cancelled) setLoadError("Impossible de charger l'événement.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId, isEdit]);

  const validation = useMemo(() => {
    const errors: Record<string, string> = {};

    if (title.trim().length === 0) errors.title = "Le titre est obligatoire.";
    if (description.trim().length === 0)
      errors.description = "La description est obligatoire.";
    if (!category) errors.category = "La catégorie est obligatoire.";
    if (startDateTime.trim().length === 0) {
      errors.startDateTime = "La date/heure de début est obligatoire.";
    } else if (!parseDate(startDateTime)) {
      errors.startDateTime = "Format de date invalide (ISO 8601 recommandé).";
    }

    if (locationName.trim().length === 0)
      errors.locationName = "Le lieu est obligatoire.";
    if (organizerName.trim().length === 0)
      errors.organizerName = "L'organisateur est obligatoire.";

    if (!isPositiveInt(capacity)) {
      errors.capacity = "La capacité doit être un entier positif.";
    }

    const start =
      startDateTime.trim().length > 0 ? parseDate(startDateTime) : null;
    const end = endDateTime.trim().length > 0 ? parseDate(endDateTime) : null;

    if (endDateTime.trim().length > 0 && !end) {
      errors.endDateTime = "Format de date de fin invalide.";
    }

    if (start && end && end.getTime() <= start.getTime()) {
      errors.endDateTime =
        "La date de fin doit être postérieure à la date de début.";
    }

    return {
      errors,
      isValid: Object.keys(errors).length === 0,
    };
  }, [
    title,
    description,
    category,
    startDateTime,
    endDateTime,
    locationName,
    organizerName,
    capacity,
  ]);

  const canSave = validation.isValid && !isSaving && !isLoading;

  const onSave = async () => {
    setSubmitAttempted(true);
    if (!validation.isValid) return;

    const tagsArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const capacityValue =
      capacity.trim().length === 0 ? null : Number(capacity);

    setIsSaving(true);
    try {
      if (isEdit) {
        if (typeof eventId !== "string") return;

        await updateEvent(eventId, {
          title: title.trim(),
          description: description.trim(),
          category,
          startDateTime: startDateTime.trim(),
          endDateTime:
            endDateTime.trim().length === 0 ? null : endDateTime.trim(),
          locationName: locationName.trim(),
          locationAddress:
            locationAddress.trim().length === 0 ? null : locationAddress.trim(),
          organizerName: organizerName.trim(),
          capacity: capacityValue,
          tags: tagsArray.length === 0 ? null : tagsArray,
        });
      } else {
        await addEvent({
          title: title.trim(),
          description: description.trim(),
          category,
          startDateTime: startDateTime.trim(),
          endDateTime:
            endDateTime.trim().length === 0 ? null : endDateTime.trim(),
          locationName: locationName.trim(),
          locationAddress:
            locationAddress.trim().length === 0 ? null : locationAddress.trim(),
          organizerName: organizerName.trim(),
          capacity: capacityValue,
          tags: tagsArray.length === 0 ? null : tagsArray,
        });
      }

      router.back();
    } catch (e) {
      console.error("Save failed:", e);
      Alert.alert("Erreur", "Enregistrement impossible.");
    } finally {
      setIsSaving(false);
    }
  };

  const show = (key: string) => {
    if (!submitAttempted && !touched[key]) return null;
    return validation.errors[key] ?? null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.topbar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            pressed && styles.backBtnPressed,
          ]}>
          <Text style={styles.backText}>Retour</Text>
        </Pressable>

        <Text style={styles.topTitle}>
          {isEdit ? "Modifier" : "Créer"} un événement
        </Text>

        <View style={{ width: 72 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Chargement…</Text>
        </View>
      ) : loadError ? (
        <View style={styles.center}>
          <Text style={styles.error}>{loadError}</Text>
        </View>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}>
          <View style={styles.field}>
            <Text style={styles.label}>Titre *</Text>
            <TextInput
              value={title}
              onChangeText={(v) => {
                touch("title");
                setTitle(v);
              }}
              style={styles.input}
              placeholder="Ex: Workshop React Native"
            />
            {show("title") ? (
              <Text style={styles.error}>{show("title")}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              value={description}
              onChangeText={(v) => {
                touch("description");
                setDescription(v);
              }}
              style={[styles.input, styles.textarea]}
              placeholder="Décrivez l'événement..."
              multiline
            />
            {show("description") ? (
              <Text style={styles.error}>{show("description")}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Catégorie *</Text>
            <View style={styles.categoryRow}>
              {(["Workshop", "Talk", "Club"] as const).map((c) => {
                const colors = categoryColors(c);
                const selected = category === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => {
                      touch("category");
                      setCategory(c);
                    }}
                    style={({ pressed }) => [
                      styles.categoryPill,
                      {
                        backgroundColor: selected ? colors.bg : "#ffffff",
                        borderColor: selected ? colors.border : "#dbe2ee",
                      },
                      pressed && styles.pressed,
                    ]}>
                    <Text
                      style={[
                        styles.categoryText,
                        { color: selected ? colors.fg : "#111827" },
                      ]}>
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {show("category") ? (
              <Text style={styles.error}>{show("category")}</Text>
            ) : null}
          </View>

          <View style={styles.grid2}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Début (ISO) *</Text>
              <TextInput
                value={startDateTime}
                onChangeText={(v) => {
                  touch("startDateTime");
                  setStartDateTime(v);
                }}
                style={styles.input}
                placeholder="2026-04-30T14:00:00.000Z"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {show("startDateTime") ? (
                <Text style={styles.error}>{show("startDateTime")}</Text>
              ) : null}
            </View>

            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Fin (ISO)</Text>
              <TextInput
                value={endDateTime}
                onChangeText={(v) => {
                  touch("endDateTime");
                  setEndDateTime(v);
                }}
                style={styles.input}
                placeholder="Optionnel"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {show("endDateTime") ? (
                <Text style={styles.error}>{show("endDateTime")}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.grid2}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Lieu *</Text>
              <TextInput
                value={locationName}
                onChangeText={(v) => {
                  touch("locationName");
                  setLocationName(v);
                }}
                style={styles.input}
                placeholder="Ex: Amphi A"
              />
              {show("locationName") ? (
                <Text style={styles.error}>{show("locationName")}</Text>
              ) : null}
            </View>

            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Adresse</Text>
              <TextInput
                value={locationAddress}
                onChangeText={(v) => {
                  touch("locationAddress");
                  setLocationAddress(v);
                }}
                style={styles.input}
                placeholder="Optionnel"
              />
            </View>
          </View>

          <View style={styles.grid2}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Organisateur *</Text>
              <TextInput
                value={organizerName}
                onChangeText={(v) => {
                  touch("organizerName");
                  setOrganizerName(v);
                }}
                style={styles.input}
                placeholder="Ex: Département Informatique"
              />
              {show("organizerName") ? (
                <Text style={styles.error}>{show("organizerName")}</Text>
              ) : null}
            </View>

            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Capacité</Text>
              <TextInput
                value={capacity}
                onChangeText={(v) => {
                  touch("capacity");
                  setCapacity(v);
                }}
                style={styles.input}
                placeholder="Ex: 40"
                keyboardType="number-pad"
              />
              {show("capacity") ? (
                <Text style={styles.error}>{show("capacity")}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tags</Text>
            <TextInput
              value={tags}
              onChangeText={(v) => {
                touch("tags");
                setTags(v);
              }}
              style={styles.input}
              placeholder="Ex: react, mobile, expo"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>Séparez les tags par des virgules.</Text>
          </View>

          <Pressable
            onPress={onSave}
            disabled={!canSave}
            style={({ pressed }) => [
              styles.saveBtn,
              !canSave && styles.saveBtnDisabled,
              pressed && canSave && styles.saveBtnPressed,
            ]}>
            {isSaving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveText}>Enregistrer</Text>
            )}
          </Pressable>

          {!validation.isValid && submitAttempted ? (
            <Text style={styles.footerError}>
              Corrigez les champs en erreur avant d'enregistrer.
            </Text>
          ) : null}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f3f5f9",
  },
  topbar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#f3f5f9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0b1220",
  },
  backBtn: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dbe2ee",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnPressed: {
    opacity: 0.9,
  },
  backText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 14,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  input: {
    backgroundColor: "#eef2f7",
    borderWidth: 1,
    borderColor: "#dbe2ee",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0b1220",
  },
  textarea: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  hint: {
    fontSize: 12,
    color: "#6b7280",
  },
  error: {
    fontSize: 12,
    color: "#b91c1c",
  },
  footerError: {
    fontSize: 12,
    color: "#b91c1c",
    textAlign: "center",
    marginTop: 4,
  },
  grid2: {
    flexDirection: "row",
    gap: 12,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 10,
  },
  categoryPill: {
    flex: 1,
    height: 42,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.92,
  },
  saveBtn: {
    marginTop: 8,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#0056b3",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnPressed: {
    opacity: 0.92,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 10,
  },
  muted: {
    fontSize: 13,
    color: "#4b5563",
    textAlign: "center",
  },
});
