import {
  useFonts,
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';

/**
 * Loads the design system's font families (Figtree for display/body,
 * JetBrains Mono for mono) so the family names referenced in tokens.ts
 * resolve. Returns [loaded, error] from expo-font's useFonts.
 */
export function useAppFonts(): [boolean, Error | null] {
  return useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    JetBrainsMono_400Regular,
  });
}
