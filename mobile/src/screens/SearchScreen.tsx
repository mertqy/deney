import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';

import { useThemeColor } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuth } from '../hooks/AuthContext';
import { ActivityGrid } from '../components/ActivityGrid';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import client from '../api/client';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';


type Props = {
    navigation: NativeStackNavigationProp<any>;
};

export const SearchScreen = ({ navigation }: Props) => {
    const Colors = useThemeColor();
    const styles = getStyles(Colors);
    const { user } = useAuth();
    const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [radiusKm, setRadiusKm] = useState(10.0);
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
                Alert.alert('İzin Reddedildi', 'Konum izni olmadan doğru eşleşme yapılamaz. Varsayılan konum kullanılacak.');
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
                setLocationName(`${address.district || address.city || ''}, ${address.subregion || address.region || ''}`);
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
                    setLocationName(`${addr.district || addr.city || ''}, ${addr.subregion || addr.region || ''}`);
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

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };


    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
            <View style={styles.header}>
                <Text style={styles.title}>Merhaba, {user?.name.split(' ')[0]}</Text>
                <Text style={styles.subtitle}>Ne yapmak istiyorsun?</Text>
            </View>

            <ActivityGrid selectedSlug={selectedActivity} onSelect={setSelectedActivity} />

            {/* Location Section - Keeping it as requested */}
            <View style={styles.section}>
                <View style={[styles.pickerBox, styles.locationBox]}>
                    <Ionicons name="location-outline" size={20} color={Colors.accentSoft} />
                    <TouchableOpacity onPress={() => setIsLocationModalVisible(true)} style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.pickerText}>{locationName}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tarih</Text>
                <TouchableOpacity style={styles.pickerBox} onPress={() => setShowDatePicker(true)}>
                    <Text style={styles.pickerText}>{date.toLocaleDateString('tr-TR')}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        minimumDate={new Date()}
                        onChange={(e, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) setDate(selectedDate);
                        }}
                    />
                )}
            </View>

            <View style={styles.timeRow}>
                <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.sectionTitle}>Başlangıç</Text>
                    <TouchableOpacity style={styles.pickerBox} onPress={() => setShowStartTimePicker(true)}>
                        <Text style={styles.pickerText}>{formatTime(startTime)}</Text>
                    </TouchableOpacity>
                    {showStartTimePicker && (
                        <DateTimePicker
                            value={startTime}
                            mode="time"
                            is24Hour={true}
                            onChange={(e, selectedTime) => {
                                setShowStartTimePicker(false);
                                if (selectedTime) setStartTime(selectedTime);
                            }}
                        />
                    )}
                </View>

                <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.sectionTitle}>Bitiş</Text>
                    <TouchableOpacity style={styles.pickerBox} onPress={() => setShowEndTimePicker(true)}>
                        <Text style={styles.pickerText}>{formatTime(endTime)}</Text>
                    </TouchableOpacity>
                    {showEndTimePicker && (
                        <DateTimePicker
                            value={endTime}
                            mode="time"
                            is24Hour={true}
                            onChange={(e, selectedTime) => {
                                setShowEndTimePicker(false);
                                if (selectedTime) setEndTime(selectedTime);
                            }}
                        />
                    )}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mesafe ({radiusKm.toFixed(1)} km)</Text>
                <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={1}
                    maximumValue={50}
                    step={1}
                    value={radiusKm}
                    onValueChange={setRadiusKm}
                    minimumTrackTintColor={Colors.accentSoft}
                    maximumTrackTintColor={Colors.accentSoftLight}
                    thumbTintColor={Colors.accentSoft}
                />
            </View>

            <TouchableOpacity
                style={[styles.searchButton, loading && { opacity: 0.7 }]}
                onPress={handleSearch}
                disabled={loading}
            >
                <Ionicons name="search" size={24} color="#FFF" style={{ marginRight: 12 }} />
                <Text style={styles.searchButtonText}>Eşleşme Ara</Text>
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
                        <TextInput placeholderTextColor={Colors.textSecondary} 
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

const getStyles = (Colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bgSoft,
        paddingHorizontal: 24,
    },
    header: {
        marginTop: 80,
        marginBottom: 32,
    },
    title: {
        ...Typography.displayMd,
        color: Colors.textSerif,
        fontSize: 32,
    },
    subtitle: {
        ...Typography.labelLg,
        color: Colors.textSecondary,
        marginTop: 8,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        ...Typography.labelMd,
        color: Colors.textSecondary,
        marginBottom: 10,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    pickerBox: {
        backgroundColor: Colors.bgCardSoft,
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(175, 125, 97, 0.2)',
        alignItems: 'center',
        shadowColor: '#AF7D61',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    locationBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderColor: Colors.accentSoftLight,
        marginTop: 8,
    },
    pickerText: {
        ...Typography.labelLg,
        color: Colors.textSerif,
        fontSize: 18,
    },
    searchButton: {
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        shadowColor: Colors.primary,
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 8,
    },
    searchButtonText: {
        color: '#FFF',
        ...Typography.labelLg,
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: Colors.bgCard,
        borderRadius: 28,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        ...Typography.displaySm,
        color: Colors.textSerif,
        marginBottom: 20,
    },
    modalInput: {
        backgroundColor: Colors.bgSoft,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.accentSoftLight,
        ...Typography.labelMd,
        color: Colors.textSerif,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    modalButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginLeft: 12,
    },
    cancelBtn: {
        backgroundColor: Colors.bgSoft,
    },
    searchBtn: {
        backgroundColor: Colors.primary,
    },
    cancelBtnText: {
        ...Typography.labelMd,
        color: Colors.textSecondary,
    },
    searchBtnText: {
        ...Typography.labelMd,
        color: '#FFF',
        fontWeight: 'bold',
    }
});



