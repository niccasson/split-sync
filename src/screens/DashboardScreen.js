import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Button, Card, Text, useTheme, FAB } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { useFriends } from '../hooks/useFriends';
import { useExpenses } from '../hooks/useExpenses';

export const DashboardScreen = ({ navigation }) => {
    const { isChecking } = useAuth();
    const { friends, refreshFriends } = useFriends();
    const { expenses, refreshExpenses } = useExpenses();
    const theme = useTheme();

    // Add navigation listener for focus events
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            refreshFriends();
            refreshExpenses();
        });

        // Cleanup subscription on unmount
        return unsubscribe;
    }, [navigation, refreshFriends, refreshExpenses]);

    const balanceSummary = useMemo(() => {
        let totalOwed = 0;
        let totalOwing = 0;

        friends.forEach(friend => {
            if (friend.balance > 0) {
                totalOwed += friend.balance;
            } else {
                totalOwing += Math.abs(friend.balance);
            }
        });

        return {
            totalOwed,
            totalOwing,
            netBalance: totalOwed - totalOwing
        };
    }, [friends]);

    const recentActivity = useMemo(() => {
        return expenses
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
            .map(expense => ({
                id: expense.id,
                title: expense.title,
                amount: expense.totalAmount,
                group: expense.groupName || 'Personal'
            }));
    }, [expenses]);

    if (isChecking) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* Balance Summary */}
                <Card style={styles.balanceCard}>
                    <Card.Content>
                        <Text variant="titleLarge" style={styles.cardTitle}>Balance Summary</Text>
                        <View style={styles.balanceRow}>
                            <View style={styles.balanceItem}>
                                <Text variant="labelLarge">You are owed</Text>
                                <Text variant="headlineSmall" style={{ color: theme.colors.success }}>
                                    ${balanceSummary.totalOwed.toFixed(2)}
                                </Text>
                            </View>
                            <View style={styles.balanceItem}>
                                <Text variant="labelLarge">You owe</Text>
                                <Text variant="headlineSmall" style={{ color: theme.colors.error }}>
                                    ${balanceSummary.totalOwing.toFixed(2)}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.netBalance}>
                            <Text variant="titleMedium">Net Balance</Text>
                            <Text
                                variant="headlineMedium"
                                style={{
                                    color: balanceSummary.netBalance >= 0
                                        ? theme.colors.success
                                        : theme.colors.error
                                }}
                            >
                                ${Math.abs(balanceSummary.netBalance).toFixed(2)}
                            </Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <Text variant="titleLarge" style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionButtons}>
                        <Button
                            mode="contained-tonal"
                            icon="account-plus"
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('FriendsTab')}
                        >
                            Add Friend
                        </Button>
                        <Button
                            mode="contained-tonal"
                            icon="account-group"
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('GroupsTab')}
                        >
                            New Group
                        </Button>
                    </View>
                </View>

                {/* Recent Activity */}
                <Card style={styles.recentActivityCard}>
                    <Card.Content>
                        <Text variant="titleLarge" style={styles.cardTitle}>Recent Activity</Text>
                        {recentActivity.length > 0 ? (
                            recentActivity.map((activity) => (
                                <View key={activity.id} style={styles.activityItem}>
                                    <View>
                                        <Text variant="titleMedium">{activity.title}</Text>
                                        <Text variant="bodySmall">{activity.group}</Text>
                                    </View>
                                    <Text variant="titleMedium">${activity.amount.toFixed(2)}</Text>
                                </View>
                            ))
                        ) : (
                            <Text variant="bodyMedium" style={styles.noActivity}>
                                No recent activity
                            </Text>
                        )}
                    </Card.Content>
                </Card>
            </ScrollView>

            {/* FAB for adding new expense */}
            <FAB
                icon="plus"
                label="Add Expense"
                style={styles.fab}
                onPress={() => navigation.navigate('ExpensesTab')}
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
    balanceCard: {
        marginBottom: 16,
    },
    cardTitle: {
        marginBottom: 16,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    balanceItem: {
        alignItems: 'center',
    },
    netBalance: {
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    quickActions: {
        marginBottom: 16,
    },
    sectionTitle: {
        marginBottom: 12,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flex: 1,
        marginHorizontal: 4,
    },
    recentActivityCard: {
        marginBottom: 16,
    },
    activityItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noActivity: {
        textAlign: 'center',
        color: '#888',
    },
}); 