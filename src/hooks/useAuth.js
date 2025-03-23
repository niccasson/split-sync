import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';

export const useAuth = () => {
    const [isChecking, setIsChecking] = useState(true);
    const [user, setUser] = useState(null);
    const navigation = useNavigation();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                setIsChecking(true);
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user || null);

                if (session?.user) {
                    // If we have a user and we're on Home/Login, go to Authenticated
                    const currentRoute = navigation.getCurrentRoute()?.name;
                    if (currentRoute === 'Home' || currentRoute === 'Login') {
                        navigation.replace('Authenticated');
                    }
                } else {
                    // If no user and we're in Authenticated screens, go to Login
                    const currentRoute = navigation.getCurrentRoute()?.name;
                    if (currentRoute !== 'Home' && currentRoute !== 'Login' && currentRoute !== 'SignUp') {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });
                    }
                }
            } catch (err) {
                console.error('Auth check error:', err);
            } finally {
                setIsChecking(false);
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            }
        });

        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, [navigation]);

    return { isChecking, user };
}; 