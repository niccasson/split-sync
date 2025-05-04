import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigation } from '@react-navigation/native';

export const useAuth = () => {
    const [isChecking, setIsChecking] = useState(true);
    const navigation = useNavigation();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    // Redirect to Home if no user
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Home' }]
                    });
                }
            } catch (error) {
                // Also redirect on error
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }]
                });
            } finally {
                setIsChecking(false);
            }
        };

        checkAuth();

        // Listen for auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }]
                });
            }
        });

        return () => {
            if (authListener?.subscription) {
                authListener.subscription.unsubscribe();
            }
        };
    }, [navigation]);

    return { isChecking };
}; 