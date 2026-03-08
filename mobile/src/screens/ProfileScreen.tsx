import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, Modal, TextInput, Linking } from 'react-native';
import { useThemeColor } from '../constants/colors';
import { useAuth } from '../hooks/AuthContext';
import { useProfile } from '../hooks/useProfile';
import client from '../api/client';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const ProfileScreen = () => {
    const Colors = useThemeColor();
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

    const handleSupport = () => {
        Linking.openURL('mailto:meetiva.destek@gmail.com');
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

    if (loading && !profile) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    // Default age if not provided
    const age = profile?.birth_date ? new Date().getFullYear() - new Date(profile.birth_date).getFullYear() : 29;

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60, backgroundColor: '#FFF' }} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <Ionicons name="arrow-back" size={24} color="#2d3748" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profil</Text>
                <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={styles.iconBtn}>
                    <Ionicons name="settings" size={24} color="#2d3748" />
                </TouchableOpacity>
            </View>

            {/* Profile Info */}
            <View style={styles.profileSection}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: profile?.avatar_url || 'https://i.pravatar.cc/300' }}
                        style={styles.avatar}
                    />
                    <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                    </View>
                </View>

                <Text style={styles.userName}>{profile?.name?.split(' ')[0] || 'İsim'}, {age}</Text>

                <View style={styles.locationContainer}>
                    <Ionicons name="location" size={14} color="#718096" style={{ marginRight: 4 }} />
                    <Text style={styles.locationText}>İstanbul, TR</Text>
                </View>

                <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
                    <Ionicons name="pencil" size={16} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.editButtonText}>Profili Düzenle</Text>
                </TouchableOpacity>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statCardTitle}>GÜVEN SKORU</Text>
                    <Text style={styles.statCardValue}>{profile?.trust_score || 0}%</Text>
                    <View style={styles.statCardSubContainer}>
                        <Ionicons name="trending-up" size={12} color="#4CC47A" style={{ marginRight: 4 }} />
                        <Text style={styles.statCardSubText}>Mükemmel</Text>
                    </View>
                </View>

                <View style={styles.statCard}>
                    <Text style={styles.statCardTitle}>DURUM</Text>
                    {profile?.is_verified ? (
                        <>
                            <Text style={styles.statCardValue}>Onaylı</Text>
                            <View style={styles.statCardSubContainer}>
                                <Ionicons name="shield-checkmark" size={12} color="#4a5568" style={{ marginRight: 4 }} />
                                <Text style={[styles.statCardSubText, { color: '#4a5568' }]}>Hesap Güvende</Text>
                            </View>
                        </>
                    ) : (
                        <TouchableOpacity onPress={handleSendVerification}>
                            <Text style={styles.statCardValue}>Onaylanmamış</Text>
                            <View style={styles.statCardSubContainer}>
                                <Ionicons name="alert-circle" size={12} color="#ea2a33" style={{ marginRight: 4 }} />
                                <Text style={[styles.statCardSubText, { color: '#ea2a33' }]}>Doğrulamak İçin Tıkla</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Content Sections */}
            <View style={styles.contentContainer}>
                <Text style={styles.sectionTitle}>HAKKIMDA</Text>
                <Text style={styles.bioText}>
                    {profile?.bio || 'Gündüzleri mimar, geceleri amatör şef. Şehrin gizli mücevherlerini keşfetmeyi, hafta sonu doğa yürüyüşlerini ve vintage caz plaklarını seviyorum. İyi bir sohbetten ve daha iyi bir kahveden anlayan birini arıyorum.'}
                </Text>

                <Text style={[styles.sectionTitle, { marginTop: 32 }]}>İLGİ ALANLARI</Text>
                <View style={styles.interestList}>
                    {profile?.interests?.length > 0 ? profile.interests.map((interest: any) => (
                        <View key={interest.id} style={styles.interestPill}>
                            <Text style={styles.interestPillText}>{interest.label}</Text>
                        </View>
                    )) : (
                        <>
                            <View style={styles.interestPill}><Text style={styles.interestPillText}>Architecture</Text></View>
                            <View style={styles.interestPill}><Text style={styles.interestPillText}>Cooking</Text></View>
                            <View style={styles.interestPill}><Text style={styles.interestPillText}>Jazz</Text></View>
                            <View style={styles.interestPill}><Text style={styles.interestPillText}>Hiking</Text></View>
                            <View style={styles.interestPill}><Text style={styles.interestPillText}>Photography</Text></View>
                        </>
                    )}
                </View>

                {/* Divider Line */}
                <View style={styles.divider} />

                <TouchableOpacity style={styles.supportButton} onPress={handleSupport}>
                    <Ionicons name="help-circle-outline" size={20} color="#718096" style={{ marginRight: 10 }} />
                    <Text style={styles.supportButtonText}>Destek ve Yardım</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Ionicons name="log-out-outline" size={20} color="#718096" style={{ marginRight: 10 }} />
                    <Text style={styles.logoutButtonText}>Hesaptan Çıkış Yap</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Versiyon 0.0.1 • Sevgiyle Hazırlandı</Text>
            </View>

            <Modal visible={verificationModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Hesap Doğrulama</Text>
                        <TextInput
                            style={styles.codeInput}
                            placeholder="Kod (örn. 12345)"
                            placeholderTextColor="#a0aec0"
                            keyboardType="number-pad"
                            maxLength={5}
                            value={verificationCode}
                            onChangeText={setVerificationCode}
                        />

                        <TouchableOpacity
                            style={[styles.primaryModalBtn, verificationLoading && { opacity: 0.7 }]}
                            onPress={handleVerifyCode}
                            disabled={verificationLoading}
                        >
                            <Text style={styles.primaryModalBtnText}>Doğrula</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryModalBtn} onPress={() => setVerificationModalVisible(false)}>
                            <Text style={styles.secondaryModalBtnText}>Kapat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        marginBottom: 24,
    },
    iconBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a202c',
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 4,
        borderColor: '#FFF',
        backgroundColor: '#f8f6f6',
        shadowColor: '#1a202c',
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 4,
        right: 8,
        backgroundColor: '#ea2a33',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a202c',
        marginBottom: 4,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    locationText: {
        fontSize: 14,
        color: '#718096',
    },
    editButton: {
        flexDirection: 'row',
        backgroundColor: '#ea2a33',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#ea2a33',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    editButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fffcfb', // Very light red/warm bg tint
        borderWidth: 1,
        borderColor: '#fdebed', // primaryLight
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    statCardTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#ea2a33', // Primary
        letterSpacing: 1,
        marginBottom: 8,
    },
    statCardValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a202c',
        marginBottom: 4,
    },
    statCardSubContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statCardSubText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4CC47A',
    },
    contentContainer: {
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#a0aec0',
        letterSpacing: 1,
        marginBottom: 16,
    },
    bioText: {
        fontSize: 15,
        color: '#2d3748',
        lineHeight: 24,
    },
    interestList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    interestPill: {
        backgroundColor: '#f8f6f6',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 10,
        marginBottom: 10,
    },
    interestPillText: {
        fontSize: 13,
        color: '#1a202c',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#edf2f7',
        marginVertical: 32,
    },
    supportButton: {
        flexDirection: 'row',
        backgroundColor: '#f8f6f6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    supportButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#4a5568',
    },
    logoutButton: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#edf2f7',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    logoutButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#4a5568',
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#a0aec0',
        marginBottom: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a202c',
        marginBottom: 20,
    },
    codeInput: {
        backgroundColor: '#f8f6f6',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1a202c',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        textAlign: 'center',
        letterSpacing: 8,
    },
    primaryModalBtn: {
        backgroundColor: '#ea2a33',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryModalBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryModalBtn: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    secondaryModalBtnText: {
        color: '#718096',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
