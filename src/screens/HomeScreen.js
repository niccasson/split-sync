import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Button, Text, Surface } from 'react-native-paper';

export const HomeScreen = ({ navigation }) => {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                {/* App Logo */}
                <Surface style={styles.logoContainer} elevation={2}>
                    <Image
                        source={require('../../assets/split-sync_1200x1200Transparent.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </Surface>

                {/* Tagline */}
                <Text variant="titleLarge" style={styles.tagline}>
                    Split expenses with friends, hassle-free
                </Text>

                {/* Features Section */}
                <View style={styles.featuresContainer}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Why Choose Split & Share?
                    </Text>

                    <View style={styles.feature}>
                        <Text variant="titleSmall" style={styles.featureTitle}>
                            🤝 Easy Group Management
                        </Text>
                        <Text variant="bodyMedium" style={styles.featureText}>
                            Create groups for roommates, trips, or events and manage expenses together
                        </Text>
                    </View>

                    <View style={styles.feature}>
                        <Text variant="titleSmall" style={styles.featureTitle}>
                            💰 Smart Expense Splitting
                        </Text>
                        <Text variant="bodyMedium" style={styles.featureText}>
                            Split bills evenly or customize amounts for each person
                        </Text>
                    </View>

                    <View style={styles.feature}>
                        <Text variant="titleSmall" style={styles.featureTitle}>
                            📊 Clear Overview
                        </Text>
                        <Text variant="bodyMedium" style={styles.featureText}>
                            Track who owes what with simple, intuitive balance summaries
                        </Text>
                    </View>
                </View>

                {/* Call to Action Buttons */}
                <View style={styles.ctaContainer}>
                    <Button
                        mode="contained"
                        onPress={() => navigation.navigate('SignUp')}
                        style={styles.button}
                        contentStyle={styles.buttonContent}
                        buttonColor="#42B095"
                        textColor="white"
                    >
                        Get Started
                    </Button>

                    <Button
                        mode="outlined"
                        onPress={() => navigation.navigate('Login')}
                        style={styles.outlinedButton}
                        contentStyle={styles.buttonContent}
                        textColor="#424242"
                    >
                        I already have an account
                    </Button>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#42B095',
    },
    content: {
        padding: 20,
        alignItems: 'center',
    },
    logoContainer: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 12,
        marginTop: 40,
        marginBottom: 20,
    },
    logo: {
        width: 350,
        height: 140,
    },
    tagline: {
        marginTop: 10,
        textAlign: 'center',
        color: '#FFFFFF',
        opacity: 0.9,
    },
    featuresContainer: {
        marginTop: 40,
        width: '100%',
    },
    sectionTitle: {
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: '600',
        color: '#FFFFFF',
    },
    feature: {
        marginBottom: 25,
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 12,
        elevation: 2,
    },
    featureTitle: {
        marginBottom: 5,
        fontWeight: '600',
        color: '#424242',
    },
    featureText: {
        color: '#424242',
        opacity: 0.8,
    },
    ctaContainer: {
        marginTop: 20,
        width: '100%',
        paddingHorizontal: 20,
    },
    button: {
        marginVertical: 8,
        width: '100%',
        borderRadius: 8,
    },
    outlinedButton: {
        marginVertical: 8,
        width: '100%',
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
        borderColor: '#424242',
    },
    buttonContent: {
        paddingVertical: 8,
        height: 48,
    },
}); 