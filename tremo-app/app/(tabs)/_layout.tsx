import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TabBar } from "@/components/TabBar";

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
            headerShown: false
        }}
    //   screenOptions={({ route }) => ({
    //     tabBarIcon: ({ color, size }) => {
    //       let iconName: keyof typeof Ionicons.glyphMap;

    //       if (route.name === "home") iconName = "power-outline";
    //       else if (route.name === "manual") iconName = "options-outline";
    //       else if (route.name === "reports") iconName = "bar-chart-outline";
    //       else iconName = "person-outline";

    //       return <Ionicons name={iconName} size={size} color={color} />;
    //     },
    //     tabBarActiveTintColor: "#4285f4",
    //     tabBarInactiveTintColor: "gray",
    //     headerShown: false,
    //   })}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="manual" options={{ title: "Manual" }} />
      <Tabs.Screen name="reports" options={{ title: "Reports" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}