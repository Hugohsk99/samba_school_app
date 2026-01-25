/**
 * Badge de Notificações
 * 
 * Componente que mostra o número de notificações não lidas
 */

import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useNotificacoes } from "@/lib/notificacoes-context";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

interface NotificationBadgeProps {
  size?: "small" | "medium" | "large";
  showZero?: boolean;
}

export function NotificationBadge({ size = "medium", showZero = false }: NotificationBadgeProps) {
  const router = useRouter();
  const colors = useColors();
  const { naoLidas } = useNotificacoes();

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/notificacoes");
  };

  // Tamanhos
  const sizes = {
    small: { icon: 20, badge: 14, fontSize: 9 },
    medium: { icon: 28, badge: 18, fontSize: 11 },
    large: { icon: 36, badge: 22, fontSize: 13 },
  };

  const { icon, badge, fontSize } = sizes[size];

  if (naoLidas === 0 && !showZero) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <Text style={{ fontSize: icon }}>🔔</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <View style={{ position: "relative" }}>
        <Text style={{ fontSize: icon }}>🔔</Text>
        <View
          style={{
            position: "absolute",
            top: -4,
            right: -8,
            minWidth: badge,
            height: badge,
            borderRadius: badge / 2,
            backgroundColor: colors.error || "#EF4444",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 4,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: fontSize,
              fontWeight: "bold",
            }}
          >
            {naoLidas > 99 ? "99+" : naoLidas}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/**
 * Badge simples (apenas o número, sem ícone)
 */
export function SimpleBadge({ count, color }: { count: number; color?: string }) {
  const colors = useColors();

  if (count === 0) return null;

  return (
    <View
      style={{
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: color || colors.error || "#EF4444",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 6,
      }}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 11,
          fontWeight: "bold",
        }}
      >
        {count > 99 ? "99+" : count}
      </Text>
    </View>
  );
}
