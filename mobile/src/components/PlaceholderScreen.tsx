import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, spacing, typography } from '@/theme/tokens';

/**
 * Empty placeholder used by tab routes whose real content lands in later
 * feature changes. Keeps the navigator rendering without stubbing feature UI.
 */
export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>Coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surfaceApp,
  },
  content: {
    flex: 1,
    padding: spacing[6],
    gap: spacing[2],
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontWeight: typography.weight.bold,
    fontSize: typography.size['2xl'],
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: typography.size.base,
    color: colors.textSecondary,
  },
});
