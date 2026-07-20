import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

/**
 * Ported from alaasmagi-design-system Icon.jsx. The `.d.ts` there is stale
 * (14 names); the JSX PATHS map is authoritative, so the name union below
 * covers all 27 glyphs. Web inline-SVG becomes react-native-svg; the web
 * `currentColor` default becomes an explicit theme color.
 */
export type IconName =
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-up'
  | 'check'
  | 'x'
  | 'plus'
  | 'minus'
  | 'search'
  | 'info'
  | 'alert-triangle'
  | 'alert-circle'
  | 'check-circle'
  | 'arrow-right'
  | 'spinner'
  | 'lock'
  | 'key'
  | 'mail'
  | 'person'
  | 'bin'
  | 'code'
  | 'work'
  | 'school'
  | 'pincode'
  | 'account-settings'
  | 'visibility-on'
  | 'visibility-off'
  | 'zoom';

export interface IconProps {
  /** Which glyph to render. */
  name: IconName;
  /** Pixel size (square). Default 16. */
  size?: number;
  /** Stroke width. Default 2. */
  strokeWidth?: number;
  /** Stroke color. Defaults to the primary text token. */
  color?: string;
  style?: StyleProp<ViewStyle>;
}

const PATHS: Record<IconName, React.ReactNode> = {
  'chevron-down': <Polyline points="6 9 12 15 18 9" />,
  'chevron-right': <Polyline points="9 18 15 12 9 6" />,
  'chevron-up': <Polyline points="18 15 12 9 6 15" />,
  check: <Polyline points="20 6 9 17 4 12" />,
  x: (
    <>
      <Line x1="18" y1="6" x2="6" y2="18" />
      <Line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  plus: (
    <>
      <Line x1="12" y1="5" x2="12" y2="19" />
      <Line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  minus: <Line x1="5" y1="12" x2="19" y2="12" />,
  search: (
    <>
      <Circle cx="11" cy="11" r="8" />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  info: (
    <>
      <Circle cx="12" cy="12" r="10" />
      <Line x1="12" y1="16" x2="12" y2="11" />
      <Line x1="12" y1="8" x2="12" y2="8" />
    </>
  ),
  'alert-triangle': (
    <>
      <Path d="M12 3 L21.5 20 H2.5 Z" />
      <Line x1="12" y1="10" x2="12" y2="14" />
      <Line x1="12" y1="17.5" x2="12" y2="17.5" />
    </>
  ),
  'alert-circle': (
    <>
      <Circle cx="12" cy="12" r="10" />
      <Line x1="12" y1="8" x2="12" y2="12.5" />
      <Line x1="12" y1="16" x2="12" y2="16" />
    </>
  ),
  'check-circle': (
    <>
      <Circle cx="12" cy="12" r="10" />
      <Polyline points="8 12.5 11 15.5 16 9" />
    </>
  ),
  'arrow-right': (
    <>
      <Line x1="5" y1="12" x2="19" y2="12" />
      <Polyline points="12 5 19 12 12 19" />
    </>
  ),
  spinner: (
    <>
      <Circle cx="12" cy="12" r="9" opacity={0.25} />
      <Path d="M21 12a9 9 0 0 0-9-9" />
    </>
  ),
  lock: (
    <>
      <Rect x="5" y="11" width="14" height="10" rx="2" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  key: (
    <>
      <Circle cx="7" cy="17" r="4" />
      <Line x1="10" y1="14" x2="21" y2="3" />
      <Line x1="15" y1="9" x2="18" y2="12" />
      <Line x1="18" y1="6" x2="21" y2="9" />
    </>
  ),
  mail: (
    <>
      <Rect x="3" y="5" width="18" height="14" rx="2" />
      <Polyline points="3 7 12 13 21 7" />
    </>
  ),
  person: (
    <>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
    </>
  ),
  bin: (
    <>
      <Path d="M9 7V4h6v3" />
      <Path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
      <Line x1="4" y1="7" x2="20" y2="7" />
      <Line x1="10" y1="11" x2="10" y2="17" />
      <Line x1="14" y1="11" x2="14" y2="17" />
    </>
  ),
  code: (
    <>
      <Polyline points="8 6 3 12 8 18" />
      <Polyline points="16 6 21 12 16 18" />
    </>
  ),
  work: (
    <>
      <Rect x="3" y="8" width="18" height="12" rx="2" />
      <Path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <Line x1="3" y1="13" x2="21" y2="13" />
    </>
  ),
  school: (
    <>
      <Path d="M12 3 2 8l10 5 10-5-10-5Z" />
      <Path d="M6 10.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-5.5" />
    </>
  ),
  pincode: (
    <>
      {[6, 12, 18].map((cy) =>
        [7, 12, 17].map((cx) => (
          <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.5" fill="currentColor" stroke="none" />
        )),
      )}
    </>
  ),
  'account-settings': (
    <>
      <Circle cx="12" cy="12" r="3" />
      <Path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </>
  ),
  'visibility-on': (
    <>
      <Path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
      <Circle cx="12" cy="12" r="3" />
    </>
  ),
  'visibility-off': (
    <>
      <Path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
      <Circle cx="12" cy="12" r="3" />
      <Line x1="3" y1="3" x2="21" y2="21" />
    </>
  ),
  zoom: (
    <>
      <Circle cx="10" cy="10" r="7" />
      <Line x1="10" y1="7" x2="10" y2="13" />
      <Line x1="7" y1="10" x2="13" y2="10" />
      <Line x1="21" y1="21" x2="15.5" y2="15.5" />
    </>
  ),
};

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export function Icon({
  name,
  size = 16,
  strokeWidth = 2,
  color = colors.textPrimary,
  style,
}: IconProps): React.ReactElement | null {
  const glyph = PATHS[name];
  const spin = name === 'spinner';
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!spin) return;
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin, rotation]);

  if (!glyph) return null;

  const spinStyle = spin
    ? {
        transform: [
          {
            rotate: rotation.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg'],
            }),
          },
        ],
      }
    : undefined;

  return (
    <AnimatedSvg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      // `currentColor` in filled glyphs (pincode) resolves via the `color` prop.
      color={color}
      style={[spinStyle, style]}
    >
      {glyph}
    </AnimatedSvg>
  );
}
