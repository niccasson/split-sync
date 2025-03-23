import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';

export const useAuth = () => {
    const [isChecking, setIsChecking] = useState(true);
    const [user, setUser] = useState(null);
    const navigation = useNavigation();

    const createUserProfile = async (userId, email) => {
        console.log('Attempting to create user profile:', { userId, email });
        try {
            const { data, error } = await supabase
                .from('users')
                .insert([{ id: userId, email }])
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    console.log('User profile already exists:', { userId, email });
                } else {
                    console.error('Error creating user profile:', { error, userId, email });
                }
            } else {
                console.log('Successfully created user profile:', data);
            }
        } catch (err) {
            console.error('Unexpected error in createUserProfile:', err);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            try {
                console.log('Checking auth state...');
                setIsChecking(true);
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                console.log('Got session:', {
                    hasSession: !!session,
                    userId: session?.user?.id,
                    email: session?.user?.email,
                    error: sessionError
                });

                setUser(session?.user || null);

                if (session?.user) {
                    console.log('Found authenticated user:', {
                        id: session.user.id,
                        email: session.user.email
                    });
                    await createUserProfile(session.user.id, session.user.email);

                    const currentRoute = navigation.getCurrentRoute()?.name;
                    console.log('Current route:', currentRoute);
                    if (currentRoute === 'Home' || currentRoute === 'Login') {
                        navigation.replace('Authenticated');
                    }
                } else {
                    console.log('No authenticated user found');
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

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', { event, userId: session?.user?.id });

            if (event === 'SIGNED_IN' && session?.user) {
                console.log('User signed in, creating profile:', {
                    id: session.user.id,
                    email: session.user.email
                });
                await createUserProfile(session.user.id, session.user.email);
            } else if (event === 'SIGNED_OUT' || !session) {
                console.log('User signed out or session ended');
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            }
        });

        return () => {
            console.log('Cleaning up auth subscription');
            if (subscription) subscription.unsubscribe();
        };
    }, [navigation]);

    return { isChecking, user };
}; 