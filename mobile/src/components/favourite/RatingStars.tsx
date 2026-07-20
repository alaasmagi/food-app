import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

export interface RatingStarsProps {
  /** Current rating (0-5). Stars up to this value render filled. */
  value: number;
  /** Editable press-to-set mode; otherwise a read-only display. Default false. */
  editable?: boolean;
  /** Pixel size (square) of each star. Default 20. */
  size?: number;
  /** Called with the rating n when the nth star is activated (editable only). */
  onChange?: (value: number) => void;
}

const STARS = [1, 2, 3, 4, 5];
// The design-system Icon set has no star, so RatingStars draws its own glyph,
// matching the web control: filled for selected, outline otherwise.
const STAR_PATH =
  'M12 2l2.9 6.26 6.9.53-5.2 4.52 1.6 6.79L12 17.27 5.8 20.6l1.6-6.79L2.2 8.79l6.9-.53L12 2z';

/**
 * Five-star rating control. Read-only by default; in editable mode each star is
 * a Pressable that reports its value n. The glyph is a self-drawn SVG star
 * (warning tone when filled, muted border when empty).
 */
export function RatingStars({
  value,
  editable = false,
  size = 20,
  onChange,
}: RatingStarsProps): React.ReactElement {
  return (
    <View style={styles.row} accessibilityRole={editable ? undefined : 'image'}>
      {STARS.map((n) => {
        const filled = n <= value;
        const glyph = (
          <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path
              d={STAR_PATH}
              fill={filled ? colors.statusWarning : 'none'}
              stroke={filled ? colors.statusWarning : colors.borderStrong}
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          </Svg>
        );

        if (editable) {
          return (
            <Pressable
              key={n}
              onPress={() => onChange?.(n)}
              accessibilityRole="button"
              accessibilityLabel={`Rate ${n}`}
              hitSlop={4}
              style={styles.star}
            >
              {glyph}
            </Pressable>
          );
        }

        return (
          <View key={n} style={styles.star}>
            {glyph}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    padding: 0,
  },
});
