import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, Surface } from 'react-native-paper';
import { supabase } from '../services/supabase';
import { FormInput } from '../components/FormInput';
import { LogoIcon } from '../components/LogoIcon';

export const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        try {
            setLoading(true);
            setError('');

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Redirect to Authenticated navigator instead of Dashboard
            navigation.replace('Authenticated');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <LogoIcon />
                </View>
                <Text variant="headlineMedium" style={styles.headerText}>Login</Text>
            </View>

            <Surface style={styles.formContainer} elevation={2}>
                {error ? <Text style={styles.error}>{error}</Text> : null}

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

                <Button
                    mode="contained"
                    onPress={handleLogin}
                    loading={loading}
                    style={styles.button}
                    buttonColor="#42B095"
                >
                    Login
                </Button>

                <Button
                    onPress={() => navigation.navigate('ForgotPassword')}
                    textColor="#424242"
                >
                    Forgot Password?
                </Button>

                <Button
                    onPress={() => navigation.navigate('SignUp')}
                    textColor="#424242"
                >
                    Don't have an account? Sign Up
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
    header: {
        position: 'relative',
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    logoContainer: {
        position: 'absolute',
        left: 20,
        top: 0,
    },
    headerText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '600',
        marginTop: 8,
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
    formContainer: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 12,
        marginTop: 20,
    },
}); 