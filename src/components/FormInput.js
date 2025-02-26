import React from 'react';
import { StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';

export const FormInput = ({ error, ...props }) => {
    return (
        <TextInput
            style={styles.input}
            mode="outlined"
            error={!!error}
            {...props}
        />
    );
};

const styles = StyleSheet.create({
    input: {
        marginBottom: 10,
    },
}); 