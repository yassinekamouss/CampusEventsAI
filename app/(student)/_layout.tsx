import { Tabs, router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

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
        tabBarActiveTintColor: "#0f766e",
        tabBarInactiveTintColor: "#64748b",
        headerRight: () => (
          <Pressable
            onPress={onLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutPressed,
            ]}>
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </Pressable>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Catalogue",
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favoris",
        }}
      />
      <Tabs.Screen
        name="registrations"
        options={{
          title: "Inscriptions",
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: "Assistant IA",
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dbe2ee",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutPressed: {
    opacity: 0.8,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
});
