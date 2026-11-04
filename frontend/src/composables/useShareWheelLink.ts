import { useToastsStore } from '../stores/toasts'

export function shareLinkFor(wheelId: string): string {
  return `${window.location.origin}/w/${wheelId}`
}

/** Copies a public wheel's share link; clipboard failures become a danger toast instead of throwing. */
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
