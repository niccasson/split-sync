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
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleLarge" style={styles.title}>Account Settings</Text>
                    <Button
                        mode="contained"
                        onPress={handleSignOut}
                        style={styles.button}
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
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    card: {
        marginBottom: 16,
    },
    title: {
        marginBottom: 16,
        textAlign: 'center',
    },
    button: {
        marginTop: 8,
    },
}); 