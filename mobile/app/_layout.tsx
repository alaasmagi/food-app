import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '@/api/queryClient';
import { AuthProvider } from '@/auth/AuthContext';
import { authRedirectTarget } from '@/auth/authGate';
import { ToastProvider } from '@/components/design-system/feedback/ToastProvider';
import { useAppFonts } from '@/theme/fonts';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore — splash may already be hidden */
});

/**
 * Auth gate: redirects between the (auth) and (tabs) route groups whenever the
 * auth status settles. While `loading`, it waits so we never flash the login
 * screen before secure-store hydration completes.
 */
function useAuthGate() {
  const status = useAuthStore((s) => s.status);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const target = authRedirectTarget(status, segments as string[]);
    if (target) {
      router.replace(target);
    }
  }, [status, segments, router]);
}

function RootNavigator() {
  useAuthGate();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surfaceApp } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      {/* Public shared-wheel deep-link route, reachable without auth. */}
      <Stack.Screen name="w/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {
        /* ignore */
      });
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <StatusBar style="light" />
            <RootNavigator />
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
