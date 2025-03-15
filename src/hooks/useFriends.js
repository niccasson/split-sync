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

            if (!user) throw new Error('No user logged in');

            // 1. Get friendships where user is the initiator
            const { data: initiatedFriendships, error: initiatedError } = await supabase
                .from('friendships')
                .select('friend_id')
                .eq('user_id', user.id)
                .eq('status', 'accepted');

            if (initiatedError) throw initiatedError;

            // 2. Get friendships where user is the friend
            const { data: receivedFriendships, error: receivedError } = await supabase
                .from('friendships')
                .select('user_id')
                .eq('friend_id', user.id)
                .eq('status', 'accepted');

            if (receivedError) throw receivedError;

            // Combine all friend IDs
            const friendIds = [
                ...(initiatedFriendships || []).map(f => f.friend_id),
                ...(receivedFriendships || []).map(f => f.user_id)
            ];

            if (friendIds.length === 0) {
                setFriends([]);
                return;
            }

            // 3. Get all friend details
            const { data: friendsData, error: friendsError } = await supabase
                .from('users')
                .select('id, email, full_name')
                .in('id', friendIds);

            if (friendsError) throw friendsError;

            // Transform friends data with default balances
            const transformedFriends = friendsData.map(friend => ({
                id: friend.id,
                name: friend.full_name,
                email: friend.email,
                balance: 0
            }));

            // Calculate balances for each friend
            for (const friend of transformedFriends) {
                try {
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

                    if (userExpError) throw userExpError;

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

                    if (friendExpError) throw friendExpError;

                    const totalOwed = (userExpenses || [])
                        .reduce((sum, expense) => {
                            const friendShare = expense.expense_shares
                                ?.find(share => share.user_id === friend.id);
                            return sum + (Number(friendShare?.amount) || 0);
                        }, 0);

                    const totalOwes = (friendExpenses || [])
                        .reduce((sum, expense) => {
                            const userShare = expense.expense_shares
                                ?.find(share => share.user_id === user.id);
                            return sum + (Number(userShare?.amount) || 0);
                        }, 0);

                    friend.balance = (totalOwed || 0) - (totalOwes || 0);
                } catch (err) {
                    friend.balance = 0;
                }
            }

            setFriends(transformedFriends);
        } catch (err) {
            console.error('Error in fetchFriends:', err);
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

            if (!user) throw new Error('No user logged in');

            const { data: friendData, error: friendError } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();

            if (friendError) throw new Error('User not found');

            const { data: existingFriendship, error: existingError } = await supabase
                .from('friendships')
                .select('id')
                .eq('user_id', user.id)
                .eq('friend_id', friendData.id)
                .single();

            if (existingFriendship) {
                throw new Error('Already friends with this user');
            }

            const { error: friendshipError } = await supabase
                .from('friendships')
                .insert([{
                    user_id: user.id,
                    friend_id: friendData.id,
                    status: 'accepted'
                }]);

            if (friendshipError) throw friendshipError;

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