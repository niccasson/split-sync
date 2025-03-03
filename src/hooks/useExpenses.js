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
            console.log('\n[FETCH] Current user ID:', user.id);

            if (!user) throw new Error('No user logged in');

            const queryString = `
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
                ),
                shares:expense_shares (
                    id,
                    amount,
                    paid,
                    user:user_id (
                        id,
                        full_name,
                        email
                    )
                )
            `;

            console.log('[QUERY] Fetching expenses created by user...');
            const { data: createdExpenses, error: createdError } = await supabase
                .from('expenses')
                .select(queryString)
                .eq('created_by', user.id);

            if (createdError) {
                console.error('[ERROR] Failed to fetch created expenses:', createdError);
                throw createdError;
            }
            console.log('[RESULT] Created expenses:', JSON.stringify(createdExpenses, null, 2));

            console.log('[QUERY] Fetching expenses where user is participant...');
            const { data: participatingExpenses, error: participatingError } = await supabase
                .from('expenses')
                .select(queryString)
                .eq('shares.user_id', user.id);

            if (participatingError) {
                console.error('[ERROR] Failed to fetch participating expenses:', participatingError);
                throw participatingError;
            }
            console.log('[RESULT] Participating expenses:', JSON.stringify(participatingExpenses, null, 2));

            // Combine and deduplicate results
            const allExpenses = [...(createdExpenses || []), ...(participatingExpenses || [])];
            const uniqueExpenses = Array.from(new Map(allExpenses.map(item => [item.id, item])).values());
            console.log('[INFO] Combined unique expenses:', JSON.stringify(uniqueExpenses, null, 2));

            // Transform the data structure
            const transformedExpenses = uniqueExpenses.map(expense => ({
                id: expense.id,
                title: expense.title,
                description: expense.description,
                totalAmount: expense.amount,
                groupId: expense.group?.id,
                groupName: expense.group?.name,
                createdAt: expense.created_at,
                creator: expense.creator,
                isOwner: expense.created_by === user.id,
                shares: expense.shares.map(share => ({
                    id: share.id,
                    amount: share.amount,
                    paid: share.paid,
                    user: share.user
                })),
                userShare: expense.shares.find(share => share.user.id === user.id)
            }));

            console.log('[INFO] Transformed expenses:', JSON.stringify(transformedExpenses, null, 2));
            setExpenses(transformedExpenses);
        } catch (err) {
            console.error('[ERROR] Error in fetchExpenses:', err);
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
            console.log('\n[CREATE EXPENSE] Starting expense creation...');
            console.log('[DEBUG] Expense data received:', JSON.stringify(expenseData, null, 2));

            if (!user) throw new Error('No user logged in');

            // Create the expense
            console.log('\n[QUERY] Inserting into expenses table:', {
                title: expenseData.title,
                description: expenseData.description,
                amount: expenseData.totalAmount,
                group_id: expenseData.groupId,
                created_by: user.id
            });

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

            if (expenseError) {
                console.error('[ERROR] Failed to create expense:', expenseError);
                throw expenseError;
            }
            console.log('[SUCCESS] Created expense:', JSON.stringify(expense, null, 2));

            // Create expense shares
            const shares = expenseData.shares.map(share => ({
                expense_id: expense.id,
                user_id: share.userId,
                amount: share.amount,
                paid: false
            }));

            console.log('\n[QUERY] Inserting expense shares:', JSON.stringify(shares, null, 2));

            const { data: shareData, error: sharesError } = await supabase
                .from('expense_shares')
                .insert(shares)
                .select();

            if (sharesError) {
                console.error('[ERROR] Failed to create expense shares:', sharesError);
                throw sharesError;
            }
            console.log('[SUCCESS] Created expense shares:', JSON.stringify(shareData, null, 2));

            await fetchExpenses();
            console.log('[INFO] Expense creation completed successfully');
        } catch (err) {
            console.error('[ERROR] Error in createExpense:', err);
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
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', expenseId);

            if (error) throw error;

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