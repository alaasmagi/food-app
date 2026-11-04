import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Toast, ToastTone } from '@/components/design-system/feedback/Toast';
import { spacing } from '@/theme/tokens';

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone?: ToastTone;
}

export type ToastInput = Omit<ToastItem, 'id'>;

interface ToastContextValue {
  push: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_TIMEOUT = 3500;

/** App-level toast host; mount once inside SafeAreaProvider and push via `useToast()`. */
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
