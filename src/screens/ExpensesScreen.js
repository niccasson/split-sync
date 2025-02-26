import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export const ExpensesScreen = () => {
    return (
        <View style={styles.container}>
            <Text variant="headlineMedium">Expenses</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
}); 