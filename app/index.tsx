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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/store/AuthContext";

const Spacing = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export default function Index() {
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
      const message =
        err instanceof Error ? err.message : "Erreur de connexion.";
      setError(message);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.content}>
            <View style={styles.header}>
              <ThemedText type="title" style={styles.title}>
                CampusEvents
              </ThemedText>
              <ThemedText type="default" style={styles.subtitle}>
                Welcome back. Please enter your details.
              </ThemedText>
            </View>

            <View style={[styles.card, styles.cardElevated]}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="admin@campus.ma"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mot de passe</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Votre mot de passe"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </View>

              <TouchableOpacity
                onPress={onSubmit}
                disabled={!canSubmit || isLoading}
                style={[
                  styles.button,
                  (!canSubmit || isLoading) && styles.buttonDisabled,
                ]}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Se connecter</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
    paddingHorizontal: 4,
  },
  title: {
    marginBottom: 6,
    color: "#0F172A",
  },
  subtitle: {
    color: "#64748B",
  },
  card: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardElevated: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  input: {
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 8,
    padding: 14,
    backgroundColor: "#F1F5F9",
    fontSize: 15,
    color: "#0F172A",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 6,
  },
  button: {
    marginTop: Spacing.md,
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
