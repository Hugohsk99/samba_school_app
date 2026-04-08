import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { DataProvider } from "@/lib/data-context";
import { EscolaProvider } from "@/lib/escola-context";
import { ToastProvider } from "@/lib/toast-context";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { FinanceiroProvider } from "@/lib/financeiro-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  initialRouteName: "index",
};

/**
 * Navigation guard: redirects based on auth state and user status
 * 
 * Rules:
 * 1. Not logged in + protected route → /landing
 * 2. Logged in + no escola selected + protected route → /landing  
 * 3. Logged in + pendente + in (tabs) → /status-cadastro
 * 4. Public routes (landing, login, cadastro, etc.) → always allowed
 */
function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading, sessao, usuario } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasEscola, setHasEscola] = useState(false);

  // Check escola selection - re-runs whenever isLoggedIn or sessao changes
  // This ensures that after logout (isLoggedIn becomes false, sessao becomes null),
  // we re-read AsyncStorage and find escola was cleared
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const val = await AsyncStorage.getItem("@samba_escola_selecionada");
        if (!cancelled) {
          setHasEscola(!!val);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setHasEscola(false);
          setReady(true);
        }
      }
    };
    check();
    return () => { cancelled = true; };
  }, [isLoggedIn, sessao]);

  useEffect(() => {
    if (isLoading || !ready) return;

    const seg = segments[0] as string | undefined;

    // Define public routes that don't require authentication
    const PUBLIC_ROUTES = [
      undefined, "", "index", "landing", "login-cpf", 
      "cadastro-integrante", "status-cadastro", "contato-associacao",
      "registro-diretor-carnaval", "oauth",
    ];
    const isPublic = PUBLIC_ROUTES.includes(seg as any);

    // Rule 1 & 2: Protected route but not authenticated or no escola → landing
    if (!isPublic && (!isLoggedIn || !hasEscola)) {
      router.replace("/landing" as any);
      return;
    }

    // Rule 3: Logged in but pending → status-cadastro
    if (isLoggedIn && seg === "(tabs)") {
      const status = usuario?.statusUsuario || sessao?.statusUsuario;
      if (status === "pendente") {
        router.replace({
          pathname: "/status-cadastro" as any,
          params: { cpf: usuario?.cpf || sessao?.cpf || "" },
        });
        return;
      }
    }
  }, [isLoggedIn, isLoading, segments, usuario, sessao, ready, hasEscola]);

  return <>{children}</>;
}

/**
 * Inner layout that uses AuthProvider inside tRPC context
 */
function InnerLayout() {
  return (
    <AuthProvider>
      <NavigationGuard>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Root redirect to landing */}
          <Stack.Screen name="index" />
          {/* Landing - escola selection */}
          <Stack.Screen name="landing" />
          {/* Login CPF + Senha */}
          <Stack.Screen name="login-cpf" />
          {/* Self-registration with PIX */}
          <Stack.Screen name="cadastro-integrante" />
          {/* Registration status */}
          <Stack.Screen name="status-cadastro" />
          {/* Contact/association */}
          <Stack.Screen name="contato-associacao" />
          {/* First director registration */}
          <Stack.Screen name="registro-diretor-carnaval" />
          {/* Main app tabs (protected) */}
          <Stack.Screen name="(tabs)" />
          {/* OAuth callback */}
          <Stack.Screen name="oauth/callback" />
        </Stack>
      </NavigationGuard>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  // Ensure minimum padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <InnerLayout />
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <EscolaProvider>
          <DataProvider>
            <FinanceiroProvider>
              <ToastProvider>
                <SafeAreaProvider initialMetrics={providerInitialMetrics}>
                  <SafeAreaFrameContext.Provider value={frame}>
                    <SafeAreaInsetsContext.Provider value={insets}>
                      {content}
                    </SafeAreaInsetsContext.Provider>
                  </SafeAreaFrameContext.Provider>
                </SafeAreaProvider>
              </ToastProvider>
            </FinanceiroProvider>
          </DataProvider>
        </EscolaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <EscolaProvider>
        <DataProvider>
          <FinanceiroProvider>
            <ToastProvider>
              <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
            </ToastProvider>
          </FinanceiroProvider>
        </DataProvider>
      </EscolaProvider>
    </ThemeProvider>
  );
}
