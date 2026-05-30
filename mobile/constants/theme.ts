/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#3D2B1F';
const tintColorDark = '#FFFDF9';

export const Colors = {
  light: {
    text: '#1C1C1E',
    background: '#FFFFFF',
    tint: '#C5A059',
    icon: '#D4AF37', // Shiny Gold
    tabIconDefault: '#8E8E93',
    tabIconSelected: '#D4AF37',
    cardBackground: '#FAF9F6',
    border: 'rgba(212, 175, 55, 0.25)', // Subtle gold border
  },
  dark: {
    text: '#F2F2F7',
    background: '#1C1C1E',
    tint: '#D4AF37',
    icon: '#D4AF37',
    tabIconDefault: '#8E8E93',
    tabIconSelected: '#D4AF37',
    cardBackground: '#2C2C2E',
    border: 'rgba(212, 175, 55, 0.4)',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
