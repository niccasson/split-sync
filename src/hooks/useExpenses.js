import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export const useExpenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user logged in');

            // 1. Get expenses created by user
            const { data: createdExpenses, error: createdError } = await supabase
                .from('expenses')
                .select('id')
                .eq('created_by', user.id);

            if (createdError) throw createdError;

            // 2. Get expenses shared with user
            const [registeredShares, manualFriendsResult] = await Promise.all([
                // Get expenses shared with user directly
                supabase
                    .from('expense_shares')
                    .select('expense_id')
                    .eq('registered_user_id', user.id),

                // First get user's manual friends
                supabase
                    .from('manual_friends')
                    .select('id')
                    .eq('user_id', user.id)
            ]);

            if (registeredShares.error) throw registeredShares.error;
            if (manualFriendsResult.error) throw manualFriendsResult.error;

            // Then get expenses shared with manual friends
            const manualShares = manualFriendsResult.data.length > 0
                ? await supabase
                    .from('expense_shares')
                    .select('expense_id')
                    .in('manual_friend_id', manualFriendsResult.data.map(f => f.id))
                : { data: [] };

            if (manualShares.error) throw manualShares.error;

            // Combine all expense IDs
            const expenseIds = [...new Set([
                ...(createdExpenses || []).map(e => e.id),
                ...(registeredShares.data || []).map(e => e.expense_id),
                ...(manualShares.data || []).map(e => e.expense_id)
            ])];

            if (expenseIds.length === 0) {
                setExpenses([]);
                return;
            }

            // 3. Get full expense details
            const { data: expensesData, error: expensesError } = await supabase
                .from('expenses')
                .select(`
                    id,
                    title,
                    description,
                    amount,
                    created_at,
                    created_by,
                    group:group_id (
                        id,
                        name
                    ),
                    creator:created_by (
                        id,
                        full_name,
                        email
                    )
                `)
                .in('id', expenseIds);

            if (expensesError) throw expensesError;

            // Check what's in the expense_shares table
            const { data: checkShares, error: checkError } = await supabase
                .from('expense_shares')
                .select('*');

            // Get shares for these expenses
            const { data: allShares, error: sharesError } = await supabase
                .from('expense_shares')
                .select(`
                    id,
                    expense_id,
                    amount,
                    paid,
                    is_manual_friend,
                    registered_user_id,
                    manual_friend_id,
                    users!registered_user_id (
                        id,
                        full_name,
                        email
                    ),
                    manual_friends!manual_friend_id (
                        id,
                        name
                    )
                `)
                .in('expense_id', expenseIds);

            if (sharesError) {
                console.error('Error fetching shares:', sharesError);
                throw sharesError;
            }

            // Transform the data
            const transformedExpenses = expensesData.map(expense => {
                const expenseShares = (allShares || [])
                    .filter(share => share.expense_id === expense.id)
                    .map(share => ({
                        id: share.id,
                        amount: share.amount,
                        paid: share.paid,
                        user: share.is_manual_friend ? {
                            id: share.manual_friend_id,
                            full_name: share.manual_friends?.name,
                            email: null,
                            isManualFriend: true
                        } : {
                            id: share.registered_user_id,
                            full_name: share.users?.full_name,
                            email: share.users?.email,
                            isManualFriend: false
                        }
                    }))
                    .filter(share => share.user.id);

                return {
                    id: expense.id,
                    title: expense.title,
                    description: expense.description,
                    totalAmount: expense.amount,
                    groupId: expense.group?.id,
                    groupName: expense.group?.name,
                    createdAt: expense.created_at,
                    creator: expense.creator,
                    isOwner: expense.created_by === user.id,
                    shares: expenseShares,
                    userShare: expenseShares.find(share =>
                        (share.user.isManualFriend && share.user.id === share.manual_friend_id) ||
                        (!share.user.isManualFriend && share.user.id === user.id)
                    )
                };
            });

            setExpenses(transformedExpenses);
        } catch (err) {
            console.error('Error in fetchExpenses:', err);
            setError(err.message);
            setExpenses([]);
        } finally {
            setLoading(false);
        }
    };

    const createExpense = async (expenseData) => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user logged in');

            // First check which shares are for manual friends
            const userIds = expenseData.shares.map(share => share.userId);
            const { data: registeredUsers } = await supabase
                .from('users')
                .select('id')
                .in('id', userIds);

            // Create a set of registered user IDs for quick lookup
            const registeredUserIds = new Set(registeredUsers.map(u => u.id));

            // First create the expense
            const { data: expense, error: expenseError } = await supabase
                .from('expenses')
                .insert([{
                    title: expenseData.title,
                    description: expenseData.description,
                    amount: expenseData.totalAmount,
                    group_id: expenseData.groupId,
                    created_by: user.id
                }])
                .select()
                .single();

            if (expenseError) throw expenseError;

            // Debug log the shares we're about to create
            const shares = expenseData.shares.map(share => {
                const isManualFriend = !registeredUserIds.has(share.userId);

                if (isManualFriend) {
                    const manualShare = {
                        expense_id: expense.id,
                        registered_user_id: null,
                        manual_friend_id: share.userId,
                        is_manual_friend: true,
                        amount: share.amount,
                        paid: false
                    };
                    return manualShare;
                } else {
                    const registeredShare = {
                        expense_id: expense.id,
                        registered_user_id: share.userId,
                        manual_friend_id: null,
                        is_manual_friend: false,
                        amount: share.amount,
                        paid: false
                    };
                    return registeredShare;
                }
            });

            const { error: sharesError } = await supabase
                .from('expense_shares')
                .insert(shares);

            if (sharesError) {
                console.error('Error creating shares:', sharesError);
                throw sharesError;
            }

            await fetchExpenses();
        } catch (err) {
            console.error('Error in createExpense:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const markShareAsPaid = async (shareId) => {
        try {
            const { error } = await supabase
                .from('expense_shares')
                .update({ paid: true })
                .eq('id', shareId);

            if (error) throw error;

            await fetchExpenses();
        } catch (err) {
            throw err;
        }
    };

    const deleteExpense = async (expenseId) => {
        try {
            const { error: expenseError } = await supabase
                .from('expenses')
                .delete()
                .eq('id', expenseId);

            if (expenseError) throw expenseError;

            await fetchExpenses();
        } catch (err) {
            throw err;
        }
    };

    useEffect(() => {
        let mounted = true;
        let timeoutId;

        const loadExpenses = async () => {
            try {
                if (!mounted) return;
                await fetchExpenses();
            } catch (error) {
                console.error('Error loading expenses:', error);
            }
        };

        // Debounced refresh function
        const debouncedRefresh = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(loadExpenses, 300);
        };

        // Single subscription for all relevant tables
        const subscription = supabase
            .channel('expenses-channel')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'expenses'
            }, debouncedRefresh)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'expense_shares'
            }, debouncedRefresh)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'groups'
            }, debouncedRefresh)
            .subscribe();

        // Initial load
        loadExpenses();

        return () => {
            mounted = false;
            if (timeoutId) clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    return {
        expenses,
        loading,
        error,
        createExpense,
        markShareAsPaid,
        deleteExpense,
        refreshExpenses: fetchExpenses
    };
}; 