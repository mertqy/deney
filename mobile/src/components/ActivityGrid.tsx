import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColor } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Ionicons } from '@expo/vector-icons';

export const ACTIVITIES = [
    { slug: 'coffee', label: 'Kahve', icon: 'cafe-outline' },
    { slug: 'movie', label: 'Film', icon: 'film-outline' },
    { slug: 'hike', label: 'Yürüyüş', icon: 'footsteps-outline' },
    { slug: 'food', label: 'Yemek', icon: 'restaurant-outline' },
    { slug: 'concert', label: 'Konser', icon: 'musical-notes-outline' },
    { slug: 'book', label: 'Kitap', icon: 'book-outline' },
    { slug: 'sport', label: 'Spor', icon: 'football-outline' },
    { slug: 'art', label: 'Sanat', icon: 'color-palette-outline' },
];

type Props = {
    selectedSlug: string | null;
    onSelect: (slug: string) => void;
};

export const ActivityGrid = ({ selectedSlug, onSelect }: Props) => {
    const Colors = useThemeColor();
    const styles = getStyles(Colors);
    return (
        <View style={styles.grid}>
            {ACTIVITIES.map((act) => {
                const isSelected = act.slug === selectedSlug;
                return (
                    <TouchableOpacity
                        key={act.slug}
                        style={[styles.card, isSelected && styles.cardSelected]}
                        onPress={() => onSelect(act.slug)}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons
                                name={act.icon as any}
                                size={32}
                                color={isSelected ? Colors.primary : Colors.accentSoft}
                            />
                        </View>
                        <Text style={[styles.label, isSelected && styles.labelSelected]}>
                            {act.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const getStyles = (Colors: any) => StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 32,
        paddingHorizontal: 4,
    },
    card: {
        width: '23%',
        aspectRatio: 0.9,
        backgroundColor: Colors.bgCardSoft,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        // Soft Shadow
        shadowColor: '#AF7D61',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(175, 125, 97, 0.05)',
    },
    cardSelected: {
        backgroundColor: '#FFF',
        borderColor: Colors.primary,
        borderWidth: 1,
        elevation: 5,
        shadowOpacity: 0.2,
    },
    iconContainer: {
        marginBottom: 8,
    },
    label: {
        ...Typography.labelSm,
        color: Colors.accentSoft,
        fontSize: 13,
    },
    labelSelected: {
        color: Colors.primary,
        fontWeight: 'bold',
    },
});

