import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { supabase } from '../services/supabase';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';

export const AccountScreen = () => {
    const navigation = useNavigation();
    useAuth();

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
            <View style={styles.header}>
                <Text variant="headlineMedium" style={styles.headerText}>Account</Text>
            </View>

            <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    headerText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '600',
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
}); 