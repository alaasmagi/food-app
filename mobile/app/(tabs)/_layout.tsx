import { Tabs } from 'expo-router';

import { Icon, IconName } from '@/components/design-system/icons/Icon';
import { colors, fonts, typography } from '@/theme/tokens';

/**
 * Authenticated tab shell: Dashboard, Map, Wheel, Settings. Dark theme, and
 * safe-area insets are handled by expo-router's Tabs (which sits inside the
 * SafeAreaProvider). Icons are placeholders from the ported set until feature
 * changes introduce dedicated glyphs.
 */
function tabIcon(name: IconName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Icon name={name} color={color} size={size} />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.surfaceApp },
        tabBarActiveTintColor: colors.accent9,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surfaceRaised,
          borderTopColor: colors.borderSubtle,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bodyMedium,
          fontSize: typography.size['2xs'],
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard', tabBarIcon: tabIcon('work') }}
      />
      <Tabs.Screen
        name="map"
        options={{ title: 'Map', tabBarIcon: tabIcon('zoom') }}
      />
      <Tabs.Screen
        name="wheel"
        options={{ title: 'Wheel', tabBarIcon: tabIcon('arrow-right') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: tabIcon('account-settings') }}
      />
    </Tabs>
  );
}
