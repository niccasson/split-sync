import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { supabase } from '../services/supabase';
import { FormInput } from '../components/FormInput';

export const SignUpScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignUp = async () => {
        if (!fullName.trim()) {
            setError('Full name is required');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // 1. Sign up the user with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (authError) throw authError;

            // 2. Add the user to our users table
            const { error: dbError } = await supabase
                .from('users')
                .insert([
                    {
                        id: authData.user.id,
                        email: email.toLowerCase(),
                        full_name: fullName,
                    }
                ]);

            if (dbError) throw dbError;

            // Show success message
            alert('Please check your email for verification link');
            navigation.navigate('Login');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text variant="headlineMedium" style={styles.title}>Create Account</Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <FormInput
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
            />

            <FormInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <FormInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <Button
                mode="contained"
                onPress={handleSignUp}
                loading={loading}
                style={styles.button}
            >
                Sign Up
            </Button>

            <Button
                onPress={() => navigation.navigate('Login')}
            >
                Already have an account? Login
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        textAlign: 'center',
        marginBottom: 20,
    },
    button: {
        marginVertical: 10,
    },
    error: {
        color: 'red',
        marginBottom: 10,
        textAlign: 'center',
    },
}); 