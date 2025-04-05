import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export const useAuth = () => {
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    // If no user, let the navigation handle redirect to auth
                    throw new Error('No user');
                }
            } catch (error) {
                // Let the navigation handle the redirect
            } finally {
                setIsChecking(false);
            }
        };

        checkAuth();

        const { data: authListener } = supabase.auth.onAuthStateChange(async () => {
            checkAuth();
        });

        return () => {
            if (authListener?.subscription) {
                authListener.subscription.unsubscribe();
            }
        };
    }, []);

    return { isChecking };
}; 