import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/store/AuthContext";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";

export default function Index() {
  const insets = useSafeAreaInsets();
  const theme = Colors.light;
  const { userRole, isLoading, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userRole === "admin") {
      router.replace("/(admin)");
    } else if (userRole === "student") {
      router.replace("/(student)");
    }
  }, [userRole]);

  const canSubmit = useMemo(
    () => !isLoading && email.trim().length > 0 && password.length > 0,
    [isLoading, email, password],
  );

  const onSubmit = async () => {
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion.");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}>
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>CampusEvents</Text>
            <Text style={styles.subtitle}>Connectez-vous pour accéder au catalogue.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="nom@campus.ma"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={theme.textMuted}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            <TouchableOpacity
              onPress={onSubmit}
              disabled={!canSubmit || isLoading}
              activeOpacity={0.7}
              style={[
                styles.button,
                (!canSubmit || isLoading) && styles.buttonDisabled,
              ]}>
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Se connecter</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Plateforme officielle des événements campus.</Text>
          </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textMuted,
    marginTop: Spacing.xs,
    lineHeight: 22,
  },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
  },
  errorText: {
    color: Colors.light.error,
    fontSize: 13,
    marginTop: Spacing.xs,
    fontWeight: "500",
  },
  button: {
    backgroundColor: Colors.light.primary,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
  },
  buttonDisabled: {
    backgroundColor: Colors.light.textMuted,
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    marginTop: 'auto',
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: Colors.light.textMuted,
    fontWeight: "400",
  },
});


