import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/AuthContext';
import client from '../api/client';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type LoginProps = {
    navigation: NativeStackNavigationProp<any>;
};

export const LoginScreen = ({ navigation }: LoginProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
            return;
        }
        setLoading(true);
        try {
            const response = await client.post('/auth/login', { email, password });
            const { accessToken, refreshToken, user } = response.data;
            await login(accessToken, refreshToken, user);

        } catch (err: any) {
            Alert.alert('Giriş Hatalı', err.response?.data?.error || 'Bir sorun oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Junto</Text>
            <Text style={styles.subtitle}>Tekrar hoş geldin.</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="E-posta"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Şifre"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Giriş Yap</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginTop: 20 }}>
                <Text style={styles.linkText}>Hesabın yok mu? <Text style={{ color: Colors.primary }}>Kayıt Ol</Text></Text>
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
