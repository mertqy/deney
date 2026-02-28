import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useThemeColor } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useSocket } from '../hooks/useSocket';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
    navigation: NativeStackNavigationProp<any>;
    route: any;
};

export const WaitingScreen = ({ navigation, route }: Props) => {
    const Colors = useThemeColor();
    const styles = getStyles(Colors);
    const { matchId } = route.params;
    const socket = useSocket();

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
    }, [socket]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginBottom: 24 }} />
            <Text style={styles.title}>Cevap Bekleniyor...</Text>
            <Text style={styles.subtitle}>Partnerinin de kabul etmesini bekliyoruz. Bu pencereyi kapatma.</Text>
        </View>
    );
};

const getStyles = (Colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bgDark,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    title: {
        ...Typography.displaySm,
        color: '#FFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        ...Typography.labelLg,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
});
