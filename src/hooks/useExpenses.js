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
            const { data: sharedExpenses, error: sharedError } = await supabase
                .from('expense_shares')
                .select('expense_id')
                .eq('user_id', user.id);

            if (sharedError) throw sharedError;

            // Combine all expense IDs
            const expenseIds = [
                ...(createdExpenses || []).map(e => e.id),
                ...(sharedExpenses || []).map(e => e.expense_id)
            ];

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

            // 4. Get all shares for these expenses
            const { data: allShares, error: sharesError } = await supabase
                .from('expense_shares')
                .select(`
                    id,
                    expense_id,
                    amount,
                    paid,
                    user:user_id (
                        id,
                        full_name,
                        email
                    )
                `)
                .in('expense_id', expenseIds);

            if (sharesError) throw sharesError;

            // Transform the data
            const transformedExpenses = expensesData.map(expense => {
                const expenseShares = allShares
                    .filter(share => share.expense_id === expense.id)
                    .map(share => ({
                        id: share.id,
                        amount: share.amount,
                        paid: share.paid,
                        user: share.user
                    }));

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
                    userShare: expenseShares.find(share => share.user.id === user.id)
                };
            });

            setExpenses(transformedExpenses);
        } catch (err) {
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

            const shares = expenseData.shares.map(share => ({
                expense_id: expense.id,
                user_id: share.userId,
                amount: share.amount,
                paid: false
            }));

            const { error: sharesError } = await supabase
                .from('expense_shares')
                .insert(shares);

            if (sharesError) throw sharesError;

            await fetchExpenses();
        } catch (err) {
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
        fetchExpenses();
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