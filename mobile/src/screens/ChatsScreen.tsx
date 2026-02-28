import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useThemeColor } from '../constants/colors';
import { Typography } from '../constants/typography';
import client from '../api/client';
import { useSocket } from '../hooks/useSocket';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';


type Props = {
    navigation: NativeStackNavigationProp<any>;
};

export const ChatsScreen = ({ navigation }: Props) => {
    const Colors = useThemeColor();
    const styles = getStyles(Colors);
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const socket = useSocket();

    useEffect(() => {
        fetchConversations();

        if (socket) {
            socket.on('new_message', () => {
                fetchConversations(); // Refresh list on new message
            });
            socket.on('match_confirmed', () => {
                fetchConversations(); // Refresh list on new match
            });
        }

        return () => {
            if (socket) {
                socket.off('new_message');
                socket.off('match_confirmed');
            }
        };
    }, [socket]);

    const fetchConversations = async () => {
        try {
            const res = await client.get('/conversations');
            setConversations(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.convItem}
            onPress={() => navigation.navigate('Chat', { conversationId: item.id })}
        >
            <Image
                source={{ uri: item.otherUser.avatar_url || 'https://via.placeholder.com/100' }}
                style={styles.avatar}
            />
            <View style={styles.convInfo}>
                <View style={styles.convHeader}>
                    <Text style={styles.userName}>{item.otherUser.name}</Text>
                    {item.last_message_at && (
                        <Text style={styles.timeText}>
                            {new Date(item.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    )}
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.last_message || 'Henüz mesaj yok. İlk adımı sen at! 👋'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading && conversations.length === 0) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mesajlar</Text>

            {conversations.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="chatbubbles-outline" size={80} color={Colors.border} style={{ marginBottom: 16 }} />
                    <Text style={styles.emptyTitle}>Henüz Sohbet Yok</Text>

                    <Text style={styles.emptySubtitle}>Bir aktivite araması başlat ve birileriyle eşleş!</Text>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    refreshing={loading}
                    onRefresh={fetchConversations}
                />
            )}
        </View>
    );
};

const getStyles = (Colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bgMain,
        paddingTop: 60,
    },
    title: {
        ...Typography.displaySm,
        color: Colors.textPrimary,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    convItem: {
        flexDirection: 'row',
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: '#FFF',
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.bgMain,
    },
    convInfo: {
        flex: 1,
        marginLeft: 12,
    },
    convHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: {
        ...Typography.labelLg,
        color: Colors.textPrimary,
    },
    timeText: {
        ...Typography.labelSm,
        color: Colors.textSecondary,
        fontSize: 11,
    },
    lastMessage: {
        ...Typography.labelMd,
        color: Colors.textSecondary,
        fontSize: 13,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        ...Typography.labelLg,
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    emptySubtitle: {
        ...Typography.labelMd,
        color: Colors.textSecondary,
        textAlign: 'center',
    }
});
