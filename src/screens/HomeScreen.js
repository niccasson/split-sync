import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

export const HomeScreen = ({ navigation }) => {
    const theme = useTheme();

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                {/* App Logo/Icon */}
                <Image
                    source={require('../../assets/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                {/* App Title */}
                <Text variant="displaySmall" style={styles.title}>
                    Split & Share
                </Text>

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
                        <Text variant="bodyMedium">
                            Create groups for roommates, trips, or events and manage expenses together
                        </Text>
                    </View>

                    <View style={styles.feature}>
                        <Text variant="titleSmall" style={styles.featureTitle}>
                            💰 Smart Expense Splitting
                        </Text>
                        <Text variant="bodyMedium">
                            Split bills evenly or customize amounts for each person
                        </Text>
                    </View>

                    <View style={styles.feature}>
                        <Text variant="titleSmall" style={styles.featureTitle}>
                            📊 Clear Overview
                        </Text>
                        <Text variant="bodyMedium">
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
                    >
                        Get Started
                    </Button>

                    <Button
                        mode="outlined"
                        onPress={() => navigation.navigate('Login')}
                        style={styles.button}
                        contentStyle={styles.buttonContent}
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
        backgroundColor: '#fff',
    },
    content: {
        padding: 20,
        alignItems: 'center',
    },
    logo: {
        width: 120,
        height: 120,
        marginTop: 40,
    },
    title: {
        marginTop: 20,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    tagline: {
        marginTop: 10,
        textAlign: 'center',
        color: '#666',
    },
    featuresContainer: {
        marginTop: 40,
        width: '100%',
    },
    sectionTitle: {
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    feature: {
        marginBottom: 25,
        backgroundColor: '#f8f8f8',
        padding: 15,
        borderRadius: 10,
    },
    featureTitle: {
        marginBottom: 5,
        fontWeight: 'bold',
    },
    ctaContainer: {
        marginTop: 20,
        width: '100%',
        paddingHorizontal: 20,
    },
    button: {
        marginVertical: 8,
        width: '100%',
    },
    buttonContent: {
        paddingVertical: 8,
    },
}); 