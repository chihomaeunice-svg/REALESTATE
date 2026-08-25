import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { HomeScreen } from "../screens/HomeScreen";
import { ListingDetailScreen } from "../screens/ListingDetailScreen";
import { OverviewScreen } from "../screens/landlord/OverviewScreen";
import { PropertiesScreen } from "../screens/landlord/PropertiesScreen";
import { TenantsScreen } from "../screens/landlord/TenantsScreen";
import { LeasesScreen } from "../screens/landlord/LeasesScreen";
import { LeaseDetailScreen } from "../screens/landlord/LeaseDetailScreen";
import { ReportsScreen } from "../screens/landlord/ReportsScreen";
import { SubscriptionScreen } from "../screens/landlord/SubscriptionScreen";
import { useAuth } from "../lib/auth-context";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const DashboardStack = createNativeStackNavigator();
const PropertiesStack = createNativeStackNavigator();
const LeasesStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

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

function DashboardStackScreen() {
  return (
    <DashboardStack.Navigator screenOptions={stackScreenOptions}>
      <DashboardStack.Screen name="OverviewMain" component={OverviewScreen} options={{ headerShown: false }} />
    </DashboardStack.Navigator>
  );
}

function PropertiesStackScreen() {
  return (
    <PropertiesStack.Navigator screenOptions={stackScreenOptions}>
      <PropertiesStack.Screen name="PropertiesMain" component={PropertiesScreen} options={{ headerShown: false }} />
    </PropertiesStack.Navigator>
  );
}

function LeasesStackScreen() {
  return (
    <LeasesStack.Navigator screenOptions={stackScreenOptions}>
      <LeasesStack.Screen name="LeasesMain" component={LeasesScreen} options={{ headerShown: false }} />
      <LeasesStack.Screen name="LeaseDetail" component={LeaseDetailScreen} options={{ title: "Lease" }} />
    </LeasesStack.Navigator>
  );
}

function MoreStackScreen() {
  const { logout } = useAuth();

  return (
    <MoreStack.Navigator screenOptions={stackScreenOptions}>
      <MoreStack.Screen
        name="MoreMenu"
        options={{
          title: "More",
          headerRight: () => (
            <TouchableOpacity onPress={logout}>
              <Text style={{ color: colors.red[600], fontWeight: "600", fontSize: 14 }}>Logout</Text>
            </TouchableOpacity>
          ),
        }}
      >
        {({ navigation }) => (
          <MoreMenuScreen navigation={navigation} />
        )}
      </MoreStack.Screen>
      <MoreStack.Screen name="Tenants" component={TenantsScreen} options={{ title: "Tenants" }} />
      <MoreStack.Screen name="Reports" component={ReportsScreen} options={{ title: "Reports" }} />
      <MoreStack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: "Subscription" }} />
    </MoreStack.Navigator>
  );
}

function MoreMenuScreen({ navigation }: { navigation: any }) {
  const items = [
    { label: "Tenants", icon: "users" as const, screen: "Tenants" },
    { label: "Reports & arrears", icon: "bar-chart-2" as const, screen: "Reports" },
    { label: "Subscription", icon: "credit-card" as const, screen: "Subscription" },
  ];

  return (
    <React.Fragment>
      {items.map((item) => (
        <TouchableOpacity
          key={item.screen}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.ink[100],
            backgroundColor: colors.white,
          }}
          onPress={() => navigation.navigate(item.screen)}
        >
          <Feather name={item.icon} size={20} color={colors.ink[600]} />
          <Text style={{ fontSize: 16, color: colors.ink[800], flex: 1 }}>{item.label}</Text>
          <Feather name="chevron-right" size={18} color={colors.ink[300]} />
        </TouchableOpacity>
      ))}
    </React.Fragment>
  );
}

export function LandlordTabs() {
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
        name="LandlordHome"
        component={HomeStackScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="grid" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Properties"
        component={PropertiesStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Leases"
        component={LeasesStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="file-text" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="more-horizontal" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
