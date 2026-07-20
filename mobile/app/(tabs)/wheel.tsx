import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/design-system/data-display/Badge';
import { Card } from '@/components/design-system/data-display/Card';
import { Button } from '@/components/design-system/forms/Button';
import { WheelEditorDialog } from '@/components/wheel/WheelEditorDialog';
import { WheelSpinner } from '@/components/wheel/WheelSpinner';
import { useWheels } from '@/hooks/useWheels';
import { useDeleteWheel } from '@/hooks/useWheelMutations';
import { useShareWheelLink } from '@/hooks/useShareWheelLink';
import type { UserWheel } from '@/types/wheel';
import { colors, fonts, spacing, typography } from '@/theme/tokens';

/**
 * Wheel tab: a list of saved wheels (each a Card with Spin / Edit / Delete, plus
 * a Share action when public), a "New wheel" action opening the editor, and a
 * selected-wheel view showing its WheelSpinner.
 */
export default function WheelScreen() {
  const { data: wheels, isLoading, isError, error } = useWheels();
  const remove = useDeleteWheel();
  const { copyShareLink } = useShareWheelLink();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<UserWheel | null>(null);
  const [spinningId, setSpinningId] = useState<string | null>(null);

  const spinningWheel = useMemo(
    () => wheels?.find((w: UserWheel) => w.id === spinningId) ?? null,
    [wheels, spinningId],
  );

  function openNew() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(wheel: UserWheel) {
    setEditing(wheel);
    setEditorOpen(true);
  }

  function renderItem({ item }: { item: UserWheel }) {
    return (
      <Card padding={spacing[4]}>
        <View style={styles.cardHeader}>
          <Text style={styles.wheelName}>{item.name}</Text>
          {item.isPublic && <Badge tone="accent">Public</Badge>}
        </View>
        <Text style={styles.wheelMeta}>{item.restaurantNames.length} restaurants</Text>
        <View style={styles.actions}>
          <Button variant="primary" size="sm" onPress={() => setSpinningId(item.id)}>
            Spin
          </Button>
          <Button variant="secondary" size="sm" onPress={() => openEdit(item)}>
            Edit
          </Button>
          {item.isPublic && (
            <Button
              variant="ghost"
              size="sm"
              icon="arrow-right"
              iconPosition="right"
              onPress={() => copyShareLink(item.id)}
            >
              Share
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            icon="bin"
            onPress={() =>
              remove.mutate({ id: item.id, concurrencyToken: item.concurrencyToken })
            }
            accessibilityLabel={`Delete ${item.name}`}
          >
            Delete
          </Button>
        </View>
      </Card>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {spinningWheel ? (
        <View style={styles.spinnerView}>
          <Button variant="ghost" size="sm" icon="chevron-up" onPress={() => setSpinningId(null)}>
            Back to wheels
          </Button>
          <Text style={styles.spinnerTitle}>{spinningWheel.name}</Text>
          <WheelSpinner names={spinningWheel.restaurantNames} />
        </View>
      ) : (
        <>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Wheel</Text>
            <Button variant="primary" size="sm" icon="plus" onPress={openNew}>
              New wheel
            </Button>
          </View>

          {isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.accent7} />
            </View>
          ) : isError ? (
            <View style={styles.centered}>
              <Text style={styles.error}>
                {error instanceof Error ? error.message : "Couldn't load wheels."}
              </Text>
            </View>
          ) : (
            <FlatList
              data={wheels}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <View style={styles.centered}>
                  <Text style={styles.empty}>No wheels yet. Create one to get spinning.</Text>
                </View>
              }
            />
          )}
        </>
      )}

      {editorOpen && (
        <WheelEditorDialog open onClose={() => setEditorOpen(false)} wheel={editing} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surfaceApp,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontWeight: typography.weight.bold,
    fontSize: typography.size['2xl'],
    color: colors.textPrimary,
  },
  list: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
    gap: spacing[3],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  wheelName: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
  },
  wheelMeta: {
    fontFamily: fonts.body,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: spacing[1],
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  spinnerView: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[4],
    padding: spacing[6],
  },
  spinnerTitle: {
    fontFamily: fonts.display,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: typography.size.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  error: {
    fontFamily: fonts.body,
    fontSize: typography.size.base,
    color: colors.statusDanger,
    textAlign: 'center',
  },
});
