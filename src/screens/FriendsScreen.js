import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, FAB, TextInput, Portal, Modal, Avatar, ActivityIndicator } from 'react-native-paper';
import { useFriends } from '../hooks/useFriends';

export const FriendsScreen = () => {
    const [visible, setVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState('');

    const { friends, loading, error, addFriend } = useFriends();

    const handleAddFriend = async () => {
        try {
            setModalLoading(true);
            setModalError('');
            await addFriend(email);
            setVisible(false);
            setEmail('');
        } catch (error) {
            setModalError(error.message);
        } finally {
            setModalLoading(false);
        }
    };

    const getBalanceColor = (balance) => {
        if (balance > 0) return '#4CAF50'; // Green for positive balance
        if (balance < 0) return '#B00020'; // Red for negative balance
        return '#757575'; // Grey for zero balance
    };

    if (loading && !visible) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <Text variant="headlineMedium" style={styles.title}>Friends</Text>

                {error ? (
                    <Text style={styles.error}>{error}</Text>
                ) : null}

                {/* Friends List */}
                {friends.map((friend) => (
                    <Card key={friend.id} style={styles.friendCard}>
                        <Card.Content style={styles.friendContent}>
                            <View style={styles.friendInfo}>
                                <Avatar.Text
                                    size={40}
                                    label={friend.name.split(' ').map(n => n[0]).join('')}
                                />
                                <View style={styles.friendDetails}>
                                    <Text variant="titleMedium">{friend.name}</Text>
                                    <Text variant="bodySmall">{friend.email}</Text>
                                </View>
                            </View>
                            <View style={styles.balanceContainer}>
                                <Text
                                    variant="titleMedium"
                                    style={{ color: getBalanceColor(friend.balance) }}
                                >
                                    ${Math.abs(friend.balance).toFixed(2)}
                                </Text>
                                <Text variant="bodySmall" style={{ color: getBalanceColor(friend.balance) }}>
                                    {friend.balance > 0 ? 'owes you' : friend.balance < 0 ? 'you owe' : 'settled up'}
                                </Text>
                            </View>
                        </Card.Content>
                    </Card>
                ))}
            </ScrollView>

            {/* Add Friend Modal */}
            <Portal>
                <Modal
                    visible={visible}
                    onDismiss={() => setVisible(false)}
                    contentContainerStyle={styles.modal}
                >
                    <Text variant="titleLarge" style={styles.modalTitle}>Add Friend</Text>
                    {modalError ? <Text style={styles.error}>{modalError}</Text> : null}
                    <TextInput
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        mode="outlined"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                    />
                    <Button
                        mode="contained"
                        onPress={handleAddFriend}
                        loading={modalLoading}
                        style={styles.modalButton}
                    >
                        Add Friend
                    </Button>
                    <Button
                        onPress={() => setVisible(false)}
                    >
                        Cancel
                    </Button>
                </Modal>
            </Portal>

            {/* FAB for adding friends */}
            <FAB
                icon="account-plus"
                style={styles.fab}
                onPress={() => setVisible(true)}
                label="Add Friend"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    title: {
        marginBottom: 20,
    },
    friendCard: {
        marginBottom: 12,
    },
    friendContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    friendInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    friendDetails: {
        marginLeft: 12,
    },
    balanceContainer: {
        alignItems: 'flex-end',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    modal: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 8,
    },
    modalTitle: {
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        marginBottom: 20,
    },
    modalButton: {
        marginBottom: 12,
    },
    error: {
        color: '#B00020',
        marginBottom: 12,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
}); 