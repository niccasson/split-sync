import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, Surface } from 'react-native-paper';
import { supabase } from '../services/supabase';
import { FormInput } from '../components/FormInput';
import { LogoIcon } from '../components/LogoIcon';

export const SignUpScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSignUp = async () => {
        try {
            setLoading(true);
            setError('');
            setSuccessMessage('');

            // Validate inputs
            if (!displayName.trim()) {
                throw new Error('Display name is required');
            }

            if (password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }

            console.log('Starting signup process for:', { email, displayName });

            // First create the auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                metadata: {
                    full_name: displayName.trim()
                }
            });

            if (authError) {
                console.error('Auth signup error:', authError);
                throw authError;
            }

            // Check if email is already registered
            if (authData?.user?.identities?.length === 0) {
                throw new Error('Email already registered');
            }

            // Create the user in public.users table
            if (authData?.user?.id) {
                console.log('Creating public user record:', {
                    id: authData.user.id,
                    email: authData.user.email,
                    full_name: displayName.trim()
                });

                const { error: publicUserError } = await supabase
                    .from('users')
                    .insert([{
                        id: authData.user.id,
                        email: authData.user.email,
                        full_name: displayName.trim(),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (publicUserError) {
                    console.error('Error creating public user:', publicUserError);
                    throw publicUserError;
                }
            }

            // Handle email confirmation message
            if (!authData.session) {
                console.log('Email verification required');
                setSuccessMessage('Verification email has been sent. Please check your inbox.');
                setEmail('');
                setDisplayName('');
                setPassword('');
                setConfirmPassword('');
            } else {
                console.log('User created and signed in successfully');
            }

        } catch (error) {
            console.error('Signup process error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <LogoIcon />
            </View>

            <Text variant="headlineMedium" style={styles.title}>Create Account</Text>

            <Surface style={styles.formContainer} elevation={2}>
                {error ? <Text style={styles.error}>{error}</Text> : null}
                {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

                <FormInput
                    label="Display Name"
                    value={displayName}
                    onChangeText={setDisplayName}
                    style={styles.input}
                    activeOutlineColor="#42B095"
                />

                <FormInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={styles.input}
                    activeOutlineColor="#42B095"
                />

                <FormInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={styles.input}
                    activeOutlineColor="#42B095"
                />

                <FormInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    style={styles.input}
                    activeOutlineColor="#42B095"
                />

                <Button
                    mode="contained"
                    onPress={handleSignUp}
                    loading={loading}
                    style={styles.button}
                    buttonColor="#42B095"
                >
                    Sign Up
                </Button>

                <Button
                    onPress={() => navigation.navigate('Login')}
                    textColor="#424242"
                >
                    Already have an account? Login
                </Button>
            </Surface>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#42B095',
    },
    logoContainer: {
        alignSelf: 'flex-start',
        marginTop: 40,
        marginLeft: 20,
    },
    title: {
        textAlign: 'center',
        marginBottom: 20,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    input: {
        marginBottom: 12,
    },
    button: {
        marginVertical: 10,
        borderRadius: 8,
    },
    error: {
        color: '#B00020',
        marginBottom: 10,
        textAlign: 'center',
    },
    success: {
        color: '#4CAF50',
        marginBottom: 10,
        textAlign: 'center',
    },
    formContainer: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 12,
        marginTop: 20,
    },
}); 