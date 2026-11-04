import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '@/theme/tokens';

/** Entry route: a spinner while auth hydrates; the root auth gate then redirects. */
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
