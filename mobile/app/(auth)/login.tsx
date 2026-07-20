import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/design-system/forms/Button';
import { useAuth } from '@/auth/AuthContext';
import { colors, fonts, spacing, typography } from '@/theme/tokens';

/**
 * Minimal dark login screen: a single "Log in" button that starts the OAuth
 * PKCE flow. All feature content lives behind authentication.
 */
export default function LoginScreen() {
  const { login } = useAuth();
  const [busy, setBusy] = useState(false);

  const onLogin = async () => {
    setBusy(true);
    try {
      await login();
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>FoodRoulette</Text>
          <Text style={styles.subtitle}>Sign in to see today's lunch offers.</Text>
        </View>
        <Button
          variant="primary"
          size="lg"
          icon="lock"
          fullWidth
          loading={busy}
          onPress={onLogin}
          accessibilityLabel="Log in"
        >
          Log in
        </Button>
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
    justifyContent: 'center',
    gap: spacing[8],
    paddingHorizontal: spacing[6],
  },
  header: {
    gap: spacing[2],
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontWeight: typography.weight.bold,
    fontSize: typography.size['3xl'],
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: typography.size.md,
    color: colors.textSecondary,
  },
});
