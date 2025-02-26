import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Card, Text, useTheme, FAB } from 'react-native-paper';

export const DashboardScreen = ({ navigation }) => {
    const theme = useTheme();

    // Dummy data for demonstration
    const balanceSummary = {
        totalOwed: 150.00,
        totalOwing: 75.50,
        netBalance: 74.50
    };

    const recentActivity = [
        { id: 1, title: 'Dinner at Restaurant', amount: 45.00, group: 'Friends Night Out' },
        { id: 2, title: 'Groceries', amount: 30.50, group: 'Roommates' },
        { id: 3, title: 'Movie Tickets', amount: 24.00, group: 'Weekend Plans' },
    ];

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
                                    ${balanceSummary.totalOwed}
                                </Text>
                            </View>
                            <View style={styles.balanceItem}>
                                <Text variant="labelLarge">You owe</Text>
                                <Text variant="headlineSmall" style={{ color: theme.colors.error }}>
                                    ${balanceSummary.totalOwing}
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
                                ${Math.abs(balanceSummary.netBalance)}
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
                            onPress={() => navigation.navigate('AddFriend')}
                        >
                            Add Friend
                        </Button>
                        <Button
                            mode="contained-tonal"
                            icon="account-group"
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('CreateGroup')}
                        >
                            New Group
                        </Button>
                    </View>
                </View>

                {/* Recent Activity */}
                <Card style={styles.recentActivityCard}>
                    <Card.Content>
                        <Text variant="titleLarge" style={styles.cardTitle}>Recent Activity</Text>
                        {recentActivity.map((activity) => (
                            <View key={activity.id} style={styles.activityItem}>
                                <View>
                                    <Text variant="titleMedium">{activity.title}</Text>
                                    <Text variant="bodySmall">{activity.group}</Text>
                                </View>
                                <Text variant="titleMedium">${activity.amount}</Text>
                            </View>
                        ))}
                    </Card.Content>
                </Card>
            </ScrollView>

            {/* FAB for adding new expense */}
            <FAB
                icon="plus"
                label="Add Expense"
                style={styles.fab}
                onPress={() => navigation.navigate('AddExpense')}
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
}); 