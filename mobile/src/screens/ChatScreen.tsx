import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useThemeColor } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuth } from '../hooks/AuthContext';
import { useSocket } from '../hooks/useSocket';
import client from '../api/client';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';


type Props = {
    navigation: NativeStackNavigationProp<any>;
    route: any;
};

export const ChatScreen = ({ navigation, route }: Props) => {
    const Colors = useThemeColor();
    const styles = getStyles(Colors);
    const { conversationId } = route.params;
    const { user } = useAuth();
    const socket = useSocket();
    const [messages, setMessages] = useState<any[]>([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        fetchMessages();

        if (socket) {
            socket.on('new_message', (msg: any) => {
                if (msg.conversation_id === conversationId) {
                    setMessages(prev => [msg, ...prev]);
                }
            });
            socket.on('chat_unmatched', () => {
                Alert.alert('Bilgi', 'Karşı taraf sohbeti sonlandırdı.');
                navigation.navigate('Main');
            });
        }

        return () => {
            if (socket) {
                socket.off('new_message');
                socket.off('chat_unmatched');
            }
        };
    }, [socket, conversationId, navigation]);

    const fetchMessages = async () => {
        try {
            const res = await client.get(`/conversations/${conversationId}`);
            setMessages(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOptions = () => {
        Alert.alert(
            'Sohbet Seçenekleri',
            'Ne yapmak istersiniz?',
            [
                { text: 'Vazgeç', style: 'cancel' },
                { text: 'Eşleşmeyi Kaldır', onPress: handleUnmatch, style: 'destructive' },
                { text: 'Şikayet Et & Engelle', onPress: handleBan, style: 'destructive' }
            ]
        );
    };

    const handleUnmatch = async () => {
        Alert.alert('Emin misiniz?', 'Eşleşmeyi tamamen kaldırmak istediğinize emin misiniz? Bu işlem geri alınamaz.', [
            { text: 'Vazgeç', style: 'cancel' },
            {
                text: 'Kaldır', style: 'destructive', onPress: async () => {
                    try {
                        await client.post(`/conversations/${conversationId}/unmatch`);
                        navigation.navigate('Main');
                    } catch (e) {
                        Alert.alert('Hata', 'İşlem başarısız.');
                    }
                }
            }
        ]);
    };

    const handleBan = async () => {
        Alert.alert('Şikayet Et', 'Bu kullanıcıyı engellemek ve şikayet etmek istediğinize emin misiniz? Karşınıza bir daha çıkmayacaktır.', [
            { text: 'Vazgeç', style: 'cancel' },
            {
                text: 'Engelle', style: 'destructive', onPress: async () => {
                    try {
                        await client.post(`/conversations/${conversationId}/ban`, { reason: 'Kullanıcı rapor edildi.' });
                        navigation.navigate('Main');
                    } catch (e) {
                        Alert.alert('Hata', 'İşlem başarısız.');
                    }
                }
            }
        ]);
    };

    const handleSend = async () => {
        if (!text.trim()) return;
        const content = text;
        setText('');
        try {
            await client.post(`/conversations/${conversationId}/messages`, { content });
        } catch (err) {
            console.error(err);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const isMine = item.sender_id === user?.id;
        return (
            <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.theirMessage]}>
                <Text style={[styles.messageText, isMine && { color: '#FFF' }]}>{item.content}</Text>
                <Text style={[styles.timeText, isMine && { color: 'rgba(255,255,255,0.7)' }]}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Sohbet</Text>

                <TouchableOpacity onPress={handleOptions}>
                    <Ionicons name="ellipsis-vertical" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                inverted
                contentContainerStyle={{ padding: 16 }}
            />

            <View style={styles.inputArea}>
                <TextInput placeholderTextColor={Colors.textSecondary}
                    style={styles.input}
                    placeholder="Mesaj yaz..."
                    value={text}
                    onChangeText={setText}
                    multiline
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                    <Ionicons name="send" size={20} color={Colors.primary} />
                </TouchableOpacity>

            </View>
        </KeyboardAvoidingView>
    );
};

const getStyles = (Colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bgMain,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: Colors.bgCard,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        ...Typography.labelLg,
        color: Colors.textPrimary,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.bgCard,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    messageText: {
        ...Typography.labelMd,
        color: Colors.textPrimary,
    },
    timeText: {
        ...Typography.labelSm,
        color: Colors.textSecondary,
        fontSize: 10,
        textAlign: 'right',
        marginTop: 4,
    },
    inputArea: {
        flexDirection: 'row',
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        backgroundColor: Colors.bgCard,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: Colors.bgMain,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        maxHeight: 100,
        ...Typography.labelMd,
        color: Colors.textPrimary,
    },
    sendButton: {
        marginLeft: 12,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
