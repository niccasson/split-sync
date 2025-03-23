import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';
import { useNavigation } from '@react-navigation/native';

export const withProtectedRoute = (WrappedComponent) => {
    return (props) => {
        const [isChecking, setIsChecking] = useState(true);
        const navigation = useNavigation();

        useEffect(() => {
            console.log('Protected route check starting');
            const checkAuth = async () => {
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    console.log('Auth check result:', { hasSession: !!session });

                    if (!session) {
                        console.log('No session found, redirecting to login');
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });
                    } else {
                        console.log('Session found, allowing access');
                        setIsChecking(false);
                    }
                } catch (error) {
                    console.error('Auth check error:', error);
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                }
            };

            checkAuth();
        }, [navigation]);

        if (isChecking) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" />
                </View>
            );
        }

        return <WrappedComponent {...props} />;
    };
}; 