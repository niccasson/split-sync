import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import * as Linking from 'expo-linking';
import { theme } from './src/constants/theme';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { AuthenticatedNavigator } from './src/navigation/AuthenticatedNavigator';

const Stack = createNativeStackNavigator();

const prefix = Linking.createURL('/');

const linking = {
    prefixes: [prefix],
    config: {
        screens: {
            Home: '',
            Login: 'login',
            SignUp: 'signup',
            ForgotPassword: 'forgot-password',
            Authenticated: {
                path: 'app',
                screens: {
                    DashboardTab: 'dashboard',
                    FriendsTab: 'friends',
                    GroupsTab: 'groups',
                    ExpensesTab: 'expenses',
                }
            }
        }
    }
};

export default function App() {
    return (
        <PaperProvider theme={theme}>
            <NavigationContainer linking={linking}>
                <Stack.Navigator
                    initialRouteName="Home"
                    screenOptions={{ headerShown: false }}
                >
                    <Stack.Screen name="Home" component={HomeScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="SignUp" component={SignUpScreen} />
                    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    <Stack.Screen name="Authenticated" component={AuthenticatedNavigator} />
                </Stack.Navigator>
            </NavigationContainer>
        </PaperProvider>
    );
} 