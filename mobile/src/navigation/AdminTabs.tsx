import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { HomeScreen } from "../screens/HomeScreen";
import { ListingDetailScreen } from "../screens/ListingDetailScreen";
import { AdminVerificationScreen } from "../screens/admin/AdminVerificationScreen";
import { useAuth } from "../lib/auth-context";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const VerifyStack = createNativeStackNavigator();

const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.ink[900],
  headerShadowVisible: false,
};

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: "Listing" }} />
    </HomeStack.Navigator>
  );
}

function VerifyStackScreen() {
  const { logout } = useAuth();
  return (
    <VerifyStack.Navigator screenOptions={stackScreenOptions}>
      <VerifyStack.Screen
        name="VerificationMain"
        component={AdminVerificationScreen}
        options={{
          title: "Verification",
          headerRight: () => (
            <TouchableOpacity onPress={logout}>
              <Text style={{ color: colors.red[600], fontWeight: "600", fontSize: 14 }}>Logout</Text>
            </TouchableOpacity>
          ),
        }}
      />
    </VerifyStack.Navigator>
  );
}

export function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand[600],
        tabBarInactiveTintColor: colors.ink[400],
        tabBarStyle: {
          borderTopColor: colors.surfaceBorder,
          backgroundColor: colors.white,
        },
      }}
    >
      <Tab.Screen
        name="AdminHome"
        component={HomeStackScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Verification"
        component={VerifyStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="shield" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
