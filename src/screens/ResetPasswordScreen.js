import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { LogoIcon } from '../components/LogoIcon';

export const ResetPasswordScreen = () => {
    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <LogoIcon />
                    </View>
                    <Text variant="headlineMedium" style={styles.headerText}>Reset Password</Text>
                </View>

                <Surface style={styles.formContainer} elevation={2}>
                    {/* Rest of the content */}
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
    formContainer: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 12,
    },
    // ... other styles
}); 