import { Ionicons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { useAuth } from "@/store/AuthContext";

export default function StudentTabsLayout() {
  const { logout } = useAuth();

  const onLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <Tabs
      screenOptions={{
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#64748B",
        headerRight: () => (
          <TouchableOpacity
            onPress={onLogout}
            activeOpacity={0.85}
            style={styles.logoutButton}>
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Catalogue",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favoris",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="registrations"
        options={{
          title: "Inscriptions",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: "Assistant IA",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="event/[id]"
        options={{
          title: "Détail événement",
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#f8fafc",
  },
  headerTitle: {
    fontWeight: "700",
    color: "#0f172a",
  },
  tabBar: {
    backgroundColor: "#ffffff",
    borderTopColor: "#e2e8f0",
  },
  logoutButton: {
    marginRight: 16,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
});
