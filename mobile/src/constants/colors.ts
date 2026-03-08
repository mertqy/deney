import { useColorScheme } from 'react-native';

const lightColors = {
    primary: '#ea2a33',
    primaryDark: '#c9202a',
    primaryLight: '#fdebed',
    bgMain: '#f8f6f6',
    bgCard: '#FFFFFF',
    bgDark: '#12151c',
    textPrimary: '#1a202c',
    textSecondary: '#718096',
    border: 'rgba(26,32,44,0.08)',
    success: '#4CC47A',
    warning: '#F7B731',
    error: '#ea2a33',
    bgSoft: '#f8f6f6',
    bgCardSoft: '#FFFFFF',
    accentSoft: '#fca5a5',
    accentSoftLight: '#fee2e2',
    textSerif: '#1a202c',
    gradientPrimary: ['#ff4d4f', '#ea2a33'],
    gradientSoft: ['#ff7875', '#ea2a33'],
};

const darkColors = {
    primary: '#ea2a33',
    primaryDark: '#c9202a',
    primaryLight: '#5c171a',
    bgMain: '#12151c',
    bgCard: '#1a202c',
    bgDark: '#0a0c10',
    textPrimary: '#f8f6f6',
    textSecondary: '#a0aec0',
    border: 'rgba(248,246,246,0.1)',
    success: '#4CC47A',
    warning: '#F7B731',
    error: '#ff4d4f',
    bgSoft: '#161a23',
    bgCardSoft: '#202735',
    accentSoft: '#8c2429',
    accentSoftLight: '#4a1619',
    textSerif: '#f8f6f6',
    gradientPrimary: ['#ff4d4f', '#ea2a33'],
    gradientSoft: ['#ff7875', '#ea2a33'],
};

// Geriye dönük uyumluluk ve varsayılan tema için
export const Colors = lightColors;

export const useThemeColor = () => {
    const scheme = useColorScheme();
    return scheme === 'dark' ? darkColors : lightColors;
};
