import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { useThemeColor } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuth } from '../hooks/AuthContext';
import { useProfile } from '../hooks/useProfile';
import client from '../api/client';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';



export const ProfileScreen = () => {
    const Colors = useThemeColor();
    const styles = getStyles(Colors);
    const { logout } = useAuth();
    const { profile, loading, error, refreshProfile } = useProfile();
    const navigation = useNavigation<NativeStackNavigationProp<any>>();

    useFocusEffect(
        React.useCallback(() => {
            refreshProfile();
        }, [refreshProfile])
    );

    const [verificationModalVisible, setVerificationModalVisible] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [verificationLoading, setVerificationLoading] = useState(false);

    const handleSendVerification = async () => {
        try {
            setVerificationLoading(true);
            await client.post('/auth/send-verification');
            Alert.alert('Başarılı', 'Doğrulama kodu e-posta adresinize gönderildi.');
            setVerificationModalVisible(true);
        } catch (err: any) {
            Alert.alert('Hata', err.response?.data?.error || 'Kod gönderilemedi.');
        } finally {
            setVerificationLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (verificationCode.trim().length !== 5) {
            Alert.alert('Hata', 'Lütfen 5 haneli kodu girin.');
            return;
        }

        try {
            setVerificationLoading(true);
            const res = await client.post('/auth/verify-email', { code: verificationCode.trim() });
            Alert.alert('Başarılı', res.data.message || 'Hesabınız doğrulandı.');
            setVerificationModalVisible(false);
            setVerificationCode('');
            refreshProfile();
        } catch (err: any) {
            Alert.alert('Hata', err.response?.data?.error || 'Kod doğrulanamadı.');
        } finally {
            setVerificationLoading(false);
        }
    };



    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (error && !profile) {
        return (
            <View style={styles.container}>
                <Text style={{ color: Colors.error, textAlign: 'center', marginTop: 100 }}>{error}</Text>
            </View>
        );
    }



    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => navigation.navigate('EditProfile')}
                >
                    <Ionicons name="settings-outline" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>

                <Image
                    source={{ uri: profile?.avatar_url || 'https://via.placeholder.com/150' }}
                    style={styles.avatar}
                />
                <Text style={styles.userName}>{profile?.name}</Text>
                <Text style={styles.userEmail}>{profile?.email}</Text>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{profile?.trust_score}</Text>
                        <Text style={styles.statLabel}>Güven Skoru</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{profile?.is_verified ? 'Evet' : 'Hayır'}</Text>
                        <Text style={styles.statLabel}>Onaylı</Text>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hakkımda</Text>
                <View style={styles.card}>
                    <Text style={styles.bioText}>
                        {profile?.bio || 'Henüz bir biyografi eklenmemiş. Profilini düzenleyerek kendini tanıtabilirsin!'}
                    </Text>
                </View>

                {!profile?.is_verified && (
                    <TouchableOpacity
                        style={styles.verifyButton}
                        onPress={handleSendVerification}
                        disabled={verificationLoading}
                    >
                        {verificationLoading ? (
                            <ActivityIndicator color={Colors.primary} />
                        ) : (
                            <>
                                <Ionicons name="shield-checkmark" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
                                <Text style={styles.verifyButtonText}>Hesabını Doğrula & +20 Puan Kazan</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>İlgi Alanları & Hobiler</Text>
                {profile?.interests?.length > 0 ? (
                    <View style={styles.interestContainer}>
                        {profile.interests.map((interest: any) => (
                            <View key={interest.id} style={styles.interestTag}>
                                <Text style={styles.interestEmoji}>{interest.emoji}</Text>
                                <Text style={styles.interestLabel}>{interest.label}</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.card}>
                        <Text style={styles.bioText}>Henüz bir ilgi alanı eklenmemiş. Profilini düzenleyerek hobilerini paylaşabilirsin!</Text>
                    </View>
                )}
            </View>

            <Modal visible={verificationModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Hesap Doğrulama</Text>
                        <Text style={styles.modalSubtitle}>E-posta adresinize ( {profile?.email} ) gönderilen 5 haneli kodu girin:</Text>

                        <TextInput
                            style={styles.codeInput}
                            placeholder="Kod (örn. 12345)"
                            placeholderTextColor={Colors.textSecondary}
                            keyboardType="number-pad"
                            maxLength={5}
                            value={verificationCode}
                            onChangeText={setVerificationCode}
                        />

                        <TouchableOpacity
                            style={styles.confirmVerifyButton}
                            onPress={handleVerifyCode}
                            disabled={verificationLoading}
                        >
                            {verificationLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.confirmVerifyText}>Doğrula</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelVerifyButton} onPress={() => setVerificationModalVisible(false)}>
                            <Text style={styles.cancelVerifyText}>Kapat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>Çıkış Yap</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const getStyles = (Colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bgMain,
    },
    header: {
        paddingTop: 80,
        paddingBottom: 40,
        backgroundColor: Colors.bgCard,
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
        position: 'relative',
    },
    settingsButton: {
        position: 'absolute',
        top: 60,
        right: 24,
        padding: 8,
        zIndex: 10,
    },

    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.bgMain,
        marginBottom: 16,
        borderWidth: 4,
        borderColor: Colors.bgCard,
    },
    userName: {
        ...Typography.displaySm,
        color: Colors.textPrimary,
    },
    userEmail: {
        ...Typography.labelMd,
        color: Colors.textSecondary,
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '80%',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        ...Typography.labelLg,
        color: Colors.primary,
        fontWeight: 'bold',
    },
    statLabel: {
        ...Typography.labelSm,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: Colors.border,
    },
    section: {
        padding: 20,
        marginTop: 20,
    },
    sectionTitle: {
        ...Typography.labelLg,
        color: Colors.textPrimary,
        marginBottom: 12,
    },
    card: {
        backgroundColor: Colors.bgCard,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    bioText: {
        ...Typography.labelMd,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    logoutButton: {
        margin: 20,
        padding: 18,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 71, 87, 0.1)',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 71, 87, 0.2)',
    },
    logoutText: {
        ...Typography.labelLg,
        color: Colors.error,
    },
    interestContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    interestTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.bgCard,
        borderWidth: 1,
        borderColor: Colors.border,
        marginRight: 8,
        marginBottom: 8,
    },

    interestEmoji: {
        fontSize: 14,
        marginRight: 4,
    },
    interestLabel: {
        ...Typography.labelSm,
        color: Colors.textPrimary,
    },
    verifyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(108, 92, 231, 0.1)',
        padding: 16,
        borderRadius: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: 'rgba(108, 92, 231, 0.3)',
    },
    verifyButtonText: {
        ...Typography.labelMd,
        color: Colors.primary,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: Colors.bgCard,
        padding: 24,
        borderRadius: 24,
        alignItems: 'center',
    },
    modalTitle: {
        ...Typography.displaySm,
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    modalSubtitle: {
        ...Typography.labelMd,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    codeInput: {
        width: '100%',
        backgroundColor: Colors.bgMain,
        borderRadius: 16,
        padding: 16,
        textAlign: 'center',
        fontSize: 24,
        letterSpacing: 8,
        color: Colors.textPrimary,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    confirmVerifyButton: {
        backgroundColor: Colors.primary,
        width: '100%',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    confirmVerifyText: {
        ...Typography.labelLg,
        color: '#FFF',
    },
    cancelVerifyButton: {
        padding: 12,
    },
    cancelVerifyText: {
        ...Typography.labelMd,
        color: Colors.textSecondary,
    }
});

