import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useMatchSearch } from '../hooks/useMatchSearch';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';


import client from '../api/client';

type Props = {
    navigation: NativeStackNavigationProp<any>;
    route: any;
};

export const SearchingScreen = ({ navigation, route }: Props) => {
    const { search_id } = route.params;
    const [pulseAnim] = useState(new Animated.Value(0));

    const { cancelSearch } = useMatchSearch(search_id, (matchId) => {
        navigation.replace('MatchFound', { matchId });
    });

    useEffect(() => {
        Animated.loop(
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, [pulseAnim]);

    const handleCancel = async () => {
        try {
            await cancelSearch();
            navigation.goBack();
        } catch (err) {
            navigation.goBack();
        }
    };

    const renderCircles = () => {
        const circles = [0, 1, 2, 3, 4, 5, 6];
        return circles.map((i) => {
            const scale = pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3 + (i * 0.2), 0.3 + ((i + 1) * 0.2)],
            });
            const opacity = pulseAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0.4 - (i * 0.05), 0],
            });

            return (
                <Animated.View
                    key={i}
                    style={[
                        styles.radarCircle,
                        {
                            transform: [{ scale }],
                            opacity,
                        }
                    ]}
                />
            );
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Partner Aranıyor...</Text>
                <Text style={styles.subtitle}>Sana en uygun kişiyi buluyoruz.</Text>
            </View>

            <View style={styles.radarWrapper}>
                {renderCircles()}
                <View style={styles.glowingCenter} />
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelText}>Vazgeç</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bgSoft,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 100,
    },
    content: {
        alignItems: 'center',
    },
    title: {
        ...Typography.displayMd,
        color: Colors.textSerif,
        fontSize: 34,
        marginBottom: 12,
    },
    subtitle: {
        ...Typography.labelLg,
        color: Colors.textSecondary,
        fontSize: 18,
    },
    radarWrapper: {
        width: 300,
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radarCircle: {
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: 200,
        borderWidth: 1.5,
        borderColor: Colors.primary,
    },
    glowingCenter: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOpacity: 0.6,
        shadowRadius: 30,
        elevation: 15,
    },
    cancelButton: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.accentSoft,
    },
    cancelText: {
        ...Typography.labelLg,
        color: Colors.accentSoft,
        fontSize: 18,
    }
});

