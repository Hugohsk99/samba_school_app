import { useEffect, useRef } from "react";
import { View, Text, Animated, Platform, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  visible: boolean;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onHide: () => void;
}

const TOAST_CONFIG = {
  success: {
    icon: "✅",
    bgColor: "#22C55E",
    textColor: "#FFFFFF",
  },
  error: {
    icon: "❌",
    bgColor: "#EF4444",
    textColor: "#FFFFFF",
  },
  warning: {
    icon: "⚠️",
    bgColor: "#F59E0B",
    textColor: "#FFFFFF",
  },
  info: {
    icon: "ℹ️",
    bgColor: "#3B82F6",
    textColor: "#FFFFFF",
  },
};

export function Toast({
  visible,
  type,
  title,
  message,
  duration = 3000,
  onHide,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Haptic feedback
      if (Platform.OS !== "web") {
        if (type === "success") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (type === "error") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }

      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  const config = TOAST_CONFIG[type];

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 60,
        left: 16,
        right: 16,
        zIndex: 9999,
        transform: [{ translateY }],
        opacity,
      }}
    >
      <TouchableOpacity
        onPress={hideToast}
        activeOpacity={0.9}
        style={{
          backgroundColor: config.bgColor,
          borderRadius: 16,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Text style={{ fontSize: 28, marginRight: 12 }}>{config.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: config.textColor,
              fontSize: 18,
              fontWeight: "bold",
            }}
          >
            {title}
          </Text>
          {message && (
            <Text
              style={{
                color: config.textColor,
                fontSize: 14,
                marginTop: 4,
                opacity: 0.9,
              }}
            >
              {message}
            </Text>
          )}
        </View>
        <Text style={{ color: config.textColor, fontSize: 16, opacity: 0.7 }}>
          ✕
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
