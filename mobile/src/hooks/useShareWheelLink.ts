import { useCallback } from 'react';
import * as Clipboard from 'expo-clipboard';

import { useToast } from '@/components/design-system/feedback/ToastProvider';
import { config } from '@/config/env';

export function shareLinkFor(wheelId: string): string {
  return `${config.webAppBaseUrl}/w/${wheelId}`;
}

/** Copies a wheel's share link and toasts the outcome (clipboard failures toast instead of throwing). */
export function useShareWheelLink() {
  const { push } = useToast();

  const copyShareLink = useCallback(
    async (wheelId: string): Promise<void> => {
      try {
        await Clipboard.setStringAsync(shareLinkFor(wheelId));
        push({ title: 'Link copied', tone: 'success' });
      } catch {
        push({
          title: 'Could not copy link',
          description: 'Please try again.',
          tone: 'danger',
        });
      }
    },
    [push],
  );

  return { copyShareLink };
}
