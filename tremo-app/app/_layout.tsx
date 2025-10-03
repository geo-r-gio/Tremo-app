import { Stack } from "expo-router";
import { AuthContextProvider } from "../context/authContext";

export default function RootLayout() {
  return (
    <AuthContextProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* index.tsx stays outside (onboarding/login/landing screen) */}
        <Stack.Screen name="index" />

        {/* Tabs layout will be loaded when navigating to /(tabs) */}
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthContextProvider>
  );
}



// import { Stack } from "expo-router";
// import { AuthContextProvider } from "../context/authContext";

// export default function RootLayout() {
//   return (
//     <AuthContextProvider>
//       <Stack screenOptions={{ headerShown: false }}>
//         <Stack.Screen name="index" />
//       </Stack>
//     </AuthContextProvider>
//   );
// }