import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Toast, ToastTone } from '@/components/design-system/feedback/Toast';
import { spacing } from '@/theme/tokens';

/** A queued toast plus the fields the card needs. */
interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone?: ToastTone;
}

/** What `useToast()` accepts — everything but the internally-assigned id. */
export type ToastInput = Omit<ToastItem, 'id'>;

interface ToastContextValue {
  push: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** How long a toast stays before auto-dismissing, in ms. */
const TOAST_TIMEOUT = 3500;

/**
 * App-level toast host. Mount once near the root (inside SafeAreaProvider). It
 * holds the active toasts, renders them in a fixed, safe-area-aware stack at the
 * bottom, and auto-dismisses each after a timeout. Children reach it through
 * `useToast()`. This is the mobile analog of the web's toasts store + app-shell
 * stack.
 */
export function ToastProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const insets = useSafeAreaInsets();

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast: ToastInput) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { ...toast, id }]);
      setTimeout(() => dismiss(id), TOAST_TIMEOUT);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View
        pointerEvents="box-none"
        style={[styles.stack, { bottom: insets.bottom + spacing[4] }]}
      >
        {toasts.map((t) => (
          <Toast
            key={t.id}
            title={t.title}
            description={t.description}
            tone={t.tone}
            onClose={() => dismiss(t.id)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

/** Push transient toasts. Throws if used outside a ToastProvider. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  stack: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
    alignItems: 'center',
    gap: spacing[2],
  },
});
