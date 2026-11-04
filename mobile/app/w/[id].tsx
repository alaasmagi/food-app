import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { WheelSpinner } from '@/components/wheel/WheelSpinner';
import { usePublicWheel } from '@/hooks/usePublicWheel';
import { colors, fonts, spacing, typography } from '@/theme/tokens';

/** Public shared-wheel route (`foodroulette://w/<id>`), outside the auth gate and tab shell. */
export default function SharedWheelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: wheel, isLoading, isError } = usePublicWheel(id);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator color={colors.accent7} />
        ) : isError ? (
          <Text style={styles.message}>Couldn't load this wheel.</Text>
        ) : wheel == null ? (
          <Text style={styles.message}>This wheel isn't available.</Text>
        ) : (
          <>
            <Text style={styles.title}>{wheel.name}</Text>
            <WheelSpinner names={wheel.restaurantNames} />
          </>
        )}
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[5],
    padding: spacing[6],
  },
  title: {
    fontFamily: fonts.display,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.body,
    fontSize: typography.size.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
