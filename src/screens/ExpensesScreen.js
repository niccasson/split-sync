import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, FAB, TextInput, Portal, Modal, Chip, IconButton, ActivityIndicator, SegmentedButtons, List, Avatar, Checkbox } from 'react-native-paper';
import { useExpenses } from '../hooks/useExpenses';
import { useGroups } from '../hooks/useGroups';
import { useFriends } from '../hooks/useFriends';
import { useAuth } from '../hooks/useAuth';
import { LogoIcon } from '../components/LogoIcon';
import { useFocusEffect } from '@react-navigation/native';

export const ExpensesScreen = () => {
    useAuth();
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [splitType, setSplitType] = useState('equal'); // 'equal' or 'custom'
    const [customAmounts, setCustomAmounts] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { expenses, loading: expensesLoading, error: expensesError, createExpense, markShareAsPaid, deleteExpense, refreshExpenses } = useExpenses();
    const { groups, refreshGroups } = useGroups();
    const { friends } = useFriends();

    const selectedGroupData = groups.find(g => g.id === selectedGroup);

    useFocusEffect(
        useCallback(() => {
            refreshExpenses();
        }, [])
    );

    const handleCreateExpense = async () => {
        if (!title.trim() || !amount || amount <= 0) {
            setError('Title and valid amount are required');
            return;
        }

        if (!selectedGroup && selectedFriends.length === 0) {
            setError('Please select a group or friends to split with');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const totalAmount = parseFloat(amount);
            let shares = [];

            if (selectedGroup) {
                // Split among group members
                const members = groups.find(g => g.id === selectedGroup)?.members || [];
                console.log('Group split calculation:', {
                    totalAmount,
                    numberOfMembers: members.length,
                    members: members.map(m => m.full_name)
                });

                const shareAmount = splitType === 'equal'
                    ? totalAmount / members.length
                    : 0;

                console.log('Share amount per member:', shareAmount);

                shares = members.map(member => ({
                    userId: member.id,
                    amount: splitType === 'equal' ? shareAmount : (customAmounts[member.id] || 0)
                }));

                console.log('Final shares:', shares);
            } else {
                // Split among selected friends
                console.log('Friend split calculation:', {
                    totalAmount,
                    numberOfFriends: selectedFriends.length,
                    selectedFriends
                });

                const shareAmount = splitType === 'equal'
                    ? totalAmount / selectedFriends.length
                    : 0;

                console.log('Share amount per friend:', shareAmount);

                shares = selectedFriends.map(friendId => ({
                    userId: friendId,
                    amount: splitType === 'equal' ? shareAmount : (customAmounts[friendId] || 0)
                }));

                console.log('Final shares:', shares);
            }

            await createExpense({
                title,
                description,
                totalAmount,
                groupId: selectedGroup,
                shares
            });

            setCreateModalVisible(false);
            resetForm();
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setAmount('');
        setSelectedGroup(null);
        setSelectedFriends([]);
        setSplitType('equal');
        setCustomAmounts({});
        setError('');
    };

    const handleDeleteExpense = async (expenseId) => {
        try {
            console.log('Delete button clicked for expense:', expenseId);
            setLoading(true);
            await deleteExpense(expenseId);
            console.log('Delete operation completed for expense:', expenseId);
        } catch (err) {
            console.error('Error in handleDeleteExpense:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFriendSelect = (friend) => {
        if (selectedFriends.includes(friend.id)) {
            setSelectedFriends(selectedFriends.filter(id => id !== friend.id));
        } else {
            setSelectedFriends([...selectedFriends, friend.id]);
        }
    };

    const filteredExpenses = expenses
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const renderFriend = ({ item: friend }) => (
        <List.Item
            title={friend.full_name || friend.email}
            description={friend.email}
            left={props => (
                <Avatar.Text
                    {...props}
                    label={(friend.full_name || ' ').substring(0, 2).toUpperCase()}
                    size={40}
                />
            )}
            onPress={() => handleFriendSelect(friend)}
            right={props => (
                <Checkbox
                    status={selectedFriends.includes(friend.id) ? 'checked' : 'unchecked'}
                    onPress={() => handleFriendSelect(friend)}
                />
            )}
        />
    );

    const handleOpenCreateModal = useCallback(async () => {
        console.log('Opening create expense modal, refreshing groups...');
        await refreshGroups();
        setCreateModalVisible(true);
    }, [refreshGroups]);

    if (expensesLoading) {
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
                <Text variant="headlineMedium" style={styles.headerText}>Expenses</Text>

                {expensesError ? (
                    <Text style={styles.error}>{expensesError}</Text>
                ) : null}

                {filteredExpenses.map((expense) => (
                    <Card key={expense.id} style={styles.expenseCard}>
                        <Card.Content>
                            <View style={styles.expenseHeader}>
                                <View>
                                    <Text variant="titleMedium" style={styles.expenseTitle}>{expense.title}</Text>
                                    <Text variant="bodySmall" style={styles.expenseDate}>
                                        {new Date(expense.createdAt).toLocaleDateString()}
                                    </Text>
                                    {expense.description && (
                                        <Text variant="bodyMedium" style={styles.expenseDescription}>{expense.description}</Text>
                                    )}
                                </View>
                                {expense.isOwner && (
                                    <IconButton
                                        icon="delete"
                                        iconColor="#424242"
                                        onPress={() => handleDeleteExpense(expense.id)}
                                    />
                                )}
                            </View>

                            <Text variant="titleMedium" style={styles.amount}>
                                Total: ${expense.totalAmount.toFixed(2)}
                            </Text>

                            <View style={styles.sharesContainer}>
                                {expense.shares.map((share) => (
                                    <Chip
                                        key={share.id}
                                        style={[
                                            styles.shareChip,
                                            share.paid && styles.paidChip
                                        ]}
                                        onPress={() => {
                                            if (!share.paid && expense.isOwner) {
                                                markShareAsPaid(share.id);
                                            }
                                        }}
                                    >
                                        {`${share.user.full_name}: $${share.amount.toFixed(2)} ${share.paid ? '(Paid)' : ''}`}
                                    </Chip>
                                ))}
                            </View>
                        </Card.Content>
                    </Card>
                ))}
            </ScrollView>

            {/* Create Expense Modal */}
            <Portal>
                <Modal
                    visible={createModalVisible}
                    onDismiss={() => {
                        setCreateModalVisible(false);
                        resetForm();
                    }}
                    contentContainerStyle={styles.modal}
                >
                    <ScrollView>
                        <Text variant="titleLarge" style={styles.modalTitle}>Create Expense</Text>
                        {error ? <Text style={styles.error}>{error}</Text> : null}

                        <TextInput
                            label="Title"
                            value={title}
                            onChangeText={setTitle}
                            mode="outlined"
                            style={styles.input}
                            outlineColor="#424242"
                            activeOutlineColor="#42B095"
                        />

                        <TextInput
                            label="Description (optional)"
                            value={description}
                            onChangeText={setDescription}
                            mode="outlined"
                            style={styles.input}
                            multiline
                            outlineColor="#424242"
                            activeOutlineColor="#42B095"
                        />

                        <TextInput
                            label="Amount"
                            value={amount}
                            onChangeText={(text) => {
                                // Allow only numbers and up to 2 decimal places
                                const regex = /^\d*\.?\d{0,2}$/;
                                if (regex.test(text) || text === '') {
                                    setAmount(text);
                                }
                            }}
                            mode="outlined"
                            keyboardType="decimal-pad"
                            style={styles.input}
                            outlineColor="#424242"
                            activeOutlineColor="#42B095"
                        />

                        <Text variant="titleMedium" style={styles.sectionTitle}>Split With</Text>

                        {groups.length > 0 && (
                            <View style={styles.groupSelection}>
                                <Text variant="bodyMedium" style={styles.sectionSubtitle}>Select Group (optional):</Text>
                                {groups.map(group => (
                                    <Chip
                                        key={group.id}
                                        selected={selectedGroup === group.id}
                                        onPress={() => {
                                            setSelectedGroup(selectedGroup === group.id ? null : group.id);
                                            setSelectedFriends([]);
                                        }}
                                        style={[styles.chip, selectedGroup === group.id && styles.selectedChip]}
                                        textStyle={styles.chipText}
                                    >
                                        {group.name}
                                    </Chip>
                                ))}
                            </View>
                        )}

                        {!selectedGroup && friends.length > 0 && (
                            <View style={styles.friendSelection}>
                                <Text variant="bodyMedium" style={styles.sectionSubtitle}>Select Friends:</Text>
                                <List.Section>
                                    {friends.map(friend => (
                                        <List.Item
                                            key={friend.id}
                                            title={friend.full_name || friend.email}
                                            onPress={() => handleFriendSelect(friend)}
                                            right={props => (
                                                <Checkbox
                                                    status={selectedFriends.includes(friend.id) ? 'checked' : 'unchecked'}
                                                    onPress={() => handleFriendSelect(friend)}
                                                    color="#42B095"  // Checked color
                                                    uncheckedColor="#E8F5E9"  // Unchecked color
                                                />
                                            )}
                                            titleStyle={styles.friendName}
                                        />
                                    ))}
                                </List.Section>
                            </View>
                        )}

                        <SegmentedButtons
                            value={splitType}
                            onValueChange={setSplitType}
                            buttons={[
                                { value: 'equal', label: 'Split Equally' },
                                { value: 'custom', label: 'Custom Split' }
                            ]}
                            style={styles.splitTypeButtons}
                            theme={{
                                colors: {
                                    secondaryContainer: '#E8F5E9',  // Light green for unselected
                                    onSecondaryContainer: '#424242',  // Dark grey text for unselected
                                    primary: '#42B095',  // Mint green for selected
                                }
                            }}
                        />

                        {splitType === 'custom' && (selectedGroupData?.members || selectedFriends).length > 0 && (
                            <View style={styles.customSplitContainer}>
                                <Text variant="bodyMedium" style={styles.sectionSubtitle}>Enter custom amounts:</Text>
                                {(selectedGroupData
                                    ? selectedGroupData.members
                                    : friends.filter(f => selectedFriends.includes(f.id))
                                ).map(member => (
                                    <TextInput
                                        key={member.id}
                                        label={member.full_name || member.email}
                                        value={customAmounts[member.id] || ''}
                                        onChangeText={(text) => {
                                            const regex = /^\d*\.?\d{0,2}$/;
                                            if (regex.test(text) || text === '') {
                                                setCustomAmounts({
                                                    ...customAmounts,
                                                    [member.id]: text
                                                });
                                            }
                                        }}
                                        mode="outlined"
                                        keyboardType="decimal-pad"
                                        style={styles.input}
                                        outlineColor="#424242"
                                        activeOutlineColor="#42B095"
                                    />
                                ))}
                            </View>
                        )}

                        <Button
                            mode="contained"
                            onPress={handleCreateExpense}
                            loading={loading}
                            style={styles.modalButton}
                            buttonColor="#42B095"
                            textColor="white"
                        >
                            Create Expense
                        </Button>
                        <Button
                            onPress={() => {
                                setCreateModalVisible(false);
                                resetForm();
                            }}
                            textColor="#424242"
                        >
                            Cancel
                        </Button>
                    </ScrollView>
                </Modal>
            </Portal>

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={handleOpenCreateModal}
                label="Add Expense"
                color="#42B095"
                theme={{ colors: { surface: 'white' } }}
            />
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
    expenseCard: {
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
        elevation: 2,
        borderRadius: 12,
    },
    expenseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    expenseTitle: {
        fontSize: 18,
        fontWeight: '400',
        color: '#424242',
    },
    expenseDescription: {
        fontSize: 14,
        color: '#424242',
        opacity: 0.8,
    },
    amount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#424242',
    },
    sharesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    shareChip: {
        margin: 4,
        backgroundColor: '#E8F5E9', // Light green background for chips
    },
    paidChip: {
        backgroundColor: '#4CAF50',
    },
    chipText: {
        color: '#424242', // Dark grey text
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
        borderRadius: 12,
        maxHeight: '80%',
        elevation: 2,
    },
    modalTitle: {
        marginBottom: 20,
        textAlign: 'center',
        color: '#424242',
        fontSize: 20,
        fontWeight: '600',
    },
    input: {
        marginBottom: 20,
    },
    sectionTitle: {
        marginBottom: 12,
        color: '#424242',
        fontSize: 16,
        fontWeight: '600',
    },
    sectionSubtitle: {
        color: '#424242',
        marginBottom: 8,
    },
    groupSelection: {
        marginBottom: 20,
    },
    friendSelection: {
        marginBottom: 20,
    },
    chip: {
        margin: 4,
        backgroundColor: '#E8F5E9',
    },
    selectedChip: {
        backgroundColor: '#42B095',
    },
    splitTypeButtons: {
        marginBottom: 20,
    },
    customSplitContainer: {
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
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)'
    },
    expenseDate: {
        fontSize: 12,
        color: '#424242',
        opacity: 0.6,
        marginBottom: 4,
    },
    friendName: {
        color: '#424242',
        fontSize: 16,
    },
}); 