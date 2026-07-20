import { useCallback } from 'react';
import * as Clipboard from 'expo-clipboard';

import { useToast } from '@/components/design-system/feedback/ToastProvider';
import { config } from '@/config/env';

/** Build the shareable URL for a wheel from the configured web app base. */
export function shareLinkFor(wheelId: string): string {
  return `${config.webAppBaseUrl}/w/${wheelId}`;
}

/**
 * Reusable copy-share-link behaviour for public wheels, used by the wheel
 * editor dialog and the wheel tab screen. `copyShareLink(wheelId)` writes
 * `<webAppBaseUrl>/w/<id>` to the clipboard and confirms with a success toast.
 * A clipboard failure is surfaced as a danger toast rather than thrown, so
 * callers never need a try/catch.
 */
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
