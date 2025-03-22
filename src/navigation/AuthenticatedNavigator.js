import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { DashboardScreen } from '../screens/DashboardScreen';
import { FriendsScreen } from '../screens/FriendsScreen';
import { GroupsScreen } from '../screens/GroupsScreen';
import { ExpensesScreen } from '../screens/ExpensesScreen';
import { AccountScreen } from '../screens/AccountScreen';

const Tab = createBottomTabNavigator();

export const AuthenticatedNavigator = () => {
    const theme = useTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#42B095',
                tabBarInactiveTintColor: theme.colors.backdrop,
                tabBarStyle: {
                    paddingBottom: 5,
                    paddingTop: 5,
                },
            }}
            initialRouteName="DashboardTab"
        >
            <Tab.Screen
                name="DashboardTab"
                component={DashboardScreen}
                options={{
                    tabBarLabel: 'Dashboard',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="view-dashboard" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="FriendsTab"
                component={FriendsScreen}
                options={{
                    tabBarLabel: 'Friends',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="account-multiple" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="GroupsTab"
                component={GroupsScreen}
                options={{
                    tabBarLabel: 'Groups',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="account-group" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="ExpensesTab"
                component={ExpensesScreen}
                options={{
                    tabBarLabel: 'Expenses',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="currency-usd" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="AccountTab"
                component={AccountScreen}
                options={{
                    title: 'Account',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="account" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}; 