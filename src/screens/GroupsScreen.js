import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export const GroupsScreen = () => {
    return (
        <View style={styles.container}>
            <Text variant="headlineMedium">Groups</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
}); 