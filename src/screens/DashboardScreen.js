import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Button, Card, Text, useTheme, FAB } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { useFriends } from '../hooks/useFriends';
import { useExpenses } from '../hooks/useExpenses';
import { useGroups } from '../hooks/useGroups';
import { LogoIcon } from '../components/LogoIcon';
import { useFocusEffect } from '@react-navigation/native';

export const DashboardScreen = ({ navigation }) => {
    const { isChecking } = useAuth();
    const { friends, refreshFriends, loading: friendsLoading } = useFriends();
    const { expenses, refreshExpenses, loading: expensesLoading } = useExpenses();
    const { groups, refreshGroups, loading: groupsLoading } = useGroups();
    const theme = useTheme();

    // Add state to track initial load
    const [hasLoaded, setHasLoaded] = useState(false);

    console.log('DashboardScreen render', {
        isChecking,
        friendsLoading,
        expensesLoading,
        groupsLoading,
        friendsCount: friends.length,
        expensesCount: expenses.length,
        groupsCount: groups.length
    });

    useFocusEffect(
        useCallback(() => {
            console.log('DashboardScreen focus effect triggered');

            // Only refresh if we haven't loaded yet
            if (!hasLoaded) {
                const loadData = async () => {
                    console.log('DashboardScreen starting refresh');
                    await Promise.all([
                        refreshExpenses(),
                        refreshFriends(),
                        refreshGroups()
                    ]);
                    setHasLoaded(true);
                };
                loadData();
            }

            return () => {
                console.log('DashboardScreen focus effect cleanup');
            };
        }, [hasLoaded]) // Add hasLoaded to dependencies
    );

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
                group: expense.groupName || 'Personal',
                createdAt: expense.createdAt
            }));
    }, [expenses]);

    if (isChecking || expensesLoading || friendsLoading || groupsLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#42B095" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <LogoIcon />
                    </View>
                    <Text variant="headlineMedium" style={styles.headerText}>Dashboard</Text>
                </View>

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
                <Text variant="titleLarge" style={styles.quickActionsTitle}>Quick Actions</Text>
                <View style={styles.actionButtons}>
                    <Button
                        mode="outlined"
                        icon="account-plus"
                        style={styles.actionButton}
                        buttonColor="#F5F5F5"
                        textColor="#424242"
                        onPress={() => navigation.navigate('FriendsTab')}
                    >
                        Add Friend
                    </Button>
                    <Button
                        mode="outlined"
                        icon="account-group"
                        style={styles.actionButton}
                        buttonColor="#F5F5F5"
                        textColor="#424242"
                        onPress={() => navigation.navigate('GroupsTab')}
                    >
                        New Group
                    </Button>
                </View>

                {/* Recent Activity */}
                <Card style={styles.recentActivityCard}>
                    <Card.Content>
                        <Text variant="titleLarge" style={styles.cardTitle}>Recent Activity</Text>
                        {recentActivity.length > 0 ? (
                            recentActivity.map((activity) => (
                                <View key={activity.id} style={styles.activityItem}>
                                    <View>
                                        <Text variant="titleMedium" style={styles.activityTitle}>{activity.title}</Text>
                                        <Text variant="bodySmall" style={styles.activityDate}>
                                            {new Date(activity.createdAt).toLocaleDateString()}
                                        </Text>
                                        <Text variant="bodySmall">{activity.group}</Text>
                                    </View>
                                    <Text variant="titleMedium" style={styles.activityAmount}>${activity.amount.toFixed(2)}</Text>
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

            {/* FAB */}
            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => navigation.navigate('ExpensesTab')}
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
    header: {
        position: 'relative',
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    logoContainer: {
        position: 'absolute',
        left: 20,
        top: 0,
    },
    headerText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '600',
        marginTop: 8,
    },
    cardTitle: {
        color: '#424242',
        marginBottom: 16,
    },
    quickActionsTitle: {
        color: '#FFFFFF',
        marginBottom: 12,
        marginTop: 16,
    },
    balanceCard: {
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        elevation: 2,
        borderRadius: 12,
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
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    actionButton: {
        flex: 1,
        marginHorizontal: 4,
        backgroundColor: '#F5F5F5',
        borderColor: '#424242',
    },
    recentActivityCard: {
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        elevation: 2,
        borderRadius: 12,
    },
    activityItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    activityTitle: {
        color: '#424242',
    },
    activityAmount: {
        color: '#424242',
    },
    activityDate: {
        fontSize: 12,
        color: '#424242',
        opacity: 0.6,
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
    noActivity: {
        textAlign: 'center',
        color: '#888',
    },
}); 