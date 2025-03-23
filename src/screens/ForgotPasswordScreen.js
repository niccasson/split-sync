import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, Surface } from 'react-native-paper';
import { supabase } from '../services/supabase';
import { FormInput } from '../components/FormInput';
import { LogoIcon } from '../components/LogoIcon';

export const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleResetPassword = async () => {
        try {
            setLoading(true);
            setError('');

            const { error } = await supabase.auth.resetPasswordForEmail(email);

            if (error) throw error;

            alert('Password reset instructions sent to your email');
            navigation.navigate('Login');
        } catch (error) {
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

            <Text variant="headlineMedium" style={styles.title}>Reset Password</Text>

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

                <Button
                    mode="contained"
                    onPress={handleResetPassword}
                    loading={loading}
                    style={styles.button}
                    buttonColor="#42B095"
                >
                    Send Reset Instructions
                </Button>

                <Button
                    onPress={() => navigation.navigate('Login')}
                    textColor="#424242"
                >
                    Back to Login
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
    formContainer: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 12,
        marginTop: 20,
    },
}); 