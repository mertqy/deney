import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SearchScreen } from '../screens/SearchScreen';
import { ChatsScreen } from '../screens/ChatsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useThemeColor } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
    const Colors = useThemeColor();
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: Colors.bgCard,
                    borderTopColor: Colors.border,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textSecondary,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                }
            }}
        >
            <Tab.Screen
                name="SearchTab"
                component={SearchScreen}
                options={{
                    title: 'Keşfet',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="compass" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="ChatsTab"
                component={ChatsScreen}
                options={{
                    title: 'Sohbet',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="chatbubble" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />

        </Tab.Navigator>
    );
};
