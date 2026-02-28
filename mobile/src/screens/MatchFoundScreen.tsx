import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useThemeColor } from '../constants/colors';
import { Typography } from '../constants/typography';
import client from '../api/client';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useMatch } from '../hooks/useMatch';


type Props = {
    navigation: NativeStackNavigationProp<any>;
    route: any;
};

export const MatchFoundScreen = ({ navigation, route }: Props) => {
    const Colors = useThemeColor();
    const styles = getStyles(Colors);
    const { matchId } = route.params;
    const { user } = useAuth();
    const socket = useSocket();
    const { match, loading, actionLoading, acceptMatch, declineMatch } = useMatch(matchId);

    useEffect(() => {
        if (socket) {
            socket.on('match_confirmed', (data: { matchId: string, conversationId: string }) => {
                if (data.matchId === matchId) {
                    navigation.replace('MatchConfirmed', { matchId, conversationId: data.conversationId });
                }
            });
        }

        return () => {
            if (socket) socket.off('match_confirmed');
        };
    }, [socket, matchId, navigation]);

    const handleAccept = async () => {
        try {
            const data = await acceptMatch(matchId);
            if (data.status !== 'confirmed') {
                navigation.navigate('Waiting', { matchId });
            }
        } catch (err: any) {
            Alert.alert('Hata', err.message);
        }
    };


    const handleDecline = async () => {
        Alert.alert('Emin misiniz?', 'Bu eşleşmeyi reddetmek istediğinize emin misiniz?', [
            { text: 'Vazgeç', style: 'cancel' },
            {
                text: 'Evet, Reddet',
                onPress: async () => {
                    try {
                        await declineMatch(matchId);
                        navigation.navigate('Main');
                    } catch (err: any) {
                        Alert.alert('Hata', err.message);
                    }
                },

            },
        ]);
    };

    if (loading || !match) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const otherUser = match.user_a_id === user?.id ? match.user_b : match.user_a;


    return (
        <View style={styles.container}>
            <Text style={styles.title}>Eşleşme Bulundu! 🎉</Text>
            <Text style={styles.scoreText}>Uyum Skoru: %{match.compat_score}</Text>


            <View style={styles.card}>
                <Image
                    source={{ uri: otherUser.avatar_url || 'https://via.placeholder.com/150' }}
                    style={styles.avatar}
                />
                <Text style={styles.userName}>{otherUser.name}</Text>
                <Text style={styles.userBio}>{otherUser.bio || 'Henüz bir biyografi eklenmemiş.'}</Text>

                <View style={styles.badgeRow}>
                    {otherUser.is_verified && <View style={styles.badge}><Text style={styles.badgeText}>Onaylı</Text></View>}
                    <View style={[styles.badge, { backgroundColor: Colors.primaryLight }]}><Text style={styles.badgeText}>Güven: {otherUser.trust_score}</Text></View>
                </View>

                {otherUser.interests?.length > 0 && (
                    <View style={styles.interestRow}>
                        {otherUser.interests.map((interest: any) => (
                            <View key={interest.id} style={styles.miniInterestTag}>
                                <Text style={styles.miniEmoji}>{interest.emoji}</Text>
                                <Text style={styles.miniLabel}>{interest.label}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>


            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={[styles.button, styles.declineButton]}
                    onPress={handleDecline}
                    disabled={actionLoading}
                >
                    <Text style={styles.buttonText}>Pas Geç</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.acceptButton]}
                    onPress={handleAccept}
                    disabled={actionLoading}
                >
                    {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Kabul Et</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const getStyles = (Colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bgDark,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        ...Typography.displaySm,
        color: '#FFF',
        marginBottom: 8,
    },
    scoreText: {
        ...Typography.labelLg,
        color: Colors.primary,
        marginBottom: 40,
    },
    card: {
        width: '100%',
        backgroundColor: Colors.bgCard,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginBottom: 48,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 16,
        backgroundColor: Colors.bgMain,
    },
    userName: {
        ...Typography.displaySm,
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    userBio: {
        ...Typography.labelMd,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 16,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
    },
    badge: {
        backgroundColor: Colors.success,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeText: {
        ...Typography.labelSm,
        color: '#FFF',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 16,
        width: '100%',
    },
    button: {
        flex: 1,
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    declineButton: {
        backgroundColor: 'rgba(255, 71, 87, 0.15)',
        borderWidth: 1,
        borderColor: Colors.error,
    },
    acceptButton: {
        backgroundColor: Colors.primary,
    },
    buttonText: {
        ...Typography.labelLg,
        color: '#FFF',
    },
    interestRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 16,
        justifyContent: 'center',
    },
    miniInterestTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginRight: 6,
        marginBottom: 6,
    },

    miniEmoji: {
        fontSize: 12,
        marginRight: 4,
    },
    miniLabel: {
        ...Typography.labelSm,
        color: Colors.textSecondary,
    }
});

