import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';


type Props = {
    navigation: NativeStackNavigationProp<any>;
};

export const EditProfileScreen = ({ navigation }: Props) => {
    const { profile, loading, updateProfile, deleteAccount, updateInterests, fetchAllInterests } = useProfile();
    const { logout } = useAuth();


    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [locationCity, setLocationCity] = useState('');
    const [saving, setSaving] = useState(false);
    const [allInterests, setAllInterests] = useState<any[]>([]);
    const [selectedInterestIds, setSelectedInterestIds] = useState<number[]>([]);


    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('İzin Gerekli', 'Galerinize erişmek için izin vermeniz gerekiyor.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setAvatarUrl(result.assets[0].uri);
        }
    };


    React.useEffect(() => {
        const loadAll = async () => {
            const interests = await fetchAllInterests();
            setAllInterests(interests);
        };
        loadAll();

        if (profile) {
            setName(profile.name || '');
            setBio(profile.bio || '');
            setAvatarUrl(profile.avatar_url || '');
            setLocationCity(profile.location_city || '');
            setSelectedInterestIds(profile.interests?.map((i: any) => i.id) || []);
        }
    }, [profile, fetchAllInterests]);


    const toggleInterest = (id: number) => {
        setSelectedInterestIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };



    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Hata', 'İsim alanı boş bırakılamaz.');
            return;
        }

        setSaving(true);
        try {
            await updateProfile({
                name,
                bio,
                avatar_url: avatarUrl,
                location_city: locationCity
            });
            await updateInterests(selectedInterestIds);
            Alert.alert('Başarılı', 'Profiliniz güncellendi.', [

                { text: 'Tamam', onPress: () => navigation.goBack() }
            ]);

        } catch (err: any) {
            Alert.alert('Hata', err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Hesabı Sil',
            'Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Evet, Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteAccount();
                            await logout();
                        } catch (err: any) {
                            Alert.alert('Hata', err.message);
                        }
                    },
                },
            ]
        );
    };


    if (loading && !profile) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bgMain }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelText}>İptal</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Profili Düzenle</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                    {saving ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                        <Text style={styles.saveText}>Kaydet</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.avatarSection}>
                <Image
                    source={{ uri: avatarUrl || 'https://via.placeholder.com/150' }}
                    style={styles.avatarLarge}
                />
                <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage}>
                    <Ionicons name="camera" size={20} color="#FFF" />
                    <Text style={styles.changePhotoText}>Fotoğrafı Değiştir</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Ad Soyad</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Adınızı giriniz"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Biyografi</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Kendinizden bahsedin"
                        multiline
                        numberOfLines={4}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Şehir</Text>
                    <TextInput
                        style={styles.input}
                        value={locationCity}
                        onChangeText={setLocationCity}
                        placeholder="Yaşadığınız şehir"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>İlgi Alanları</Text>
                    <View style={styles.interestContainer}>
                        {allInterests.map((interest) => {
                            const isSelected = selectedInterestIds.includes(interest.id);
                            return (
                                <TouchableOpacity
                                    key={interest.id}
                                    style={[
                                        styles.interestTag,
                                        isSelected && styles.interestTagSelected
                                    ]}
                                    onPress={() => toggleInterest(interest.id)}
                                >
                                    <Text style={styles.interestEmoji}>{interest.emoji}</Text>
                                    <Text style={[
                                        styles.interestLabel,
                                        isSelected && styles.interestLabelSelected
                                    ]}>
                                        {interest.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>



                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDeleteAccount}
                >
                    <Text style={styles.deleteButtonText}>Hesabı Sil</Text>
                </TouchableOpacity>
            </View>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bgMain,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#FFF',
    },
    title: {
        ...Typography.labelLg,
        fontWeight: 'bold',
    },
    cancelText: {
        ...Typography.labelMd,
        color: Colors.textSecondary,
    },
    saveText: {
        ...Typography.labelMd,
        color: Colors.primary,
        fontWeight: 'bold',
    },
    form: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        ...Typography.labelSm,
        color: Colors.textSecondary,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Typography.labelMd,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    deleteButton: {
        marginTop: 40,
        padding: 16,
        alignItems: 'center',
    },
    deleteButtonText: {
        ...Typography.labelMd,
        color: Colors.error,
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: '#FFF',
    },
    avatarLarge: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.bgMain,
        marginBottom: 16,
    },
    changePhotoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    changePhotoText: {
        color: '#FFF',
        ...Typography.labelMd,
        fontWeight: 'bold',
        marginLeft: 8,
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
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: Colors.border,
        marginRight: 8,
        marginBottom: 8,
    },

    interestTagSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    interestEmoji: {
        fontSize: 14,
        marginRight: 4,
    },
    interestLabel: {
        ...Typography.labelSm,
        color: Colors.textPrimary,
    },
    interestLabelSelected: {
        color: '#FFF',
        fontWeight: 'bold',
    }
});



