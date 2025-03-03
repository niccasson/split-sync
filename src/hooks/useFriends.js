import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export const useFriends = () => {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchFriends = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            console.log('Current user ID:', user.id);

            if (!user) throw new Error('No user logged in');

            // Fetch friends with their details
            console.log('\n[QUERY] Fetching friendships from friendships table...');
            const { data: friendships, error: friendshipsError } = await supabase
                .from('friendships')
                .select(`
                    id,
                    friend:friend_id(
                        id,
                        email,
                        full_name
                    ),
                    status
                `)
                .eq('user_id', user.id)
                .eq('status', 'accepted');

            console.log('[RESULT] Friendships:', JSON.stringify(friendships, null, 2));

            if (friendshipsError) throw friendshipsError;

            // Transform friendships data and add default zero balances
            const transformedFriends = friendships.map(friendship => ({
                id: friendship.friend.id,
                name: friendship.friend.full_name,
                email: friendship.friend.email,
                balance: 0 // Default balance
            }));

            // Now fetch and calculate balances separately
            for (const friend of transformedFriends) {
                try {
                    console.log(`\n[QUERY] Fetching expenses for friend ${friend.name} (${friend.id})...`);

                    // Get expenses where user is creator
                    console.log('\n[QUERY] Getting expenses where current user is creator...');
                    const { data: userExpenses, error: userExpError } = await supabase
                        .from('expenses')
                        .select(`
                            id,
                            amount,
                            expense_shares (
                                id,
                                amount,
                                user_id
                            )
                        `)
                        .eq('created_by', user.id);

                    if (userExpError) {
                        console.error('[ERROR] User expenses query failed:', userExpError);
                    }

                    if (!userExpenses || userExpenses.length === 0) {
                        console.log('[INFO] No expenses found where current user is creator');
                    } else {
                        console.log('[RESULT] User created expenses:', JSON.stringify(userExpenses, null, 2));
                    }

                    // Get expenses where friend is creator
                    console.log('\n[QUERY] Getting expenses where friend is creator...');
                    const { data: friendExpenses, error: friendExpError } = await supabase
                        .from('expenses')
                        .select(`
                            id,
                            amount,
                            expense_shares (
                                id,
                                amount,
                                user_id
                            )
                        `)
                        .eq('created_by', friend.id);

                    if (friendExpError) {
                        console.error('[ERROR] Friend expenses query failed:', friendExpError);
                    }

                    if (!friendExpenses || friendExpenses.length === 0) {
                        console.log('[INFO] No expenses found where friend is creator');
                    } else {
                        console.log('[RESULT] Friend created expenses:', JSON.stringify(friendExpenses, null, 2));
                    }

                    // Calculate totals with empty array handling
                    const totalOwed = (userExpenses || [])
                        .reduce((sum, expense) => {
                            if (!expense.expense_shares || expense.expense_shares.length === 0) {
                                console.log(`[INFO] No shares found for expense ${expense.id}`);
                                return sum;
                            }
                            const friendShare = expense.expense_shares
                                ?.find(share => share.user_id === friend.id);
                            console.log(`[DEBUG] Friend share in expense ${expense.id}:`, friendShare || 'No share found');
                            return sum + (Number(friendShare?.amount) || 0);
                        }, 0);

                    const totalOwes = (friendExpenses || [])
                        .reduce((sum, expense) => {
                            if (!expense.expense_shares || expense.expense_shares.length === 0) {
                                console.log(`[INFO] No shares found for expense ${expense.id}`);
                                return sum;
                            }
                            const userShare = expense.expense_shares
                                ?.find(share => share.user_id === user.id);
                            console.log(`[DEBUG] User share in expense ${expense.id}:`, userShare || 'No share found');
                            return sum + (Number(userShare?.amount) || 0);
                        }, 0);

                    console.log(`[INFO] Balance calculation for ${friend.name}:`, {
                        totalOwed: totalOwed || 0,
                        totalOwes: totalOwes || 0,
                        netBalance: (totalOwed || 0) - (totalOwes || 0)
                    });

                    friend.balance = (totalOwed || 0) - (totalOwes || 0);

                } catch (err) {
                    console.error(`[ERROR] Error calculating balance for friend ${friend.id}:`, err);
                    console.error('[ERROR] Error details:', err);
                    friend.balance = 0; // Explicitly set to 0 on error
                }
            }

            console.log('\n[FINAL] Friends with balances:', JSON.stringify(transformedFriends, null, 2));
            setFriends(transformedFriends);
        } catch (err) {
            console.error('[ERROR] Error in fetchFriends:', err);
            setError(err.message);
            setFriends([]);
        } finally {
            setLoading(false);
        }
    };

    const addFriend = async (email) => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            console.log('Current user:', user);

            if (!user) throw new Error('No user logged in');

            // Find user by email
            const { data: friendData, error: friendError } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();

            console.log('Found friend:', friendData);
            if (friendError) {
                console.error('Error finding friend:', friendError);
                throw new Error('User not found');
            }

            // Check if friendship already exists
            const { data: existingFriendship, error: existingError } = await supabase
                .from('friendships')
                .select('id')
                .eq('user_id', user.id)
                .eq('friend_id', friendData.id)
                .single();

            console.log('Existing friendship:', existingFriendship);
            if (existingError) console.log('Existing friendship error:', existingError);

            if (existingFriendship) {
                throw new Error('Already friends with this user');
            }

            // Create friendship
            const { data: newFriendship, error: friendshipError } = await supabase
                .from('friendships')
                .insert([
                    {
                        user_id: user.id,
                        friend_id: friendData.id,
                        status: 'accepted' // For simplicity, auto-accepting friendships
                    }
                ])
                .select();

            console.log('New friendship created:', newFriendship);
            if (friendshipError) {
                console.error('Error creating friendship:', friendshipError);
                throw friendshipError;
            }

            // Refresh friends list
            console.log('Refreshing friends list...');
            await fetchFriends();
        } catch (err) {
            console.error('Error in addFriend:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('Initial friends fetch...');
        fetchFriends();
    }, []);

    return {
        friends,
        loading,
        error,
        addFriend,
        refreshFriends: fetchFriends
    };
}; 