import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Image } from 'react-native';

import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuth } from '../hooks/AuthContext';
import { ActivityGrid } from '../components/ActivityGrid';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import client from '../api/client';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';


type Props = {
    navigation: NativeStackNavigationProp<any>;
};

const getNextDays = (numDays: number) => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < numDays; i++) {
        const nextDate = new Date();
        nextDate.setDate(today.getDate() + i);
        days.push(nextDate);
    }
    return days;
};

const formatDayName = (date: Date, isToday: boolean) => {
    if (isToday) return 'BUGÜN';
    const days = ['PZR', 'PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT'];
    return days[date.getDay()];
};

const formatMonthName = (date: Date) => {
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return months[date.getMonth()];
};

export const SearchScreen = ({ navigation }: Props) => {
    const { user } = useAuth();
    const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

    const [date, setDate] = useState(new Date());
    const availableDates = useRef(getNextDays(14)).current;

    const [radiusKm, setRadiusKm] = useState(15.0);
    const [loading, setLoading] = useState(false);

    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [locationName, setLocationName] = useState('Konum alınıyor...');
    const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
    const [tempLocationSearch, setTempLocationSearch] = useState('');
    const [searchingLocation, setSearchingLocation] = useState(false);

    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date(new Date().getTime() + 2 * 60 * 60 * 1000));
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocation({ lat: 39.9334, lng: 32.8597 });
                setLocationName('Ankara (Varsayılan)');
                return;
            }

            let currLoc = await Location.getCurrentPositionAsync({});
            setLocation({
                lat: currLoc.coords.latitude,
                lng: currLoc.coords.longitude
            });

            let reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: currLoc.coords.latitude,
                longitude: currLoc.coords.longitude
            });

            if (reverseGeocode.length > 0) {
                const address = reverseGeocode[0];
                setLocationName(`${address.district || address.city || ''}`);
            } else {
                setLocationName('Mevcut Konum');
            }
        })();
    }, []);

    const handleSearch = async () => {
        if (!selectedActivity) {
            Alert.alert('Dikkat', 'Lütfen bir aktivite seçin.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                activity_slug: selectedActivity,
                desired_date: date.toISOString().split('T')[0],
                time_start: formatTime(startTime),
                time_end: formatTime(endTime),
                lat: location?.lat || 39.9334,
                lng: location?.lng || 32.8597,
                radius_km: radiusKm,
            };

            const res = await client.post('/searches', payload);
            navigation.navigate('Searching', { search_id: res.data.id });
        } catch (err: any) {
            Alert.alert('Hata', err.response?.data?.error || 'Arama başlatılamadı.');
        } finally {
            setLoading(false);
        }
    };

    const handleLocationSearch = async () => {
        if (!tempLocationSearch.trim()) return;
        setSearchingLocation(true);
        try {
            const results = await Location.geocodeAsync(tempLocationSearch);
            if (results.length > 0) {
                const { latitude, longitude } = results[0];
                setLocation({ lat: latitude, lng: longitude });
                const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
                if (reverse.length > 0) {
                    const addr = reverse[0];
                    setLocationName(`${addr.district || addr.city || ''}`);
                } else {
                    setLocationName(tempLocationSearch);
                }
                setIsLocationModalVisible(false);
                setTempLocationSearch('');
            } else {
                Alert.alert('Hata', 'Konum bulunamadı.');
            }
        } catch (err) {
            Alert.alert('Hata', 'Konum aranırken sorun oluştu.');
        } finally {
            setSearchingLocation(false);
        }
    };

    const formatTime = (dateObj: Date) => {
        return dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }).substring(0, 5);
    };

    const isSameDate = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };


    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60, paddingTop: 60 }} showsVerticalScrollIndicator={false}>

            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.greetingContainer}>
                        <Text style={styles.title}>Merhaba, {user?.name.split(' ')[0]} 👋</Text>
                        <Text style={styles.subtitle}>Bugün harika bir gün!</Text>
                    </View>
                </View>
            </View>

            <View style={styles.locationSmall}>
                <TouchableOpacity onPress={() => setIsLocationModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="location" size={16} color={Colors.textSecondary} />
                    <Text style={styles.locationTextSmall}>{locationName}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ne yapmak istiyorsun?</Text>
            </View>

            <ActivityGrid selectedSlug={selectedActivity} onSelect={setSelectedActivity} />

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Zaman Aralığı</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                    {availableDates.map((d, index) => {
                        const isSelected = isSameDate(d, date);
                        const isToday = index === 0;
                        return (
                            <TouchableOpacity
                                key={index}
                                style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                                onPress={() => setDate(d)}
                            >
                                <Text style={[styles.dateDayName, isSelected && styles.dateTextSelected]}>{formatDayName(d, isToday)}</Text>
                                <Text style={[styles.dateNumber, isSelected && styles.dateTextSelected]}>{d.getDate()}</Text>
                                <Text style={[styles.dateMonth, isSelected && styles.dateTextSelected]}>{formatMonthName(d)}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Konum</Text>
                <TouchableOpacity style={styles.locationInputBox} onPress={() => setIsLocationModalVisible(true)}>
                    <View style={styles.locationIconCircle}>
                        <Ionicons name="location" size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.locationInputTextContainer}>
                        <Text style={styles.locationInputLabel}>ETKİNLİK KONUMU</Text>
                        <Text style={styles.locationInputName} numberOfLines={1}>{locationName}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={styles.sectionTitle}>Mesafe</Text>
                    <View style={styles.distanceBadge}>
                        <Text style={styles.distanceBadgeText}>{Math.round(radiusKm)} km</Text>
                    </View>
                </View>
                <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={1}
                    maximumValue={50}
                    step={1}
                    value={radiusKm}
                    onValueChange={setRadiusKm}
                    minimumTrackTintColor={Colors.primary}
                    maximumTrackTintColor="#FDEbed"
                    thumbTintColor={Colors.primary}
                />
                <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabelText}>1 KM</Text>
                    <Text style={styles.sliderLabelText}>50+ KM</Text>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.searchButton, loading && { opacity: 0.7 }]}
                onPress={handleSearch}
                disabled={loading}
            >
                {loading ? (
                    <Text style={styles.searchButtonText}>Aranıyor...</Text>
                ) : (
                    <>
                        <Ionicons name="search" size={20} color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={styles.searchButtonText}>Eşleşme Ara</Text>
                    </>
                )}
            </TouchableOpacity>

            <Modal
                visible={isLocationModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsLocationModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Konum Değiştir</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Şehir veya ilçe adı girin..."
                            value={tempLocationSearch}
                            onChangeText={setTempLocationSearch}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelBtn]}
                                onPress={() => setIsLocationModalVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Vazgeç</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.searchBtn]}
                                onPress={handleLocationSearch}
                                disabled={searchingLocation}
                            >
                                <Text style={styles.searchBtnText}>
                                    {searchingLocation ? 'Aranıyor...' : 'Uygula'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bgMain,
        paddingHorizontal: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    greetingContainer: {
        marginLeft: 0,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    subtitle: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    locationSmall: {
        marginBottom: 24,
        paddingLeft: 0, // Profile photo removed, so alignment changed
    },
    locationTextSmall: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginLeft: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 16,
    },
    sectionTitleSmall: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    dateScroll: {
        marginHorizontal: -24,
        paddingHorizontal: 24,
    },
    dateCard: {
        width: 65,
        height: 85,
        backgroundColor: Colors.bgCard,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 1,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    dateCardSelected: {
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    dateDayName: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    dateNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    dateMonth: {
        fontSize: 11,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    dateTextSelected: {
        color: '#FFF',
    },
    locationInputBox: {
        flexDirection: 'row',
        backgroundColor: Colors.bgCard,
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 1,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    locationIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    locationInputTextContainer: {
        flex: 1,
    },
    locationInputLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.textSecondary,
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    locationInputName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    distanceBadge: {
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    distanceBadgeText: {
        color: Colors.primary,
        fontWeight: 'bold',
        fontSize: 13,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    sliderLabelText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.textSecondary,
        letterSpacing: 0.5,
    },
    searchButton: {
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        shadowColor: Colors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 4,
    },
    searchButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footerText: {
        textAlign: 'center',
        marginTop: 16,
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 40,
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
        color: Colors.textPrimary,
        marginBottom: 20,
    },
    modalInput: {
        backgroundColor: Colors.bgMain,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: Colors.textPrimary,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    modalButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginLeft: 12,
    },
    cancelBtn: {
        backgroundColor: Colors.bgMain,
    },
    searchBtn: {
        backgroundColor: Colors.primary,
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.textSecondary,
    },
    searchBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFF',
    }
});
