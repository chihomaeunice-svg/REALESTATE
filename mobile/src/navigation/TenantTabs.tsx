import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { HomeScreen } from "../screens/HomeScreen";
import { ListingDetailScreen } from "../screens/ListingDetailScreen";
import { TenantPortalScreen } from "../screens/tenant/TenantPortalScreen";
import { TenantProfileScreen } from "../screens/tenant/TenantProfileScreen";
import { useAuth } from "../lib/auth-context";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const RentalStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

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

function RentalStackScreen() {
  return (
    <RentalStack.Navigator screenOptions={stackScreenOptions}>
      <RentalStack.Screen name="TenantPortalMain" component={TenantPortalScreen} options={{ headerShown: false }} />
    </RentalStack.Navigator>
  );
}

function ProfileStackScreen() {
  const { logout } = useAuth();
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen
        name="TenantProfileMain"
        component={TenantProfileScreen}
        options={{
          title: "Profile",
          headerRight: () => (
            <TouchableOpacity onPress={logout}>
              <Text style={{ color: colors.red[600], fontWeight: "600", fontSize: 14 }}>Logout</Text>
            </TouchableOpacity>
          ),
        }}
      />
    </ProfileStack.Navigator>
  );
}

export function TenantTabs() {
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
        name="TenantHome"
        component={HomeStackScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="MyRental"
        component={RentalStackScreen}
        options={{
          title: "My Rental",
          tabBarIcon: ({ color, size }) => <Feather name="key" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="TenantProfile"
        component={ProfileStackScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
