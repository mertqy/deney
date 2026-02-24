import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useAuth } from '../hooks/AuthContext';
import client from '../api/client';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RegisterProps = {
    navigation: NativeStackNavigationProp<any>;
};

export const RegisterScreen = ({ navigation }: RegisterProps) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [birthDate, setBirthDate] = useState(new Date(2000, 0, 1));
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleRegister = async () => {
        if (!name || !email || !password || !birthDate) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
            return;
        }

        setLoading(true);
        try {
            const formattedDate = birthDate.toISOString().split('T')[0];
            const response = await client.post('/auth/register', { name, email, password, birth_date: formattedDate });

            const { accessToken, refreshToken, user } = response.data;
            await login(accessToken, refreshToken, user);

        } catch (err: any) {
            Alert.alert('Kayıt Hatalı', err.response?.data?.error || 'Bir sorun oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Bize Katıl</Text>
            <Text style={styles.subtitle}>Yeni deneyimlere hazır ol.</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Ad Soyad"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                />
                <TextInput
                    style={styles.input}
                    placeholder="E-posta"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TouchableOpacity
                    style={styles.input}
                    onPress={() => setShowDatePicker(true)}
                >
                    <Text style={{ color: birthDate ? Colors.textPrimary : Colors.textSecondary }}>
                        {birthDate.toLocaleDateString('tr-TR')}
                    </Text>
                </TouchableOpacity>

                {showDatePicker && (
                    <DateTimePicker
                        value={birthDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        maximumDate={new Date()} // Can't be born in the future
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) setBirthDate(selectedDate);
                        }}
                    />
                )}

                <TextInput
                    style={styles.input}
                    placeholder="Şifre"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Kayıt Ol</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                <Text style={styles.linkText}>Zaten hesabın var mı? <Text style={{ color: Colors.primary }}>Giriş Yap</Text></Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bgMain,
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        ...Typography.displayLg,
        color: Colors.primary,
        textAlign: 'center',
    },
    subtitle: {
        ...Typography.labelLg,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 40,
    },
    inputContainer: {
        marginBottom: 24,
    },
    input: {
        backgroundColor: Colors.bgCard,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Typography.labelMd,
    },
    button: {
        backgroundColor: Colors.primary,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        ...Typography.labelLg,
    },
    linkText: {
        ...Typography.labelMd,
        textAlign: 'center',
        color: Colors.textSecondary,
    }
});
