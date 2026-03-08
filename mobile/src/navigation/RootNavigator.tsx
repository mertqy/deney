import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { SearchingScreen } from '../screens/SearchingScreen';
import { MatchFoundScreen } from '../screens/MatchFoundScreen';
import { WaitingScreen } from '../screens/WaitingScreen';
import { MatchConfirmedScreen } from '../screens/MatchConfirmedScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { LegalScreen } from '../screens/LegalScreen';
import { useAuth } from '../hooks/AuthContext';

import { ActivityIndicator, View } from 'react-native';
import { registerForPushNotificationsAsync, sendPushTokenToBackend } from '../services/pushNotifications';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (user) {
            registerForPushNotificationsAsync().then(token => {
                if (token) sendPushTokenToBackend(token);
            });
        }
    }, [user]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <>
                        <Stack.Screen name="Main" component={TabNavigator} />
                        <Stack.Screen name="Searching" component={SearchingScreen} />
                        <Stack.Screen name="MatchFound" component={MatchFoundScreen} />
                        <Stack.Screen name="Waiting" component={WaitingScreen} />
                        <Stack.Screen name="MatchConfirmed" component={MatchConfirmedScreen} />
                        <Stack.Screen name="Chat" component={ChatScreen} />
                        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                        <Stack.Screen name="Legal" component={LegalScreen} />
                    </>

                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="Legal" component={LegalScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
