import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, FAB, TextInput, Portal, Modal, Chip, IconButton, ActivityIndicator, SegmentedButtons, Menu } from 'react-native-paper';
import { useExpenses } from '../hooks/useExpenses';
import { useGroups } from '../hooks/useGroups';
import { useFriends } from '../hooks/useFriends';
import { useAuth } from '../hooks/useAuth';

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
    const [filter, setFilter] = useState('all'); // 'all', 'group', 'personal'
    const [menuVisible, setMenuVisible] = useState(false);

    const { expenses, loading: expensesLoading, error: expensesError, createExpense, markShareAsPaid, deleteExpense } = useExpenses();
    const { groups } = useGroups();
    const { friends } = useFriends();

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

    const filteredExpenses = expenses.filter(expense => {
        if (filter === 'all') return true;
        if (filter === 'group') return expense.groupId !== null;
        return expense.groupId === null;
    });

    if (expensesLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <Text variant="headlineMedium" style={styles.headerText}>Expenses</Text>
                    <Menu
                        visible={menuVisible}
                        onDismiss={() => setMenuVisible(false)}
                        anchor={
                            <IconButton
                                icon="filter-variant"
                                iconColor="white"
                                onPress={() => setMenuVisible(true)}
                            />
                        }
                    >
                        <Menu.Item onPress={() => { setFilter('all'); setMenuVisible(false); }} title="All Expenses" />
                        <Menu.Item onPress={() => { setFilter('group'); setMenuVisible(false); }} title="Group Expenses" />
                        <Menu.Item onPress={() => { setFilter('personal'); setMenuVisible(false); }} title="Personal Expenses" />
                    </Menu>
                </View>

                {expensesError ? (
                    <Text style={styles.error}>{expensesError}</Text>
                ) : null}

                {filteredExpenses.map((expense) => (
                    <Card key={expense.id} style={styles.expenseCard}>
                        <Card.Content>
                            <View style={styles.expenseHeader}>
                                <View>
                                    <Text variant="titleMedium" style={styles.expenseTitle}>{expense.title}</Text>
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
                            onChangeText={setAmount}
                            mode="outlined"
                            style={styles.input}
                            keyboardType="decimal-pad"
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
                                {friends.map(friend => (
                                    <Chip
                                        key={friend.id}
                                        selected={selectedFriends.includes(friend.id)}
                                        onPress={() => {
                                            setSelectedFriends(
                                                selectedFriends.includes(friend.id)
                                                    ? selectedFriends.filter(id => id !== friend.id)
                                                    : [...selectedFriends, friend.id]
                                            );
                                        }}
                                        style={[styles.chip, selectedFriends.includes(friend.id) && styles.selectedChip]}
                                        textStyle={styles.chipText}
                                    >
                                        {friend.name}
                                    </Chip>
                                ))}
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

                        {splitType === 'custom' && (
                            <View style={styles.customSplitContainer}>
                                {(selectedGroup
                                    ? groups.find(g => g.id === selectedGroup)?.members || []
                                    : friends.filter(f => selectedFriends.includes(f.id))
                                ).map(person => (
                                    <TextInput
                                        key={person.id}
                                        label={`Amount for ${person.full_name || person.name}`}
                                        value={customAmounts[person.id]?.toString() || ''}
                                        onChangeText={(value) => setCustomAmounts({
                                            ...customAmounts,
                                            [person.id]: parseFloat(value) || 0
                                        })}
                                        mode="outlined"
                                        style={styles.input}
                                        keyboardType="decimal-pad"
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
                onPress={() => setCreateModalVisible(true)}
                label="Add Expense"
                color="white"
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    headerText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 20,
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
        backgroundColor: '#42B095', // Changed to match container background color
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
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
}); 