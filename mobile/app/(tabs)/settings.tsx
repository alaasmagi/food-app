import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/components/design-system/feedback/ToastProvider';
import { Button } from '@/components/design-system/forms/Button';
import { Select, type SelectOption } from '@/components/design-system/forms/Select';
import { Switch } from '@/components/design-system/forms/Switch';
import { useAuth } from '@/auth/AuthContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEnvironments } from '@/hooks/useEnvironments';
import { useUpdateNotificationPreferences } from '@/hooks/useUpdateNotificationPreferences';
import type { DiningEnvironment } from '@/types/environment';
import { colors, fonts, spacing, typography } from '@/theme/tokens';

/** Select value standing in for `notificationEnvironmentId === null` ("all"). */
const ALL_VALUE = '__all__';

/**
 * Settings: the daily-email notification preferences plus log out. A switch for
 * `sendNotifications` and an environment select (fixed "All environments" plus
 * one per dining environment, disabled when notifications are off). Prefills
 * from the current user; saving persists and confirms with a toast.
 */
export default function SettingsScreen() {
  const { logout } = useAuth();
  const { data: user, isLoading } = useCurrentUser();
  const { data: environments } = useEnvironments();
  const save = useUpdateNotificationPreferences();
  const { push } = useToast();

  const [sendNotifications, setSendNotifications] = useState(false);
  const [envValue, setEnvValue] = useState<string>(ALL_VALUE);

  // Prefill from the current user once it loads (and if it changes).
  useEffect(() => {
    if (user) {
      setSendNotifications(user.sendNotifications);
      setEnvValue(user.notificationEnvironmentId ?? ALL_VALUE);
    }
  }, [user]);

  const options: SelectOption[] = useMemo(
    () => [
      { value: ALL_VALUE, label: 'All environments' },
      ...(environments ?? []).map((e: DiningEnvironment) => ({ value: e.id, label: e.name })),
    ],
    [environments],
  );

  // Fall back to "All environments" if the saved id is not among current options
  // (e.g. its environment was deleted).
  const selectValue = options.some((o) => o.value === envValue) ? envValue : ALL_VALUE;

  function handleSave() {
    if (save.isPending) return;
    const notificationEnvironmentId = selectValue === ALL_VALUE ? null : selectValue;
    save.mutate(
      { sendNotifications, notificationEnvironmentId },
      {
        onSuccess: () => push({ title: 'Settings saved', tone: 'success' }),
        onError: () =>
          push({
            title: 'Could not save settings',
            description: 'Please try again.',
            tone: 'danger',
          }),
      },
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Settings</Text>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent7} />
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily email</Text>
            <Switch
              label="Send me the daily recommendation email"
              checked={sendNotifications}
              onChange={setSendNotifications}
            />
            <Select
              label="Cover"
              options={options}
              value={selectValue}
              onChange={setEnvValue}
              disabled={!sendNotifications}
            />
          </View>

          <Button variant="primary" onPress={handleSave} loading={save.isPending}>
            Save
          </Button>
        </View>
      )}

      <View style={styles.footer}>
        <Button variant="secondary" icon="lock" onPress={logout} accessibilityLabel="Log out">
          Log out
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
  title: {
    fontFamily: fonts.bodyBold,
    fontWeight: typography.weight.bold,
    fontSize: typography.size['2xl'],
    color: colors.textPrimary,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing[6],
    gap: spacing[6],
  },
  section: {
    gap: spacing[4],
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  footer: {
    padding: spacing[6],
  },
});
