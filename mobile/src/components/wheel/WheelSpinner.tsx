import React, { useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import { Button } from '@/components/design-system/forms/Button';
import { colors, fonts, radius, spacing, typography } from '@/theme/tokens';

export interface WheelSpinnerProps {
  names: string[];
  /** Called with the chosen name when a spin settles. */
  onResult?: (name: string) => void;
}

const SIZE = 260;
const VIEW = 200;
const CENTER = 100;
const RADIUS = 92;
const LABEL_RADIUS = 60;

// Token-only segment palette (no hardcoded colors), cycled by index.
const PALETTE = [
  colors.accent7,
  colors.statusSuccess,
  colors.statusWarning,
  colors.statusDanger,
  colors.accent5,
  colors.neutral5,
];

function pointAt(angleDeg: number, r: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  // Angle measured clockwise from the top (12 o'clock).
  return [CENTER + r * Math.sin(rad), CENTER - r * Math.cos(rad)];
}

/**
 * Native spinning wheel. Mirrors the web spinner's geometry (one SVG arc
 * segment per name, token-cycled palette) but rotates an Animated layer holding
 * the segments while the pointer and hub stay static on top. `spin()` picks a
 * name client-side and animates a multi-turn ease-out landing that segment
 * under the top pointer, then reports the winner. Needs at least 2 names.
 */
export function WheelSpinner({ names, onResult }: WheelSpinnerProps): React.ReactElement {
  const rotation = useRef(new Animated.Value(0)).current;
  const rotationDeg = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const canSpin = names.length >= 2 && !spinning;

  const segments = useMemo(() => {
    const n = names.length;
    const seg = 360 / n;
    return names.map((name, i) => {
      const [x1, y1] = pointAt(i * seg, RADIUS);
      const [x2, y2] = pointAt((i + 1) * seg, RADIUS);
      const largeArc = seg > 180 ? 1 : 0;
      const [lx, ly] = pointAt(i * seg + seg / 2, LABEL_RADIUS);
      return {
        name,
        path: `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`,
        color: PALETTE[i % PALETTE.length],
        label: name.length > 12 ? `${name.slice(0, 11)}…` : name,
        lx,
        ly,
      };
    });
  }, [names]);

  // A single interpolation maps any absolute degree value to a rotate string
  // (linear extrapolation extends past 360), so multi-turn targets just work.
  const rotate = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  function spin() {
    if (!canSpin) return;
    const n = names.length;
    const chosen = Math.floor(Math.random() * n);
    const seg = 360 / n;
    const center = (chosen + 0.5) * seg;
    // Land the chosen segment's centre under the top pointer: rotation ≡ -center (mod 360).
    const currentMod = ((rotationDeg.current % 360) + 360) % 360;
    const desiredMod = (((-center) % 360) + 360) % 360;
    let delta = desiredMod - currentMod;
    if (delta < 0) delta += 360;
    const target = rotationDeg.current + delta + 360 * 5;
    rotationDeg.current = target;

    setResult(null);
    setSpinning(true);
    Animated.timing(rotation, {
      toValue: target,
      duration: 3200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setSpinning(false);
      setResult(names[chosen]);
      onResult?.(names[chosen]);
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.wheelWrap}>
        <View style={styles.pointer} />
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${VIEW} ${VIEW}`}>
            {segments.map((s) => (
              <G key={s.name}>
                <Path d={s.path} fill={s.color} stroke={colors.surfaceApp} strokeWidth={1} />
                <SvgText
                  x={s.lx}
                  y={s.ly}
                  fill={colors.textOnAccent}
                  fontSize={7}
                  fontFamily={fonts.bodySemibold}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {s.label}
                </SvgText>
              </G>
            ))}
          </Svg>
        </Animated.View>
        {/* Static rim + hub drawn over the rotor. */}
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${VIEW} ${VIEW}`} style={StyleSheet.absoluteFill}>
          <Circle cx={CENTER} cy={CENTER} r={93} fill="none" stroke={colors.borderSubtle} strokeWidth={2} />
          <Circle cx={CENTER} cy={CENTER} r={10} fill={colors.surfaceRaised} stroke={colors.borderStrong} strokeWidth={1.5} />
          <Circle cx={CENTER} cy={CENTER} r={3.5} fill={colors.accent7} />
        </Svg>
      </View>

      <View style={styles.controls}>
        <Button variant="primary" onPress={spin} disabled={!canSpin} loading={spinning}>
          Spin
        </Button>
        {result ? (
          <View style={styles.result}>
            <Text style={styles.resultTag}>Winner</Text>
            <Text style={styles.resultName}>{result}</Text>
          </View>
        ) : names.length < 2 ? (
          <Text style={styles.hint}>Add at least 2 restaurants to spin.</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing[5],
  },
  wheelWrap: {
    width: SIZE,
    height: SIZE,
    maxWidth: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointer: {
    position: 'absolute',
    top: -2,
    zIndex: 1,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.textPrimary,
  },
  controls: {
    alignItems: 'center',
    gap: spacing[2],
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  resultTag: {
    paddingVertical: 2,
    paddingHorizontal: spacing[2],
    fontFamily: fonts.bodySemibold,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.size.xs * typography.tracking.wide,
    color: colors.textOnAccent,
    backgroundColor: colors.accent7,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  resultName: {
    fontFamily: fonts.display,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
});
