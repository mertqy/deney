import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
    navigation: NativeStackNavigationProp<any>;
    route: any;
};

export const MatchConfirmedScreen = ({ navigation, route }: Props) => {
    const { conversationId } = route.params;

    return (
        <View style={styles.container}>
            <Text style={styles.emoji}>🤩</Text>
            <Text style={styles.title}>Harika! Eşleştiniz.</Text>
            <Text style={styles.subtitle}>İkiniz de bu aktiviteyi yapmaya hazırsınız. Hemen sohbete başla ve detayları planla.</Text>

            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.replace('Chat', { conversationId })}
            >
                <Text style={styles.buttonText}>Sohbete Başla</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.laterButton}
                onPress={() => navigation.navigate('Main', { screen: 'Chats' })}
            >
                <Text style={styles.laterText}>Daha Sonra</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bgMain,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emoji: {
        fontSize: 80,
        marginBottom: 24,
    },
    title: {
        ...Typography.displayMd,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        ...Typography.labelLg,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 60,
    },
    button: {
        backgroundColor: Colors.primary,
        width: '100%',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonText: {
        ...Typography.labelLg,
        color: '#FFF',
    },
    laterButton: {
        padding: 12,
    },
    laterText: {
        ...Typography.labelMd,
        color: Colors.textSecondary,
    }
});
