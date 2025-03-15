import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';

export const useAuth = () => {
    const navigation = useNavigation();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                setIsChecking(true);
                const { data: { user }, error } = await supabase.auth.getUser();

                if (!user || error) {
                    let nav = navigation;
                    while (nav.getParent()) {
                        nav = nav.getParent();
                    }

                    nav.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                }
            } catch (err) {
                let nav = navigation;
                while (nav.getParent()) {
                    nav = nav.getParent();
                }

                nav.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            } finally {
                setIsChecking(false);
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                let nav = navigation;
                while (nav.getParent()) {
                    nav = nav.getParent();
                }

                nav.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            }
        });

        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, [navigation]);

    return { isChecking };
}; 