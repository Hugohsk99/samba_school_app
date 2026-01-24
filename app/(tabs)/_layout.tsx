import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="blocos"
        options={{
          title: "Blocos",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="people.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ensaios"
        options={{
          title: "Ensaios",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="almoxarifado"
        options={{
          title: "Almoxarifado",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="box.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="relatorios"
        options={{
          title: "Relatórios",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
