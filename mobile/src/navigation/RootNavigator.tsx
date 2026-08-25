import React from "react";
import { useAuth } from "../lib/auth-context";
import { SplashScreen } from "../screens/SplashScreen";
import { PublicStack } from "./PublicStack";
import { LandlordTabs } from "./LandlordTabs";
import { TenantTabs } from "./TenantTabs";
import { AdminTabs } from "./AdminTabs";

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <SplashScreen />;

  if (!user) return <PublicStack />;

  switch (user.role) {
    case "landlord":
    case "agent":
      return <LandlordTabs />;
    case "tenant":
      return <TenantTabs />;
    case "admin":
      return <AdminTabs />;
    default:
      return <PublicStack />;
  }
}
