import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '@/theme/tokens';

/**
 * Entry route. Shows a spinner while auth status hydrates from secure-store;
 * the auth gate in the root layout then redirects to (auth) or (tabs).
 */
export default function Index() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.accent7} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceApp,
  },
});
