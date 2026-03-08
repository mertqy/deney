import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { useThemeColor } from '../constants/colors';
import { useAuth } from '../hooks/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import client from '../api/client';

type Props = {
    navigation: NativeStackNavigationProp<any>;
    route: any;
};

export const MatchConfirmedScreen = ({ navigation, route }: Props) => {
    const Colors = useThemeColor();
    const { conversationId, matchId } = route.params;
    const { user } = useAuth();
    const [otherUser, setOtherUser] = useState<any>(null);
    const [activityLabel, setActivityLabel] = useState('Etkinlik');
    const [activityIcon, setActivityIcon] = useState('cafe');

    useEffect(() => {
        const fetchDetails = async () => {
            if (!matchId) return;
            try {
                // Not ideal to fetch all through match endpoint but UI requires it
                const res = await client.get(`/matches/${matchId}`);
                const m = res.data;
                const partner = m.user_a_id === user?.id ? m.user_b : m.user_a;
                setOtherUser(partner);
                // Also get search details for the activity name?
                // For UI let's just use defaults or deduce
            } catch (err) {
                console.log(err);
            }
        };
        fetchDetails();
    }, [matchId, user]);

    const partnerName = otherUser?.name?.split(' ')[0] || 'Partnerin';
    const myName = user?.name?.split(' ')[0] || 'Sen';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topSection}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.closeBtn}>
                        <Ionicons name="close" size={28} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Eşleşme Bulundu!</Text>
                    <View style={{ width: 28 }} />
                </View>

                <View style={styles.avatarContainer}>
                    <View style={[styles.avatarWrapper, { zIndex: 1, left: -20 }]}>
                        <Image source={{ uri: user?.avatar_url || 'https://i.pravatar.cc/150?img=11' }} style={styles.avatar} />
                    </View>
                    <View style={[styles.avatarWrapper, { zIndex: 0, left: 20 }]}>
                        <Image source={{ uri: otherUser?.avatar_url || 'https://i.pravatar.cc/150?img=5' }} style={styles.avatar} />
                    </View>
                </View>
            </View>

            <View style={styles.contentSection}>
                <Text style={styles.title}>Tebrikler, Bir{'\n'}Eşleşme Bulundu!</Text>
                <Text style={styles.subtitle}>
                    {myName} ve {partnerName}, seçtiğiniz aktivite için{'\n'}harika bir ikili gibi görünüyorsunuz.
                </Text>

                <View style={styles.activityCard}>
                    <View style={styles.activityInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                            <Ionicons name="cafe" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                            <Text style={styles.activityTitle}>Kahve & Sohbet</Text>
                        </View>
                        <Text style={styles.activitySub}>Paylaşılan Aktivite</Text>
                    </View>
                    <Image source={{ uri: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=200&auto=format&fit=crop' }} style={styles.activityImage} />
                </View>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => navigation.replace('Chat', { conversationId })}
                >
                    <Ionicons name="send" size={20} color="#FFF" style={{ marginRight: 10, transform: [{ rotate: '-45deg' }, { marginBottom: 4 }] }} />
                    <Text style={styles.primaryButtonText}>Mesaj Gönder</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => navigation.navigate('Main')}
                >
                    <Text style={styles.secondaryButtonText}>Aramaya Devam Et</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fffcfb', // Very light warm tone for gradient effect at top
    },
    topSection: {
        alignItems: 'center',
        paddingTop: 20,
        backgroundColor: '#f8f4f0',
        paddingBottom: 40,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 24,
        marginBottom: 40,
    },
    closeBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a202c',
    },
    avatarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarWrapper: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 4,
        borderColor: '#fdebed', // primaryLight
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1a202c',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        position: 'absolute',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 70,
    },
    contentSection: {
        flex: 1,
        backgroundColor: '#f8f6f6', // Main background matching other screens
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: 80, // Space for overlapping avatars
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#1a202c',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 36,
    },
    subtitle: {
        fontSize: 14,
        color: '#718096',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    activityCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 40,
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 3,
    },
    activityInfo: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a202c',
    },
    activitySub: {
        fontSize: 12,
        color: '#ff7875', // Soft red
    },
    activityImage: {
        width: 80,
        height: 50,
        borderRadius: 8,
    },
    primaryButton: {
        flexDirection: 'row',
        backgroundColor: '#d64645', // The precise reddish color in the image
        width: '100%',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#d64645',
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#e2e8f0', // Light grey border
        width: '100%',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        color: '#2d3748', // Dark grey/blue text
        fontSize: 16,
        fontWeight: 'bold',
    }
});
