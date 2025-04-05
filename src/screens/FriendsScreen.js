import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Card, Button, FAB, TextInput, Portal, Modal, Avatar, Chip, SegmentedButtons } from 'react-native-paper';
import { useFriends } from '../hooks/useFriends';
import { useAuth } from '../hooks/useAuth';
import { LogoIcon } from '../components/LogoIcon';
import { supabase } from '../services/supabase';
import { useFocusEffect } from '@react-navigation/native';

export const FriendsScreen = () => {
    const { isChecking } = useAuth();
    const [visible, setVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [manualName, setManualName] = useState('');
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState('');
    const [addType, setAddType] = useState('existing'); // 'existing' or 'manual'

    const { friends, loading: friendsLoading, error: friendsError, addFriend, refreshFriends } = useFriends();

    useFocusEffect(
        useCallback(() => {
            refreshFriends();
        }, [])
    );

    const handleAddFriend = async () => {
        try {
            setModalLoading(true);
            setModalError('');

            if (addType === 'existing') {
                if (!email.trim()) {
                    throw new Error('Email is required');
                }
                await addFriend(email);
            } else {
                if (!manualName.trim()) {
                    throw new Error('Name is required');
                }

                // Add manual friend to database
                const { data: { user } } = await supabase.auth.getUser();
                const { error: manualFriendError } = await supabase
                    .from('manual_friends')
                    .insert([{
                        user_id: user.id,
                        name: manualName.trim()
                    }]);

                if (manualFriendError) {
                    throw manualFriendError;
                }

                await refreshFriends();
            }

            setVisible(false);
            setEmail('');
            setManualName('');
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

    if (friendsLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#42B095" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.logoContainer}>
                    <LogoIcon />
                </View>
                <Text variant="headlineMedium" style={styles.headerText}>Friends</Text>

                {friendsError ? (
                    <Text style={styles.error}>{friendsError}</Text>
                ) : null}

                {/* Friends List */}
                {friends.map((friend) => {
                    return (
                        <Card key={friend.id} style={styles.friendCard}>
                            <Card.Content style={styles.friendContent}>
                                <View style={styles.friendInfo}>
                                    <Avatar.Text
                                        size={40}
                                        label={(friend.full_name || ' ').substring(0, 2).toUpperCase()}
                                        style={styles.avatar}
                                        color="white"
                                    />
                                    <View style={styles.friendDetails}>
                                        <Text variant="titleMedium" style={styles.friendName}>
                                            {friend.full_name || ' '}
                                        </Text>
                                        <Text variant="bodySmall" style={styles.friendEmail}>{friend.email}</Text>
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
                    );
                })}
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

                    <SegmentedButtons
                        value={addType}
                        onValueChange={setAddType}
                        buttons={[
                            { value: 'existing', label: 'Existing User' },
                            { value: 'manual', label: 'Manual Entry' }
                        ]}
                        style={styles.addTypeButtons}
                        theme={{
                            colors: {
                                secondaryContainer: '#E8F5E9',
                                onSecondaryContainer: '#424242',
                                primary: '#42B095',
                            }
                        }}
                    />

                    {addType === 'existing' ? (
                        <TextInput
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            mode="outlined"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                            outlineColor="#424242"
                            activeOutlineColor="#42B095"
                        />
                    ) : (
                        <TextInput
                            label="Friend's Name"
                            value={manualName}
                            onChangeText={setManualName}
                            mode="outlined"
                            style={styles.input}
                            outlineColor="#424242"
                            activeOutlineColor="#42B095"
                        />
                    )}

                    <Button
                        mode="contained"
                        onPress={handleAddFriend}
                        loading={modalLoading}
                        style={styles.modalButton}
                        buttonColor="#42B095"
                        textColor="white"
                    >
                        Add Friend
                    </Button>
                    <Button
                        onPress={() => setVisible(false)}
                        textColor="#424242"
                    >
                        Cancel
                    </Button>
                </Modal>
            </Portal>

            {/* FAB for adding friends */}
            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => setVisible(true)}
                label="Add Friend"
                color="#42B095"
                theme={{ colors: { surface: 'white' } }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#42B095', // Mint green background
    },
    scrollView: {
        flex: 1,
        padding: 16,
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
    title: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 20,
    },
    friendCard: {
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
        elevation: 2,
        borderRadius: 12,
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
        backgroundColor: 'white',
        borderColor: '#42B095',
        borderWidth: 1,
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
    avatar: {
        backgroundColor: '#42B095',
    },
    friendName: {
        color: '#424242',
        fontSize: 16,
        fontWeight: '600',
    },
    friendEmail: {
        color: '#424242',
        opacity: 0.8,
        fontSize: 14,
    },
    addTypeButtons: {
        marginBottom: 20,
    },
}); 