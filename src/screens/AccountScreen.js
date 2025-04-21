import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { supabase } from '../services/supabase';
import { LogoIcon } from '../components/LogoIcon';

export const AccountScreen = ({ navigation }) => {
    const [userEmail, setUserEmail] = useState(null);

    useEffect(() => {
        const getUserEmail = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email);
            }
        };

        getUserEmail();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <LogoIcon />
                    </View>
                    <Text variant="headlineMedium" style={styles.headerText}>Account</Text>
                </View>

                <Surface style={styles.card} elevation={2}>
                    <Text variant="titleMedium" style={styles.label}>Email</Text>
                    <Text style={styles.email}>{userEmail}</Text>
                    <Button
                        mode="contained"
                        onPress={handleSignOut}
                        style={styles.button}
                        buttonColor="#42B095"
                        textColor="white"
                    >
                        Sign Out
                    </Button>
                </Surface>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#42B095',
    },
    scrollView: {
        flex: 1,
        padding: 16,
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
    card: {
        backgroundColor: 'white',
        padding: 24,
        margin: 20,
        borderRadius: 12,
    },
    label: {
        color: '#424242',
        textAlign: 'center',
        marginBottom: 16,
        fontSize: 16,
        marginTop: 8,
    },
    email: {
        color: '#424242',
        textAlign: 'center',
        marginBottom: 24,
        fontSize: 16,
    },
    button: {
        marginVertical: 8,
        backgroundColor: '#757575',
        borderRadius: 8,
        width: '100%',
    },
}); 