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
            console.log('Current user:', user);

            if (!user) throw new Error('No user logged in');

            // 1. Get registered friends from friendships
            const { data: initiatedFriendships, error: initiatedError } = await supabase
                .from('friendships')
                .select('friend_id')
                .eq('user_id', user.id)
                .eq('status', 'accepted');

            if (initiatedError) throw initiatedError;

            const { data: receivedFriendships, error: receivedError } = await supabase
                .from('friendships')
                .select('user_id')
                .eq('friend_id', user.id)
                .eq('status', 'accepted');

            if (receivedError) throw receivedError;

            // 2. Get manual friends
            const { data: manualFriends, error: manualError } = await supabase
                .from('manual_friends')
                .select('*')
                .eq('user_id', user.id);

            if (manualError) throw manualError;

            // Combine registered friend IDs
            const registeredFriendIds = [
                ...(initiatedFriendships || []).map(f => f.friend_id),
                ...(receivedFriendships || []).map(f => f.user_id)
            ];

            // 3. Get registered friend details if there are any
            let registeredFriends = [];
            if (registeredFriendIds.length > 0) {
                const { data: friendsData, error: friendsError } = await supabase
                    .from('users')
                    .select('id, email, full_name')
                    .in('id', registeredFriendIds);

                if (friendsError) throw friendsError;
                registeredFriends = friendsData.map(friend => ({
                    ...friend,
                    isRegistered: true,
                    isManualFriend: false,
                    balance: 0
                }));
            }

            // Transform manual friends
            const transformedManualFriends = (manualFriends || []).map(friend => ({
                id: friend.id,
                full_name: friend.name,
                email: null,
                isRegistered: false,
                isManualFriend: true,
                balance: 0
            }));

            // Combine both types of friends
            const allFriends = [...registeredFriends, ...transformedManualFriends];

            // Calculate balances for all friends
            for (const friend of allFriends) {
                try {
                    console.log('Calculating balance for friend:', friend);

                    const { data: userExpenses, error: userExpError } = await supabase
                        .from('expenses')
                        .select(`
                            id,
                            amount,
                            expense_shares (
                                id,
                                amount,
                                registered_user_id,
                                manual_friend_id,
                                is_manual_friend
                            )
                        `)
                        .eq('created_by', user.id);

                    console.log('User expenses:', userExpenses);

                    if (userExpError) throw userExpError;

                    const { data: friendExpenses, error: friendExpError } = await supabase
                        .from('expenses')
                        .select(`
                            id,
                            amount,
                            expense_shares (
                                id,
                                amount,
                                registered_user_id,
                                manual_friend_id,
                                is_manual_friend
                            )
                        `)
                        .eq('created_by', friend.id);

                    console.log('Friend expenses:', friendExpenses);

                    if (friendExpError && friend.isRegistered) throw friendExpError;

                    // What they owe you
                    const totalOwed = (userExpenses || [])
                        .reduce((sum, expense) => {
                            const friendShare = expense.expense_shares
                                ?.find(share => {
                                    const matches = (friend.isManualFriend && share.manual_friend_id === friend.id) ||
                                        (!friend.isManualFriend && share.registered_user_id === friend.id);
                                    console.log('Checking share:', {
                                        share,
                                        friendId: friend.id,
                                        isManualFriend: friend.isManualFriend,
                                        matches,
                                        manual_friend_id: share.manual_friend_id,
                                        registered_user_id: share.registered_user_id
                                    });
                                    return matches;
                                });
                            const amount = Number(friendShare?.amount) || 0;
                            console.log('Found share amount:', amount);
                            return sum + amount;
                        }, 0);

                    console.log('Total owed:', totalOwed);

                    // What you owe them
                    const totalOwes = friend.isRegistered ? (friendExpenses || [])
                        .reduce((sum, expense) => {
                            const userShare = expense.expense_shares
                                ?.find(share => share.registered_user_id === user.id);
                            const amount = Number(userShare?.amount) || 0;
                            console.log('Found user share amount:', amount);
                            return sum + amount;
                        }, 0) : 0;

                    console.log('Total owes:', totalOwes);

                    friend.balance = (totalOwed || 0) - (totalOwes || 0);
                    console.log('Final balance:', friend.balance);
                } catch (err) {
                    console.error('Error calculating balance:', err);
                    friend.balance = 0;
                }
            }

            setFriends(allFriends);
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
            console.log('Current user trying to add friend:', user);

            if (!user) throw new Error('No user logged in');

            // First find the friend in public.users table
            const { data: friendData, error: friendError } = await supabase
                .from('users')
                .select('id, email, full_name')
                .eq('email', email)
                .single();

            console.log('Found friend:', friendData);

            if (friendError || !friendData) {
                console.error('Friend lookup error:', friendError);
                throw new Error('User not found');
            }

            // Check if friendship already exists in either direction
            const { data: existingFriendship, error: existingError } = await supabase
                .from('friendships')
                .select('*')
                .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
                .or(`user_id.eq.${friendData.id},friend_id.eq.${friendData.id}`)
                .single();

            console.log('Existing friendship check:', existingFriendship);

            if (existingFriendship) {
                throw new Error('Already friends with this user');
            }

            // Create new friendship
            const { error: friendshipError } = await supabase
                .from('friendships')
                .insert([{
                    user_id: user.id,
                    friend_id: friendData.id,
                    status: 'accepted'
                }])
                .select()
                .single();

            if (friendshipError) {
                console.error('Friendship creation error:', friendshipError);
                throw friendshipError;
            }

            console.log('Successfully created friendship');
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