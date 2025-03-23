import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { supabase } from '../services/supabase';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { LogoIcon } from '../components/LogoIcon';

export const AccountScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();

    const handleSignOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            let nav = navigation;
            while (nav.getParent()) {
                nav = nav.getParent();
            }
            nav.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (err) {
            // Silent error handling
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <LogoIcon />
            </View>
            <Text variant="headlineMedium" style={styles.headerText}>Account</Text>

            <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
                    <Text variant="titleMedium" style={styles.emailText}>
                        {user?.email}
                    </Text>
                    <Button
                        mode="contained"
                        onPress={handleSignOut}
                        style={styles.button}
                        contentStyle={styles.buttonContent}
                        labelStyle={styles.buttonLabel}
                    >
                        Sign Out
                    </Button>
                </Card.Content>
            </Card>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#42B095',
    },
    logoContainer: {
        alignSelf: 'flex-start',
        marginTop: 40,
        marginLeft: 20,
    },
    headerText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
    },
    card: {
        marginHorizontal: 16,
        backgroundColor: '#FFFFFF',
        elevation: 2,
        borderRadius: 12,
    },
    cardContent: {
        padding: 16,
    },
    button: {
        marginVertical: 8,
        backgroundColor: '#757575',
        borderRadius: 8,
        width: '100%',
    },
    buttonContent: {
        height: 48,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    emailText: {
        color: '#424242',
        textAlign: 'center',
        marginBottom: 16,
    },
}); 