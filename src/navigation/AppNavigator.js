import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../hooks/useAuth';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export const AppNavigator = () => {
    const { isChecking } = useAuth();

    if (isChecking) {
        return null; // Or a loading screen
    }

    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen
                    name="MainTabs"
                    component={TabNavigator}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Auth"
                    component={AuthScreen}
                    options={{ headerShown: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const TabNavigator = () => {
    return (
        <Tab.Navigator>
            {/* Your tab screens */}
        </Tab.Navigator>
    );
}; 