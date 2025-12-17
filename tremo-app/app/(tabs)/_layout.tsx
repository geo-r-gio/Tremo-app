import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TabBar } from "@/components/TabBar";

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
            headerShown: false
        }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="manual" options={{ title: "Manual" }} />
      <Tabs.Screen name="reports" options={{ title: "Reports" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}