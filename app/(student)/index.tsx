import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/store/AuthContext";

export default function StudentIndex() {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Catalogue Étudiant</Text>

      <Pressable
        onPress={async () => {
          await logout();
          router.replace("/");
        }}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}>
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 14,
  },
  button: {
    height: 44,
    minWidth: 180,
    borderRadius: 10,
    backgroundColor: "#0056b3",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
});
