import { useColorScheme } from 'react-native';

const lightColors = {
    primary: '#E8834A',
    primaryDark: '#D4632A',
    primaryLight: '#FDE8D0',
    bgMain: '#F7F0E6',
    bgCard: '#FFFFFF',
    bgDark: '#0E0B07',
    textPrimary: '#2A1F12',
    textSecondary: '#9A8A72',
    border: 'rgba(42,31,18,0.08)',
    success: '#4CC47A',
    warning: '#F7B731',
    error: '#FF4757',
    bgSoft: '#F9F5F1',
    bgCardSoft: '#FDFCFB',
    accentSoft: '#AF7D61',
    accentSoftLight: '#F3E9E0',
    textSerif: '#2A1F12',
    gradientPrimary: ['#E8834A', '#D4632A'],
    gradientSoft: ['#F2A87B', '#E8834A'],
};

const darkColors = {
    primary: '#E8834A',
    primaryDark: '#D4632A',
    primaryLight: '#5A3D2A',
    bgMain: '#1A1816',
    bgCard: '#25221F',
    bgDark: '#0E0B07',
    textPrimary: '#F7F0E6',
    textSecondary: '#BFB5A8',
    border: 'rgba(247,240,230,0.1)',
    success: '#4CC47A',
    warning: '#F7B731',
    error: '#FF4757',
    bgSoft: '#221F1C',
    bgCardSoft: '#2C2824',
    accentSoft: '#C29881',
    accentSoftLight: '#624B3E',
    textSerif: '#F7F0E6',
    gradientPrimary: ['#E8834A', '#D4632A'],
    gradientSoft: ['#F2A87B', '#E8834A'],
};

// Geriye dönük uyumluluk ve varsayılan tema için
export const Colors = lightColors;

export const useThemeColor = () => {
    const scheme = useColorScheme();
    return scheme === 'dark' ? darkColors : lightColors;
};
