import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initStorage } from "./src/lib/storage";
import { AuthProvider } from "./src/lib/auth-context";
import { WishlistProvider } from "./src/lib/wishlist-context";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { SplashScreen } from "./src/screens/SplashScreen";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initStorage().then(() => setReady(true));
  }, []);

  if (!ready) return <SplashScreen />;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AuthProvider>
          <WishlistProvider>
            <RootNavigator />
            <StatusBar style="auto" />
          </WishlistProvider>
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
