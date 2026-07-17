import { useToastsStore } from '../stores/toasts'

/** Build the shareable URL for a wheel from the running origin. */
export function shareLinkFor(wheelId: string): string {
  return `${window.location.origin}/w/${wheelId}`
}

/**
 * Reusable copy-share-link behaviour for public wheels, used by the wheel editor
 * dialog and the wheel view.
 *
 * `copyShareLink(wheelId)` writes `window.location.origin + '/w/' + id` to the
 * clipboard and confirms with a success toast. A clipboard failure (insecure
 * context, older browser, denied permission) is surfaced as a danger toast
 * rather than thrown, so callers never need a try/catch.
 */
export function useShareWheelLink() {
  const toasts = useToastsStore()

  async function copyShareLink(wheelId: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(shareLinkFor(wheelId))
      toasts.push({ title: 'Link copied', tone: 'success' })
    } catch {
      toasts.push({
        title: 'Could not copy link',
        description: 'Please try again.',
        tone: 'danger',
      })
    }
  }

  return { copyShareLink }
}
