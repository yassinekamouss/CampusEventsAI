import { Ionicons } from "@expo/vector-icons";
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
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { addEvent, getEventById, updateEvent } from "@/database/events";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";

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

export default function CreateOrEditEvent() {
  const insets = useSafeAreaInsets();
  const theme = Colors.light;
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const eventId = Array.isArray(rawId) ? rawId[0] : rawId;
  const isEdit = typeof eventId === "string" && eventId.length > 0;

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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

  const touch = (key: string) => setTouched((prev) => ({ ...prev, [key]: true }));

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const row = await getEventById(eventId!);
        if (!row) throw new Error("Event not found");
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
          const parsed = row.tags ? JSON.parse(row.tags) : [];
          setTags(Array.isArray(parsed) ? parsed.join(", ") : "");
        } catch { setTags(""); }
      } catch (e) {
        setLoadError("Impossible de charger l'événement.");
      } finally { setIsLoading(false); }
    })();
  }, [eventId, isEdit]);

  const validation = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = "Titre obligatoire";
    if (!description.trim()) errors.description = "Description obligatoire";
    if (!startDateTime.trim() || !parseDate(startDateTime)) errors.startDateTime = "Date invalide (ISO)";
    if (!locationName.trim()) errors.locationName = "Lieu obligatoire";
    if (!organizerName.trim()) errors.organizerName = "Organisateur obligatoire";
    if (!isPositiveInt(capacity)) errors.capacity = "Doit être un entier positif";
    return { errors, isValid: Object.keys(errors).length === 0 };
  }, [title, description, startDateTime, locationName, organizerName, capacity]);

  const onSave = async () => {
    setSubmitAttempted(true);
    if (!validation.isValid) return;
    setIsSaving(true);
    try {
      const tagsArray = tags.split(",").map((t) => t.trim()).filter(Boolean);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        startDateTime: startDateTime.trim(),
        endDateTime: endDateTime.trim() || null,
        locationName: locationName.trim(),
        locationAddress: locationAddress.trim() || null,
        organizerName: organizerName.trim(),
        capacity: capacity.trim() ? Number(capacity) : null,
        tags: tagsArray.length ? tagsArray : null,
      };
      if (isEdit) await updateEvent(eventId!, payload);
      else await addEvent(payload);
      router.back();
    } catch (e) {
      Alert.alert("Erreur", "Enregistrement impossible.");
    } finally { setIsSaving(false); }
  };

  const showError = (key: string) => (submitAttempted || touched[key]) && validation.errors[key];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? "Modifier" : "Nouvel événement"}</Text>
        <TouchableOpacity onPress={onSave} disabled={isSaving} style={styles.saveNavButton}>
          {isSaving ? <ActivityIndicator size="small" color={theme.accent} /> : <Text style={styles.saveNavText}>Publier</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {isLoading ? (
            <ActivityIndicator style={styles.loader} color={theme.primary} />
          ) : loadError ? (
            <Text style={styles.errorText}>{loadError}</Text>
          ) : (
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Titre</Text>
                <TextInput value={title} onChangeText={(v) => { touch("title"); setTitle(v); }} style={[styles.input, showError("title") && styles.inputError]} placeholder="Ex: Conférence IA" placeholderTextColor={theme.textMuted} />
                {showError("title") && <Text style={styles.fieldError}>{validation.errors.title}</Text>}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Description</Text>
                <TextInput value={description} onChangeText={(v) => { touch("description"); setDescription(v); }} style={[styles.input, styles.textarea, showError("description") && styles.inputError]} placeholder="Détails de l'événement..." placeholderTextColor={theme.textMuted} multiline />
                {showError("description") && <Text style={styles.fieldError}>{validation.errors.description}</Text>}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Catégorie</Text>
                <View style={styles.categoryRow}>
                  {(["Workshop", "Talk", "Club"] as const).map((c) => (
                    <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[styles.categoryChip, category === c && styles.categoryChipSelected]}>
                      <Text style={[styles.categoryChipText, category === c && styles.categoryChipTextSelected]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.field, styles.flex]}>
                  <Text style={styles.label}>Début (ISO)</Text>
                  <TextInput value={startDateTime} onChangeText={(v) => { touch("startDateTime"); setStartDateTime(v); }} style={[styles.input, showError("startDateTime") && styles.inputError]} placeholder="2026-04-30T14:00Z" autoCapitalize="none" />
                </View>
                <View style={[styles.field, styles.flex]}>
                  <Text style={styles.label}>Fin (ISO)</Text>
                  <TextInput value={endDateTime} onChangeText={setEndDateTime} style={styles.input} placeholder="Optionnel" autoCapitalize="none" />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Lieu</Text>
                <TextInput value={locationName} onChangeText={(v) => { touch("locationName"); setLocationName(v); }} style={[styles.input, showError("locationName") && styles.inputError]} placeholder="Amphi B" />
              </View>

              <View style={styles.row}>
                <View style={[styles.field, styles.flex]}>
                  <Text style={styles.label}>Organisateur</Text>
                  <TextInput value={organizerName} onChangeText={(v) => { touch("organizerName"); setOrganizerName(v); }} style={[styles.input, showError("organizerName") && styles.inputError]} placeholder="Département Tech" />
                </View>
                <View style={[styles.field, { width: 100 }]}>
                  <Text style={styles.label}>Places</Text>
                  <TextInput value={capacity} onChangeText={setCapacity} style={styles.input} placeholder="∞" keyboardType="number-pad" />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Tags</Text>
                <TextInput value={tags} onChangeText={setTags} style={styles.input} placeholder="react, mobile, design" autoCapitalize="none" />
              </View>
            </View>
          )}
        </ScrollView>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    minHeight: 52,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.text,
  },
  saveNavButton: {
    width: 60,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  saveNavText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.accent,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  loader: {
    marginTop: Spacing.xl,
  },
  form: {
    gap: Spacing.lg,
  },
  field: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  input: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.light.text,
  },
  inputError: {
    borderColor: Colors.light.error,
  },
  fieldError: {
    fontSize: 12,
    color: Colors.light.error,
    fontWeight: "500",
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  categoryRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  categoryChipSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.text,
  },
  categoryChipTextSelected: {
    color: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  errorText: {
    color: Colors.light.error,
    textAlign: "center",
    marginTop: Spacing.xl,
  },
});
